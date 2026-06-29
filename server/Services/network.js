import {
  addToQueue,
  searchTracks,
  createPlayList,
  addTracksToPlayList,
  setImageForPlayList,
  roomTokens,
} from "../spotify_api/spotify_api.js";
import { generateCode } from "../utils/utils.js";
import { rooms } from "../RoomState.js";

const roomQueues = {};

/*
  roomVotes structure per roomId:
  {
    [trackUri]: {
      track,
      proposedBy: username,
      yesVotes: Set<socketId>,
      noVotes:  Set<socketId>,
      locked: boolean,        // true while addToQueue is in flight — prevents race
      timer: TimeoutHandle,   // auto-reject after 30s
    }
  }
*/
const roomVotes = {}; // roomId -> { [trackUri]: voteEntry }

const getMemberCount = (roomId) =>
  rooms.has(roomId) ? rooms.get(roomId).members.size : 0;

const requiredYes = (roomId) => Math.floor(getMemberCount(roomId) / 2) + 1;

const emitMemberCount = (io, roomId) => {
  io.to(roomId).emit("member_count", getMemberCount(roomId));
};

const emitVoteState = (io, roomId, trackUri) => {
  const vote = roomVotes[roomId]?.[trackUri];
  if (!vote) return;
  io.to(roomId).emit("vote_update", {
    trackUri,
    track: vote.track,
    proposedBy: vote.proposedBy,
    yesCount: vote.yesVotes.size,
    noCount: vote.noVotes.size,
    required: requiredYes(roomId),
    total: getMemberCount(roomId),
  });
};

const finalizeVote = async (io, roomId, trackUri, passed) => {
  const votes = roomVotes[roomId];
  if (!votes || !votes[trackUri]) return;

  const vote = votes[trackUri];
  if (vote.locked) return;
  vote.locked = true;

  clearTimeout(vote.timer);

  if (passed) {
    const result = await addToQueue(trackUri, roomId);
    if (result.success) {
      roomQueues[roomId] = [...(roomQueues[roomId] || []), vote.track];
      io.to(roomId).emit("queue_updated", roomQueues[roomId]);
      io.to(roomId).emit("vote_result", {
        trackUri,
        track: vote.track,
        passed: true,
        message: `"${vote.track.name}" was added to the queue!`,
      });
    } else {
      io.to(roomId).emit("vote_result", {
        trackUri,
        track: vote.track,
        passed: false,
        message: `Spotify rejected the song: ${result.error}`,
      });
    }
  } else {
    io.to(roomId).emit("vote_result", {
      trackUri,
      track: vote.track,
      passed: false,
      message: `"${vote.track.name}" didn't get enough votes.`,
    });
  }

  delete votes[trackUri];
};

const checkVote = async (io, roomId, trackUri) => {
  const vote = roomVotes[roomId]?.[trackUri];
  if (!vote || vote.locked) return;

  const total = getMemberCount(roomId);
  const needed = requiredYes(roomId);
  const yes = vote.yesVotes.size;
  const no = vote.noVotes.size;

  if (yes >= needed) {
    await finalizeVote(io, roomId, trackUri, true);
    return;
  }

  const remaining = total - yes - no;
  if (yes + remaining < needed) {
    await finalizeVote(io, roomId, trackUri, false);
  }
};

export default function handleSocket(socket, io) {
  console.log(`New user connected: (Socket Id: ${socket.id})`);

  const normalizeRoomCode = (value = "") => String(value).trim().toUpperCase();
  const findRoomId = (roomCode = "") => {
    const normalized = normalizeRoomCode(roomCode);
    if (!normalized) return null;
    if (rooms.has(normalized)) return normalized;
    return (
      [...rooms.keys()].find((id) => normalizeRoomCode(id) === normalized) ||
      null
    );
  };

  socket.on("create_room", (username) => {
    const roomId = normalizeRoomCode(generateCode());
    console.log(`Room created (roomId: ${roomId}, socketId: ${socket.id})`);
    rooms.set(roomId, {
      hostSocketId: socket.id,
      spotifyToken: null,
      members: new Map([[socket.id, { username }]]),
    });
    roomVotes[roomId] = {};
    socket.join(roomId);
    socket.emit("room_created", roomId);
    emitMemberCount(io, roomId);
  });

  socket.on("join_room", (roomId, user) => {
    const resolvedId = findRoomId(roomId);
    if (!resolvedId) {
      socket.emit("error_msg", "Room doesn't exist.");
      return;
    }
    const username =
      typeof user === "string"
        ? user
        : `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim() || "Guest";

    socket.join(resolvedId);
    console.log(`${username} joined room ${resolvedId}`);
    const room = rooms.get(resolvedId);
    room.members.set(socket.id, { username });
    socket.emit("room_joined", resolvedId);
    socket.to(resolvedId).emit("user_joined", username);
    socket.emit("queue_updated", roomQueues[resolvedId] || []);

    const activeVotes = roomVotes[resolvedId] || {};
    Object.keys(activeVotes).forEach((trackUri) => {
      const vote = activeVotes[trackUri];
      socket.emit("vote_started", {
        trackUri,
        track: vote.track,
        proposedBy: vote.proposedBy,
        yesCount: vote.yesVotes.size,
        noCount: vote.noVotes.size,
        required: requiredYes(resolvedId),
        total: room.members.size,
      });
    });

    emitMemberCount(io, resolvedId);
  });

  socket.on("leave_room", (roomId) => {
    if (!rooms.has(roomId)) {
      socket.emit("error_msg", "Room doesn't exist.");
      return;
    }
    const room = rooms.get(roomId);
    if (!room.members.has(socket.id)) return;

    const user = room.members.get(socket.id);
    console.log(`${user.username} left room ${roomId}`);
    room.members.delete(socket.id);
    socket.leave(roomId);
    emitMemberCount(io, roomId);

    if (room.hostSocketId === socket.id) {
      socket.to(roomId).emit("room_closed");
      rooms.delete(roomId);
      delete roomQueues[roomId];
      delete roomVotes[roomId];
    } else if (room.members.size === 0) {
      rooms.delete(roomId);
      delete roomQueues[roomId];
      delete roomVotes[roomId];
    } else {
      const votes = roomVotes[roomId] || {};
      Object.keys(votes).forEach((trackUri) => {
        checkVote(io, roomId, trackUri);
      });
    }
  });

  socket.on("search_track", async (query) => {
    try {
      const res = await searchTracks(query);
      socket.emit("searched_track", res);
    } catch (error) {
      console.error("Search Error:", error.message);
      socket.emit("error_msg", "Failed to search tracks. Please try again.");
    }
  });

  socket.on("propose_song", ({ track, roomId, userName }) => {
    if (!roomId || !track?.uri || !rooms.has(roomId)) {
      socket.emit("error_msg", "Missing room or track details.");
      return;
    }

    if (!roomVotes[roomId]) roomVotes[roomId] = {};

    if (roomVotes[roomId][track.uri]) {
      socket.emit("error_msg", `"${track.name}" is already being voted on.`);
      return;
    }

    const room = rooms.get(roomId);
    const proposer = room.members.get(socket.id);
    const proposedBy = userName || proposer?.username || "Guest";
    if (getMemberCount(roomId) === 1) {
      addToQueue(track.uri, roomId).then((result) => {
        if (result.success) {
          roomQueues[roomId] = [...(roomQueues[roomId] || []), track];
          io.to(roomId).emit("queue_updated", roomQueues[roomId]);
        } else {
          socket.emit(
            "error_msg",
            `Spotify rejected the song: ${result.error}`,
          );
        }
      });
      return;
    }

    const timer = setTimeout(() => {
      finalizeVote(io, roomId, track.uri, false);
    }, 30000);

    roomVotes[roomId][track.uri] = {
      track,
      proposedBy,
      yesVotes: new Set([socket.id]),
      noVotes: new Set(),
      locked: false,
      timer,
    };

    socket.to(roomId).emit("vote_started", {
      trackUri: track.uri,
      track,
      proposedBy,
      yesCount: 1,
      noCount: 0,
      required: requiredYes(roomId),
      total: getMemberCount(roomId),
    });
    checkVote(io, roomId, track.uri);
  });

  socket.on("cast_vote", async ({ trackUri, roomId, vote }) => {
    if (!roomId || !trackUri || !rooms.has(roomId)) {
      socket.emit("error_msg", "Missing room or track details.");
      return;
    }

    const voteEntry = roomVotes[roomId]?.[trackUri];
    if (!voteEntry) {
      socket.emit("error_msg", "This vote no longer exists.");
      return;
    }
    if (voteEntry.locked) return;

    voteEntry.yesVotes.delete(socket.id);
    voteEntry.noVotes.delete(socket.id);

    if (vote === "yes") voteEntry.yesVotes.add(socket.id);
    else voteEntry.noVotes.add(socket.id);

    emitVoteState(io, roomId, trackUri);
    await checkVote(io, roomId, trackUri);
  });

  socket.on("spotify_connected_alert", ({ roomId }) => {
    io.to(roomId).emit("spotify_connected");
  });

  socket.on("createPlayList", async ({ roomId, tracks, image }) => {
    try {
      const isCreated = await createPlayList(roomId);

      if (!isCreated) {
        socket.emit("error_msg", "Failed to create playlist.");
        return;
      }

      if (tracks && tracks.length > 0) {
        await addTracksToPlayList(roomId, tracks);
      }

      if (image) {
        await setImageForPlayList(roomId, image);
      }

      const playlistUrl = roomTokens[roomId]?.playlist_url;

      socket.emit("Playlist_created", playlistUrl);
    } catch (error) {
      console.error("Error in createPlayList socket event:", error);
      socket.emit(
        "error_msg",
        "Something went wrong while creating the playlist.",
      );
    }
  });
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    rooms.forEach((room, roomId) => {
      if (!room.members.has(socket.id)) return;

      const user = room.members.get(socket.id);
      console.log(`Cleaning up ${user.username} from room ${roomId}`);
      room.members.delete(socket.id);
      emitMemberCount(io, roomId);

      if (room.hostSocketId === socket.id) {
        socket.to(roomId).emit("room_closed");
        rooms.delete(roomId);
        delete roomQueues[roomId];
        delete roomVotes[roomId];
      } else if (room.members.size === 0) {
        rooms.delete(roomId);
        delete roomQueues[roomId];
        delete roomVotes[roomId];
      } else {
        const votes = roomVotes[roomId] || {};
        Object.keys(votes).forEach((trackUri) => {
          checkVote(io, roomId, trackUri);
        });
      }
    });
  });
}
