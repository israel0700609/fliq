import { addToQueue, searchTracks } from "../spotify_api/spotify_api.js";
import { generateCode } from "../utils/utils.js";

const roomQueues = {}; // roomId -> queued track list

export default function handleSocket(socket,io) {
    console.log(`New user connected: (Socket Id: ${socket.id})`);

    const emitMemberCount = (roomId) => {
        const room = io.sockets.adapter.rooms.get(roomId);
        io.to(roomId).emit('member_count', room?.size || 0);
    };

    socket.on('create_room', () => {
        const roomId = generateCode();
        console.log(`Room created with (roomId: ${roomId}) on (SocketId:${socket.id})`);
        socket.join(roomId); 
        socket.emit('room_created', roomId);
        emitMemberCount(roomId);
    });

    socket.on('join_room', (roomId) => {
        socket.join(roomId);
        console.log(`New user joined room number: ${roomId}`);

        socket.emit('room_joined', roomId);
        io.to(roomId).emit('queue_updated', roomQueues[roomId] || []);
        emitMemberCount(roomId);
    });

    socket.on('leave_room', (roomId) => {
        socket.leave(roomId);
        console.log(`User left room number: ${roomId}`);
        emitMemberCount(roomId);
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

    socket.on('add_to_queue', async ({ track, roomId }) => {
        if (!roomId || !track?.uri) {
            socket.emit('error_msg', 'Missing room or track details.');
            return;
        }

        const addResult = await addToQueue(track.uri, roomId);
        if (!addResult.success) {
            socket.emit('error_msg', addResult.error || 'Failed to add song to Spotify queue.');
            return;
        }

        roomQueues[roomId] = [...(roomQueues[roomId] || []), track];
        io.to(roomId).emit('queue_updated', roomQueues[roomId]);
    });

    socket.on('spotify_connected_alert', ({ roomId }) => {
        io.to(roomId).emit('spotify_connected');
    });

    socket.on('disconnecting', () => {
        for (const roomId of socket.rooms) {
            if (roomId !== socket.id) emitMemberCount(roomId);
        }
    });
};