import dotenv from 'dotenv';

dotenv.config();

import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import { createServer } from 'http';
import { ClientToServerEvents, ServerToClientEvents, SocketData } from './sockets/types';
import { initializeSocket } from './sockets';

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (server stayed alive):', err);
});
 
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection (server stayed alive):', reason);
});

const app = express();
const server=createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(server, {
  cors: { 
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods:['GET', 'POST'],
  }
});

app.use(cors());
app.use(express.json());

// Routes 
app.use('/api/auth',authRoutes);
app.use('/api/rooms', roomRoutes);

// Socket.IO 
initializeSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});