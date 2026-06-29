import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents, SocketData } from "./types";
import { GameService } from "../services/game-service";
import { auth } from "../utils/auth";
import { redisCache } from "../cache/redis";
import { GameState } from "../game/types";
import { GameStateManager } from "../game/state-manager";
import { RoomService } from "../services/room-service";

export function initializeSocket(io: Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>){
    const gameService=new GameService(io);
 
    //middleware: authorize socket connection via JWT
    io.use((socket, next)=>{
        const token=socket.handshake.auth.token;

        if(!token){
            return next(new Error('no token provided'));
        }

        const decoded=auth.verifyAccessToken(token);
        if(!decoded){
            return next(new Error('invalid token'));
        }

        //store user info on socket 
        socket.data.userId=decoded.userId;
        socket.data.username=decoded.username;
        socket.data.roomId=null;
        next();        
    });

    io.on('connection', async (socket) => {
        console.log(`user connected: ${socket.data.userId} ${socket.data.username}`);

        //JOIN ROOM
        socket.on('join_room', async({roomId}) => {
            try {
                const userId=socket.data.userId;

                //check if game is in progress and player is rejoining
                const existingState=await redisCache.getGameState(roomId) as GameState|null;
                if(existingState){
                    //reconnect flow
                    const existingPlayer=existingState.players.find(p=>p.id===userId);
                    if(existingPlayer){
                        //rejoin the socket room
                        socket.join(roomId);
                        socket.data.roomId=roomId;

                        //send the sanitized state back to this player only
                        const sanitized=GameStateManager.getSanitizedState(existingState,userId);
                        socket.emit('game_state_update',{gameState:sanitized});

                        //resend their private hole cards back
                        if(existingPlayer.holeCards.length>0){
                            socket.emit('private_cards',{holeCards:existingPlayer.holeCards});
                        }

                        //notify others
                        socket.to(roomId).emit('player_reconnected',{userId, username:socket.data.username}); 
                        console.log(`${socket.data.username} reconnected to ${roomId}`);
                        return;
                    }
                }

                //normal join flow
                const {seatNumber}=await RoomService.joinRoom(roomId, userId, 1000);
                if (seatNumber === null) {
                    throw new Error("No seat available in this room");
                }
                socket.join(roomId);
                socket.data.roomId=roomId;

                const players=await RoomService.getPlayersInRoom(roomId);

                //confirm to joining player
                socket.emit('room_joined',{roomId, seatNumber, players});
                //notify everone else
                socket.to(roomId).emit('room_updated',{players});
                
            } catch (error:any) {
                socket.emit('error', {message:error.message});
            }
        });

        //PLAYER READY --> we just broadcast it to the room so the host can see
        socket.on('player_ready',async ({roomId})=>{
            socket.to(roomId).emit('room_updated',{
                players:await RoomService.getPlayersInRoom(roomId)
            });
        });

        //START GAME
        socket.on('start_game',async ({roomId}) => {
            try {
    await gameService.startGame(roomId);
  } catch (error: any) {
    socket.emit('error', { message: error.message });
  }
        });

        //PLAYER ACTION
        socket.on('player_action', async ({roomId, action, amount}) => {
            try {
                await gameService.handlePlayerAction(roomId, socket.data.userId, action, amount);
            } catch (error : any) {
                socket.emit('error',{message:error.message})
            }
        });

        //RESTART GAME
        socket.on('restart_game', async ({roomId}) => {
            try {
                await gameService.restartGame(roomId, socket.data.userId);
            } catch (error : any) {
                socket.emit('error',{message:error.message})
            }
        });

        //LEAVE ROOM
        socket.on('leave_room',async ({roomId}) => {
            try {
                await RoomService.leaveRoom(roomId, socket.data.userId);
                socket.leave(roomId);
                socket.data.roomId=null;

                const players=await RoomService.getPlayersInRoom(roomId);
                socket.to(roomId).emit('room_updated', {players});
            } catch (error : any) {
                socket.emit('error',{message:error.message})
            }
        });

        //DISCONNECT
        socket.on('disconnect', async ()=>{
            const roomId=socket.data.roomId;
            if(roomId){
                //dont remove from active sessions to allow reconnections
                //notify other users
                socket.to(roomId).emit('player_disconnected',{userId:socket.data.userId, username:socket.data.username});
                console.log(`${socket.data.username} disconnected from room ${roomId}`);
            }
        });
    });    
}