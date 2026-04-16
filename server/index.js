import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT || 8787);
const MAX_PLAYERS = Number(process.env.MAX_PLAYERS || 50);
const STALE_MS = 20_000;

const rooms = new Map();

function roomCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function send(socket, message) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

function broadcast(room, message, except = null) {
  room.clients.forEach((client) => {
    if (client !== except) send(client, message);
  });
}

function createRoom(host) {
  let code = roomCode();
  while (rooms.has(code)) code = roomCode();
  const room = {
    code,
    host,
    clients: new Set([host]),
    playerSockets: new Map(),
    players: new Map(),
    phase: "lobby",
    winnerId: "",
    countdown: "",
    createdAt: Date.now()
  };
  rooms.set(code, room);
  host.roomCode = code;
  host.role = "host";
  send(host, { t: "room-created", code, maxPlayers: MAX_PLAYERS });
  return room;
}

function snapshot(room) {
  return {
    t: "state",
    phase: room.phase,
    winnerId: room.winnerId,
    countdown: room.countdown,
    players: [...room.players.values()],
    maxPlayers: MAX_PLAYERS,
    roomCode: room.code
  };
}

function cleanupRoom(room) {
  const now = Date.now();
  room.players.forEach((player, id) => {
    if (now - player.lastSeen > STALE_MS) {
      room.players.delete(id);
    }
  });
  if (!room.host || room.host.readyState !== room.host.OPEN) {
    broadcast(room, { t: "host-offline" });
    rooms.delete(room.code);
  }
}

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (socket) => {
  socket.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw);
    } catch (_error) {
      send(socket, { t: "error", reason: "BAD_JSON" });
      return;
    }

    if (message.t === "create-room") {
      createRoom(socket);
      return;
    }

    const room = rooms.get(message.room || socket.roomCode);
    if (!room) {
      send(socket, { t: "error", reason: "ROOM_NOT_FOUND" });
      return;
    }

    if (message.t === "join-room") {
      if (room.players.size >= MAX_PLAYERS && !room.players.has(message.player?.id)) {
        send(socket, { t: "join-rejected", reason: "ROOM_FULL" });
        return;
      }
      socket.roomCode = room.code;
      socket.playerId = message.player.id;
      socket.role = "player";
      room.clients.add(socket);
      room.playerSockets.set(socket.playerId, socket);
      room.players.set(message.player.id, {
        ...message.player,
        connected: true,
        lastSeen: Date.now()
      });
      send(socket, { t: "joined", you: message.player.id, state: snapshot(room) });
      broadcast(room, { t: "player-joined", player: message.player }, socket);
      broadcast(room, snapshot());
      return;
    }

    if (message.t === "client-event") {
      const player = room.players.get(message.id);
      if (player) player.lastSeen = Date.now();
      send(room.host, message);
      return;
    }

    if (message.t === "direct" && socket === room.host) {
      const target = room.playerSockets.get(message.to);
      if (target) send(target, message.message);
      return;
    }

    if (message.t === "host-event" && socket === room.host) {
      broadcast(room, message.message, socket);
      return;
    }

    if (message.t === "host-state" && socket === room.host) {
      room.phase = message.state?.phase || room.phase;
      room.winnerId = message.state?.winnerId || "";
      room.countdown = message.state?.countdown || "";
      if (Array.isArray(message.state?.players)) {
        const authoritativePlayers = new Map();
        message.state.players.forEach((player) => {
          const existing = room.players.get(player.id) || {};
          authoritativePlayers.set(player.id, {
            ...existing,
            ...player,
            connected: player.c ?? existing.connected ?? true,
            lastSeen: existing.lastSeen || Date.now()
          });
        });
        room.players = authoritativePlayers;
      }
      broadcast(room, message.state, socket);
      return;
    }
  });

  socket.on("close", () => {
    const room = rooms.get(socket.roomCode);
    if (!room) return;
    room.clients.delete(socket);
    if (socket.playerId) room.playerSockets.delete(socket.playerId);
    if (socket.playerId && room.players.has(socket.playerId)) {
      const player = room.players.get(socket.playerId);
      player.connected = false;
      player.lastSeen = Date.now();
      broadcast(room, { t: "player-disconnected", id: socket.playerId });
    }
    cleanupRoom(room);
  });
});

setInterval(() => {
  rooms.forEach((room) => {
    cleanupRoom(room);
    broadcast(room, snapshot(room));
  });
}, 5000);

console.log(`Birthday Battle Arena server listening on ws://localhost:${PORT}`);
