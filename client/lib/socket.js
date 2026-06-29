import { Alert } from "react-native";
import io from "socket.io-client";

let socketInstance = null;

export function getSocket(SERVER_URL) {
  if (!SERVER_URL) {
    console.error("Missing EXPO_PUBLIC_SERVER_URL");
    return null;
  }
  if (!socketInstance) {
    socketInstance = io(SERVER_URL, {
      transports: ["websocket"],
      autoConnect: true,
    });
  }
  return socketInstance;
}

export function handleSocket(socket, router) {
  if (!socket) return;

  socket.off("room_created");
  socket.off("room_joined");
  socket.off("error_msg");

  socket.on("room_created", (roomId) => {
    router.push({
      pathname: "/(tabs)/WatchParty",
      params: { roomId, isHost: "true" },
    });
  });

  socket.on("room_joined", (roomId) => {
    router.push({
      pathname: "/(tabs)/WatchParty",
      params: { roomId, isHost: "false" },
    });
  });

  socket.on("error_msg", (msg) => Alert.alert("Error", msg));

  return () => {
    socket.off("room_created");
    socket.off("room_joined");
    socket.off("error_msg");
  };
}

export function SocketCreateParty(socket, user) {
  if (!user) return;
  const fullName = `${user.firstname} ${user.lastname}`;
  socket.emit("create_room", fullName);
}

export function SocketJoinParty(roomCode, socket, user) {
  if (!roomCode || roomCode.trim().length === 0) return;
  if (!user) {
    Alert.alert("Join room", "User details are missing.");
    return;
  }
  socket.emit("join_room", roomCode.trim().toUpperCase(), {
    firstname: user.firstname,
    lastname: user.lastname,
  });
}
