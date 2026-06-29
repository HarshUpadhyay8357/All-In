import express from "express"
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { RoomService } from "../services/room-service";

const router=express.Router();

//GET -> /api/rooms - get all waiting rooms (for lobby)
router.get('/', authMiddleware, async (req:AuthRequest, res) => {
    try {
        const waitingRooms = await RoomService.getWaitingRooms();
        res.json(waitingRooms);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

//POST -> /api/rooms - create a new room
router.post('/', authMiddleware, async(req:AuthRequest, res) => {
    try {
        const {name, maxPlayers, buyIn} = req.body;
        const hostId=req.userId!;
        const roomId=await RoomService.createRoom(hostId, name, maxPlayers, buyIn);
        res.status(201).json({roomId});
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;