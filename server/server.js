import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {supabase,connectDB} from './config/db.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import { createServer } from 'http';
import { Server } from "socket.io";
import handleSocket from './Services/network.js';
dotenv.config();

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);


const httpServer = createServer(app);

const io = new Server(httpServer,{
    cors:{
        origin: "*",
        methods: ["GET","POST"]
    }
});

io.on('connection',(socket)=>{ handleSocket(socket,io)});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`Server & WebSockets running on port${PORT}`);
});