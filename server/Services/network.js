import { generateCode } from "../utils/utils.js";

export default function handleSocket(socket) {
    console.log(`New user connected: (Socket Id: ${socket.id})`);
    
    socket.on('create_room', () => {
        const roomId = generateCode();
        console.log(`Room created with (roomId: ${roomId}) on (SocketId:${socket.id})`);
        socket.join(roomId); 
        socket.emit('room_created', roomId);
    });

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`New user joined room number: ${roomId}`);
        
        socket.emit('room_joined', roomId);
    });

    socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        console.log(`User left room number: ${roomId}`);
    });
    
    socket.on('disconnect', () => {
        console.log(`User disconnected (Socket Id: ${socket.id})`);
    });
};