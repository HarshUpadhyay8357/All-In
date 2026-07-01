import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "../sockets/types";
import { GameState, Player, GamePhase } from "../game/types";
import { GameStateManager } from "../game/state-manager";
import { RoomService } from "./room-service";
import { Card } from "../game/deck";
import { GameFlowManager } from "../game/game-flow";
import { redisCache } from "../cache/redis";
import { handEvaluator } from "../game/hand-evaluator";
import { SidePotCalculator } from "../game/side-pot";
import { db } from "../db";
import { rooms } from "../db/schema";
import { eq } from "drizzle-orm";

type IoType=Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>;

//track turn timers per room (server memory)
const turnTimers:Map<string, NodeJS.Timeout>=new Map();
const tickTimers:Map<string, NodeJS.Timeout>=new Map();

export class GameService{
    private io: IoType;

    constructor(io:IoType){
        this.io=io;
    }

    //broadcast santitized state to all player in a room
    async broadcastGameState(roomId: string, gameState:GameState){
        const socketsInRoom=await this.io.in(roomId).fetchSockets();

        for (const socket of socketsInRoom) {
            const userId=socket.data.userId;
            const santitized=GameStateManager.getSanitizedState(gameState, userId);
            socket.emit('game_state_update', {gameState:santitized});
        }
    }

    //start the game
    async startGame(roomId:string){

        const existingState = await redisCache.getGameState(roomId) as GameState | null;
  if (existingState) {
    console.log(`[startGame] Room ${roomId} already has an active game - ignoring duplicate start_game call.`);
    return;
  }

        const players=await RoomService.getPlayersInRoom(roomId);

        if(players.length<2){
            this.io.to(roomId).emit('error', {message:'need atleast 2 players'});
            return;
        }

        //build player objects for game engine
        const gamePlayers: Player[] = players.map(p=>({
            id: p.userId!,
            username:'',           // will fill from socket data
            holeCards: [] as Card[],
            chips: p.currentChips || 1000,
            bet: 0,
            totalBetThisHand: 0,
            status: 'active' as const,
            seatNumber: p.seatNumber || 0,
            isDealer: false,
            isSmallBlind: false,
            isBigBlind: false,


        }));

        //fill usernames from connected sockets
        const socketsInRoom=await this.io.in(roomId).fetchSockets();
        for (const socket of socketsInRoom) {
            const player=gamePlayers.find(p=>p.id===socket.data.userId);
            if (player) player.username=socket.data.username;
        }

        const room = await db.select().from(rooms).where(eq(rooms.id, roomId));
        const hostId = room[0]?.hostId || gamePlayers[0]?.id || 0;

        //initialize game state
        const gameState=GameStateManager.initialize(roomId, gamePlayers, hostId);

        //start first hand
        GameFlowManager.startNewHand(gameState);

        //save to redis
        await redisCache.setGameState(roomId, gameState);

        //update room status
        await RoomService.updateRoomStatus(roomId, 'playing');

        // Check if showdown was reached immediately (forced all-ins from blinds)
        if (gameState.phase === 'showdown') {
            await this.handleShowdown(roomId, gameState);
            return;
        }

        //broadcast state (santitized per player)
        await this.broadcastGameState(roomId, gameState);

        //send private hole cards to each player
        this.sendPrivateCards(roomId, gameState);

        //start turn timer
        this.startTurnTimer(roomId, gameState);
    }

    //send private hole cards only to the owning players
    async sendPrivateCards(roomId: string, gameState: GameState){
        const socketsInRoom=await this.io.in(roomId).fetchSockets();
        for (const socket of socketsInRoom) {
            const player=gameState.players.find(p=>p.id===socket.data.userId);
            if(player && player.holeCards.length>0){
                socket.emit('private_cards', {holeCards:player.holeCards});
            }
        }
    }

    //handle user action (fold/check/call/raise)
    async handlePlayerAction(roomId:string, userId:number, action:'check'|'call'|'raise'|'fold', amount?:number){
        const gameState=await redisCache.getGameState(roomId) as GameState;
        if(!gameState) return;

        const currentPlayer=gameState.players[gameState.currentPlayerIndex];
        if(currentPlayer.id!==userId){
            const socket=(await this.io.in(roomId).fetchSockets()).find(s=>s.data.userId===userId);
            socket?.emit('error', {message:'not your turn'});
            return;
        }

        try {
            //process action
            GameFlowManager.processAction(gameState, userId, action, amount||0);
        } catch (err: any) {
            console.error(`[handlePlayerAction] processAction failed in room ${roomId}:`, err.message);
            return;
        }

        //clear the current turn timer after successful action
        this.clearTurnTimer(roomId);

        //check if only one active player left (if everyone else has folded/spectating)
        const activePlayers=gameState.players.filter(p=>p.status === 'active' || p.status === 'all-in')
        if(activePlayers.length===1){
            await this.handleAutoWin(roomId, gameState, activePlayers[0]);
            return;
        }

        //check if we reached showdown
        if(gameState.phase==='showdown'){
            await this.handleShowdown(roomId, gameState);
            return;
        }

        //save updated state
        await redisCache.setGameState(roomId, gameState);

        //broadcast updated state
        await this.broadcastGameState(roomId, gameState);

        //start next turn timer
        this.startTurnTimer(roomId, gameState);
    }

    //handle showdown - evaluate hands and awad pots
    async handleShowdown(roomId:string, gameState:GameState){
        const activePlayers=gameState.players.filter(p=>p.status === 'active' || p.status === 'all-in');

        // Track initial chips of all players to identify winners post-award
        const initialChips = new Map<number, number>();
        gameState.players.forEach(p => {
            initialChips.set(p.id, p.chips);
        });

        //evaluate hands
        const playerWithCards=activePlayers.map(p=>({
            id:p.id,
            cards: [...p.holeCards, ...gameState.communityCards],
        }));

        const winners=handEvaluator.findWinners(playerWithCards);

        //calculate sidepots
        const sidepots=SidePotCalculator.calculate(gameState);

        //for each sidepot find eligible winners
        const winnersByPot=sidepots.map(pot=>{
            const eligibleWinners=winners.filter(w=>pot.eligible.includes(w.playerId));
            return eligibleWinners.length>0 ? eligibleWinners.map(w=>w.playerId) : pot.eligible;
        })

        //award pots
        SidePotCalculator.awardPots(gameState,sidepots, winnersByPot);

        //save updated state with awarded chips
        await redisCache.setGameState(roomId, gameState);

        //reveal all cards(not santitized for showdown phase)
        this.io.to(roomId).emit('game_state_update',{gameState});

        // Find everyone who won chips in this hand
        const handWinners: Array<{ id: number, username: string, amount: number }> = [];
        gameState.players.forEach(p => {
            const startChips = initialChips.get(p.id) || 0;
            if (p.chips > startChips) {
                handWinners.push({
                    id: p.id,
                    username: p.username,
                    amount: p.chips - startChips
                });
            }
        });

        //announce winners (including main and side pot winners)
        if (handWinners.length > 0) {
            const winnerUsername = handWinners.map(w => `${w.username} (${w.amount})`).join(' & ');
            const totalWon = handWinners.reduce((sum, w) => sum + w.amount, 0);
            this.io.to(roomId).emit('game_over', {
                winnerId: handWinners[0].id,
                winnerUsername,
                pot: totalWon
            });
        }

        const playersWithChips = gameState.players.filter(p => p.chips > 0 && p.status !== 'disconnected');
        if (playersWithChips.length <= 1) {
            gameState.phase = 'finished';
            await redisCache.setGameState(roomId, gameState);
            this.io.to(roomId).emit('game_state_update', { gameState });
            
            const matchWinner = playersWithChips[0] || gameState.players[0];
            this.io.to(roomId).emit('match_finished', {
                winnerId: matchWinner.id,
                winnerUsername: matchWinner.username,
                chips: matchWinner.chips
            });
            await RoomService.updateRoomStatus(roomId, 'finished');
            return;
        }

        //wait 5 seconds before starting next hand
        setTimeout(async () => {
            GameStateManager.resetForNextHand(gameState);
            GameFlowManager.startNewHand(gameState);

            if (gameState.phase === 'showdown') {
                await this.handleShowdown(roomId, gameState);
                return;
            }

            await redisCache.setGameState(roomId, gameState);
            await this.broadcastGameState(roomId, gameState);
            this.sendPrivateCards(roomId, gameState);
            this.startTurnTimer(roomId, gameState);
        }, 5000);
    }

    //auto-win when everyone else folds
    async handleAutoWin(roomId:string, gameState:GameState, winner:Player){
        winner.chips+=gameState.pot;
        await redisCache.setGameState(roomId,gameState);
        this.io.to(roomId).emit('game_over', {
            winnerId: winner.id, 
            winnerUsername: `${winner.username} (${gameState.pot})`, 
            pot: gameState.pot
        });

        const playersWithChips = gameState.players.filter(p => p.chips > 0 && p.status !== 'disconnected');
        if (playersWithChips.length <= 1) {
            gameState.phase = 'finished';
            await redisCache.setGameState(roomId, gameState);
            this.io.to(roomId).emit('game_state_update', { gameState });
            
            const matchWinner = playersWithChips[0] || gameState.players[0];
            this.io.to(roomId).emit('match_finished', {
                winnerId: matchWinner.id,
                winnerUsername: matchWinner.username,
                chips: matchWinner.chips
            });
            await RoomService.updateRoomStatus(roomId, 'finished');
            return;
        }

        //start next hand after 5 seconds
        setTimeout(async () => {
            GameStateManager.resetForNextHand(gameState);
            GameFlowManager.startNewHand(gameState);

            if (gameState.phase === 'showdown') {
                await this.handleShowdown(roomId, gameState);
                return;
            }

            await redisCache.setGameState(roomId, gameState);
            await this.broadcastGameState(roomId, gameState);
            this.sendPrivateCards(roomId, gameState);
            this.startTurnTimer(roomId, gameState);
        }, 5000);
    }

    //start turn timer(30 seconds)
    startTurnTimer(roomId:string, gameState:GameState){
        // Ensure any preexisting timer for this room is completely cleared first
        this.clearTurnTimer(roomId);

        const TURN_SECONDS=30;
        const currentPlayer=gameState.players[gameState.currentPlayerIndex];
        if(!currentPlayer || currentPlayer.status!=='active') return;

        //notify whose turn it is
        this.io.to(roomId).emit('turn_start',{userId:currentPlayer.id, timeLimit:TURN_SECONDS});

        let seconds_left=TURN_SECONDS;

        //tick every second
        const tick=setInterval(() => {
            seconds_left--;
            this.io.to(roomId).emit('turn_tick',{secondsLeft:seconds_left});

            if(seconds_left<=0){
                clearInterval(tick);
                tickTimers.delete(roomId);
            }
        }, 1000);

        tickTimers.set(roomId, tick);

        //auto-fold after 30 seconds
        const Timeout=setTimeout(async () => {
            clearInterval(tick);
            turnTimers.delete(roomId);
            tickTimers.delete(roomId);

            //auto fold the current player
            await this.handlePlayerAction(roomId, currentPlayer.id, 'fold');
        }, TURN_SECONDS*1000);

        turnTimers.set(roomId, Timeout);
    }

    //clear turn timer
    clearTurnTimer(roomId: string) {
    const timeout = turnTimers.get(roomId);
    const tick = tickTimers.get(roomId);

    if (timeout) {
      clearTimeout(timeout);
      turnTimers.delete(roomId);
    }
    if (tick) {
      clearInterval(tick);
      tickTimers.delete(roomId);
    }
  }

  //restart the game
  async restartGame(roomId: string, userId: number) {
    const gameState = await redisCache.getGameState(roomId) as GameState;
    if (!gameState) return;

    if (gameState.hostId !== userId) {
      throw new Error("Only the room host can restart the game");
    }

    const room = await db.select().from(rooms).where(eq(rooms.id, roomId));
    const buyin = room[0]?.buyin || 1000;

    gameState.handNumber = 1;
    gameState.dealerIndex = 0;
    const isHeadsUp = gameState.players.length === 2;
    gameState.smallBlindIndex = isHeadsUp ? 0 : 1 % gameState.players.length;
    gameState.bigBlindIndex = isHeadsUp ? 1 : 2 % gameState.players.length;

    gameState.players.forEach((p, i) => {
      p.chips = buyin;
      p.bet = 0;
      p.totalBetThisHand = 0;
      p.holeCards = [];
      p.isDealer = i === gameState.dealerIndex;
      p.isSmallBlind = i === gameState.smallBlindIndex;
      p.isBigBlind = i === gameState.bigBlindIndex;
      if (p.status !== 'disconnected') {
        p.status = 'active';
      }
    });

    gameState.phase = 'preflop';
    gameState.pot = 0;
    gameState.sidePots = { amount: 0, eligible: [] };
    gameState.currentBet = 0;
    gameState.minRaise = 0;
    gameState.actionHistory = [];

    GameFlowManager.startNewHand(gameState);

    if ((gameState.phase as GamePhase) === 'showdown') {
      await this.handleShowdown(roomId, gameState);
      return;
    }

    await redisCache.setGameState(roomId, gameState);
    await RoomService.updateRoomStatus(roomId, 'playing');
    await this.broadcastGameState(roomId, gameState);
    this.sendPrivateCards(roomId, gameState);
    this.startTurnTimer(roomId, gameState);
  }
}