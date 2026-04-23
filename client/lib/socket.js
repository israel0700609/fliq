
import { Alert } from 'react-native';
import io from 'socket.io-client';

export function getSocket(SERVER_URL) {
  return io(SERVER_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });
}

export function handleSocket(socket, router) {
  socket.on('connect', () => {
    console.log('✅ Connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.log('❌ Connection error:', err.message);
  });

  socket.on('room_created', (roomId) => {
    router.push({
      pathname: '/(tabs)/WatchParty',
      params: { roomId, isHost: 'true' },
    });
  });

  socket.on('room_joined', (roomId) => {
    router.push({
      pathname: '/(tabs)/WatchParty',
      params: { roomId, isHost: 'false' },
    });
  });

  socket.on('error_msg', (msg) => {
    Alert.alert('Error', msg);
  });
  return () => {
    socket.off('connect');
    socket.off('connect_error');
    socket.off('room_created');
    socket.off('room_joined');
    socket.off('error_msg');
  };
}

export function SocketCreateParty(socket, user) {
  const fullName = `${user.firstname} ${user.lastname}`;
  socket.emit('create_room', fullName);
}

export function SocketJoinParty(roomCode, socket, user) {
  if (roomCode.trim().length === 0) return;
  const fullName = `${user.firstname} ${user.lastname}`;
  socket.emit('join_room', roomCode.trim().toUpperCase(), fullName);
}
