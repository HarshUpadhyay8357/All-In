import crypto from 'crypto';
import { db } from '../db';
import { activeSessions, rooms } from '../db/schema';
import { and, eq } from 'drizzle-orm';

export class RoomService{

    //generate unique roomId
    static generateRoomId():string{
        return 'room_'+crypto.randomBytes(4).toString('hex');
    }

    //create a new room
    static async createRoom(hostId: number, name: string, maxPlayers: number = 6, buyin: number = 1000){
        const roomId=this.generateRoomId();

        await db.insert(rooms).values({
            id:roomId,
            hostId,
            name,
            maxPlayers,
            buyin,
            blindSmall:5,
            blindBig:10,
            status:'waiting'
        });
        return roomId;
    }

    //get all waiting rooms (for lobby)
    static async getWaitingRooms(){
        return db.select().from(rooms).where(eq(rooms.status,'waiting'));
    }

    //get current player count in a room
    static async getPlayerCount(roomId:string):Promise<number>{
        const sessions=await db.select().from(activeSessions).where(eq(activeSessions.roomId, roomId));
        return sessions.length;
    }

    //get next available seat in a room
    static async getNextAvailableSeat(roomId:string, maxPlayers:number):Promise<number|null>{
        const sessions=await db.select().from(activeSessions).where(eq(activeSessions.roomId, roomId));

        const takenSeats=sessions.map(s=>s.seatNumber);

        for(let i=0;i<maxPlayers;i++){
            if(!takenSeats.includes(i)) return i;
        }

        return null; //room full
    }

    //add player to room
    static async joinRoom(roomId:string, userId:number, chips:number){
        const room=await db.select().from(rooms).where(eq(rooms.id, roomId));

        if(room.length===0) throw new Error('room not found');
        if(room[0].status==='playing') throw new Error('game already in progress');

        const playerCount=await this.getPlayerCount(roomId);
        if(playerCount>=(room[0].maxPlayers||6)) throw new Error ('room is full');

        const seatNumber=await this.getNextAvailableSeat(roomId, room[0].maxPlayers||6);
        if(seatNumber===null) throw new Error ('no seats available');

        const existing=await db.select().from(activeSessions).where(and(eq(activeSessions.roomId, roomId), eq(activeSessions.userId, userId)));
        if(existing.length>0)  return { seatNumber: existing[0].seatNumber, room: room[0] };

        await db.insert(activeSessions).values({
            roomId,
            userId,
            seatNumber,
            currentChips:chips,
        });

        return {seatNumber, room:room[0]};
    }

    //remove player from room
    static async leaveRoom(roomId: string, userId: number){
        await db.delete(activeSessions).where(and(eq(activeSessions.roomId, roomId), eq(activeSessions.userId, userId)));
    } 

    //get all players in a room
    static async getPlayersInRoom(roomId:string){
        return await db.select().from(activeSessions).where(eq(activeSessions.roomId, roomId));
    }

    //update room status
    static async updateRoomStatus(roomId:string, status:'waiting'|'playing'|'finished'){
        await db.update(rooms).set({status}).where(eq(rooms.id, roomId));
    }
}