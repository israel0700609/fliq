import { addToQueue, searchTracks } from "../spotify_api/spotify_api.js";
import { generateCode } from "../utils/utils.js";
import { rooms } from "../RoomState.js";

const roomQueues = {}; // roomId -> queued track list
/*
rooms.set(roomId, {
    hostSocketId: 'socket_id_of_host',
    spotifyToken: '...', // ה-Access Token של המארח (אופציונלי לשמור כאן)
    members: new Map([
        ['socket_id_1', { username: 'User1' }],
        ['socket_id_2', { username: 'User2' }]
    ])
});
*/

export default function handleSocket(socket,io) {
    console.log(`New user connected: (Socket Id: ${socket.id})`);

    const emitMemberCount = (roomId) => {
        const count = rooms.has(roomId) ? rooms.get(roomId).members.size : 0;
        io.to(roomId).emit('member_count', count);
    };
    socket.on('create_room', (username) => {
        const roomId = generateCode();
        console.log(`Room created with (roomId: ${roomId}) on (SocketId:${socket.id})`);
        
        rooms.set(roomId, {
            hostSocketId: socket.id,
            spotifyToken: null,
            members: new Map([[socket.id, { username: username }]])
        });
        
        socket.join(roomId); 
        socket.emit('room_created', roomId);
        emitMemberCount(roomId);
    });
    socket.on('join_room', (roomId, user) => {
        if (rooms.has(roomId)) {
            const username = `${user.firstname} ${user.lastname}`;
            socket.join(roomId);
            console.log(`New user ${username} joined room number: ${roomId}`);
            const room = rooms.get(roomId);
            room.members.set(socket.id, { username: username });
            io.to(roomId).emit('room_joined', roomId); // Emit to all in room
            socket.to(roomId).emit('user_joined', username); // Notify others
            socket.emit('queue_updated', roomQueues[roomId] || []);
            emitMemberCount(roomId);
        } else {
            socket.emit('error_msg', "Room dont exist.");
        }
    });

socket.on('leave_room', (roomId) => {
        if(rooms.has(roomId)) {
            const room = rooms.get(roomId);
            
            if(room.members.has(socket.id)) {
                const user = room.members.get(socket.id);
                console.log(`User ${user.username} left room number: ${roomId}`);
                
                room.members.delete(socket.id);
                socket.leave(roomId);
                
                emitMemberCount(roomId);

                if (room.hostSocketId === socket.id) {
                    console.log(`Host left. Closing room: ${roomId}`);
                    socket.to(roomId).emit('error_msg', "The host has left the party. Room closed.");
                    rooms.delete(roomId);
                    delete roomQueues[roomId];
                } 
                else if (room.members.size === 0) {
                    console.log(`Room ${roomId} is empty. Deleting from memory...`);
                    rooms.delete(roomId);
                    delete roomQueues[roomId];
                }

            } else {
                console.log(`Warning: Socket ${socket.id} tried to leave room ${roomId} but is not in members map.`);
            }
        } else {
            socket.emit('error_msg', "Room doesn't exist.");
        }
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
        if (!roomId || !track?.uri || !rooms.has(roomId)) {
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

 socket.on('disconnect', () => {
        console.log(`User disconnected abruptly: (Socket Id: ${socket.id})`);
        rooms.forEach((room, roomId) => {
            if (room.members.has(socket.id)) {
                const user = room.members.get(socket.id);
                console.log(`Cleaning up user ${user.username} from room ${roomId} due to disconnect.`);
                
                room.members.delete(socket.id);
                emitMemberCount(roomId);

                
                if (room.hostSocketId === socket.id) {
                    console.log(`Host disconnected abruptly. Closing room: ${roomId}`);
                    socket.to(roomId).emit('error_msg', "The host disconnected unexpectedly. Room closed.");
                    rooms.delete(roomId);
                    delete roomQueues[roomId]; 
                } 
                else if (room.members.size === 0) {
                    console.log(`Room ${roomId} is empty after disconnect. Deleting from memory...`);
                    rooms.delete(roomId);
                    delete roomQueues[roomId]; 
                }
            }
        });
    });
};