import { bettingEngine } from "./betting";
import { Deck } from "./deck";
import { GameStateManager } from "./state-manager";
import { GameState, GamePhase } from "./types";

const SMALL_BLIND=5;
const BIG_BLIND=10;

export class GameFlowManager{

    //start a new hand 
    static startNewHand(state:GameState):void {
        GameStateManager.resetForNextHand(state);

        const deck = new Deck();

        //post blinds
        const smallBlindPlayer=state.players[state.smallBlindIndex];
        const bigBlindPlayer=state.players[state.bigBlindIndex];

        if(smallBlindPlayer){
            bettingEngine.postBlind(state, smallBlindPlayer.id, SMALL_BLIND);
        }

        if(bigBlindPlayer){
            bettingEngine.postBlind(state, bigBlindPlayer.id, BIG_BLIND);
        }

        state.currentBet=BIG_BLIND;

        //Deal two hole cards to each player (only active players, not spectators)
        state.players.forEach(player=>{
            if(player.status === 'active'){
                player.holeCards=[deck.draw(), deck.draw()];
            }
        });

        state.deck=deck.cards;

        //start action at UTG (first player after BB)
        state.currentPlayerIndex=this.getFirstToActIndex(state);
        state.phase='preflop';

        //check if betting round is complete (e.g. if everyone is all-in after blinds)
        if(GameStateManager.isBettingComplete(state)){
            this.advanceToNextRound(state);
        }
    }

    //get first player to act in preflop (UTG)
    private static getFirstToActIndex(state:GameState):number{
        //in heads-up: SB acts first preflop and BB acts first postflop
        //in multi-way: UTG
        const activeCount = state.players.filter(p => p.status === 'active').length;
        if(activeCount === 2){
            return state.smallBlindIndex;
        }

        let index=(state.bigBlindIndex+1)%state.players.length;
        while(state.players[index].status !== 'active'){
            index=(index+1)%state.players.length;
        }
        return index;
    }

    //get first player to act in postflop (SB or first active to left of button)
    private static getFirstToActPostflopIndex(state:GameState):number{
        let index = state.dealerIndex;
        const numPlayers = state.players.length;
        for (let i = 0; i < numPlayers; i++) {
            index = (index + 1) % numPlayers;
            const player = state.players[index];
            if (player.status === 'active' && player.chips > 0) {
                return index;
            }
        }
        return state.dealerIndex;
    }

    //deal community cards for current phase
    static dealCommunityCards(state:GameState):void{
        const drawCard = () => {
            const card = state.deck.pop();
            if (!card) throw new Error('deck is empty');
            return card;
        };

        if(state.phase==='flop') state.communityCards=[drawCard(), drawCard(), drawCard()];
        else if(state.phase==='turn') state.communityCards.push(drawCard());
        else if(state.phase==='river') state.communityCards.push(drawCard());
    }

    //advance to next betting round
    static advanceToNextRound(state:GameState):void{

        //advance phase
        GameStateManager.advancePhase(state);

        if(state.phase==='showdown') return; //game over, move to showdown handling

        //deal community cards
        this.dealCommunityCards(state);

        // Check if no more betting is possible (run out the board)
        const playersWithChips = state.players.filter(p => p.status === 'active' && p.chips > 0);
        if (playersWithChips.length <= 1) {
            // Run out the rest of the board cards until showdown
            while ((state.phase as GamePhase) !== 'showdown') {
                GameStateManager.advancePhase(state);
                if ((state.phase as GamePhase) !== 'showdown') {
                    this.dealCommunityCards(state);
                }
            }
            return;
        }

        //reset bets for new round
        state.players.forEach(p=>{
            if(p.status!=='folded'){
                p.bet=0;
            }
        });
        state.currentBet=0;
        state.minRaise=0;
        //set action to first active player
        state.currentPlayerIndex=this.getFirstToActPostflopIndex(state);
    }

    //process action and advance turn
    static processAction(state: GameState, playerId: number, action:string, amount:number=0):void{
        const player = state.players.find(p => p.id === playerId);
        if (!player) throw new Error('Player not found');

        //validate if its this player's turn
        const currentPlayer=state.players[state.currentPlayerIndex];
        if(currentPlayer.id!==playerId){
            throw new Error(`Not this player's turn`)
        }

        //process action
        if(action==='fold')
            bettingEngine.fold(state, playerId);
        else if(action==='check')
            bettingEngine.check(state, playerId);
        else if(action==='call')
            bettingEngine.call(state, playerId);
        else if(action==='raise')
            bettingEngine.raise(state, playerId, amount);

        //advance to next player
        state.currentPlayerIndex=GameStateManager.getNextActivePlayerIndex(state, state.currentPlayerIndex); 

        //check if betting round is complete
        if(GameStateManager.isBettingComplete(state)){
            this.advanceToNextRound(state);
        }

        state.lastActionTime=Date.now();
    }

    //get active players (for showdown)
    static getShowdownPlayers(state:GameState){
        return state.players.filter(p=>p.status !== 'folded');
    }
}