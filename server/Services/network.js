import { getHostToken, searchTracks } from "../spotify_api/spotify_api.js";
import { generateCode } from "../utils/utils.js";
const roomTokens = {}; // roomId -> host access token

export default function handleSocket(socket,io) {
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
    socket.on('search_track', async (query) => {
        try {
            console.log(`[Spotify] Searching for: ${query}`);
            const res = await searchTracks(query);
            
            socket.emit('searched_track', res);
        } catch (error) {
            console.error('Socket Search Error:', error.message);
            socket.emit('error_msg', 'Failed to search tracks. Please try again.');
        }
    });

socket.on('spotify_auth_code', async ({ code, roomId }) => {
  try {
    const tokenData = await getHostToken(code);
    roomTokens[roomId] = tokenData.access_token;
    socket.emit('spotify_connected');
    io.to(roomId).emit('spotify_connected');
  } catch (err) {
    socket.emit('error_msg', 'Failed to connect Spotify');
  }
  socket.on('spotify_connected_alert', ({ roomId }) => {
  io.to(roomId).emit('spotify_connected');
});
});};