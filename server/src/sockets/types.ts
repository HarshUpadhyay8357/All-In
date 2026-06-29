import { Card } from "../game/deck";
import { GameState } from "../game/types";


//events from client to server
export interface ClientToServerEvents{
    join_room:( data:{roomId:string, userId:number})=>void;
    leave_room: (data:{roomId:string, userId:number})=>void;
    player_ready: (data:{roomId:string, userId:number})=>void;
    start_game:(data:{roomId:string, userId:number})=>void;
    player_action:(data:{
        roomId:string;
        userId:number;
        action:'fold'|'check'|'call'|'raise';
        amount?:number;
    })=>void;
    restart_game: (data: { roomId: string }) => void;
}

//events from server to client
export interface ServerToClientEvents{
    room_joined: (data:{roomId:string, seatNumber:number, players:any[]})=>void;
    room_updated: (data:{players:any[]})=>void;
    game_started: (data:{gameState:Partial<GameState>})=>void;
    game_state_update: (data:{gameState:Partial<GameState>})=>void;
    private_cards: (data:{holeCards:Card[]})=>void;
    turn_start: (data:{userId:number, timeLimit:number})=>void;
    turn_tick: (data:{secondsLeft:number})=>void;
    game_over: (data:{winnerId:number, winnerUsername:string, pot:number})=>void;
    error: (data:{message:string})=>void;
    player_disconnected: (data:{userId:number, username:string})=>void;
    player_reconnected: (data:{userId:number, username:string})=>void;
    match_finished: (data: { winnerId: number, winnerUsername: string, chips: number }) => void;
}

//data stored per socket connection
export interface SocketData{
    userId:number;
    username:string;
    roomId:string|null;
}