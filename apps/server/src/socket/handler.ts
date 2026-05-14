import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  QueueEntry,
  ChatMessage,
} from "@heatmatch/types";
import {
  addToQueue,
  removeFromQueue,
  getQueueEntries,
  setRoom,
  deleteRoom,
  isRedisReady,
} from "../matchmaking/queue";
import { findMatch, RelaxStage } from "../matchmaking/matcher";
import { Relaxer } from "../matchmaking/relaxer";
import {
  recordMatch,
  recordMessage,
  incrementOnline,
  decrementOnline,
  incrementRooms,
  decrementRooms,
} from "../analytics/stats";

type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;

// Maps socketId → { entry, roomId, relaxer }
const socketState = new Map<
  string,
  { entry: QueueEntry; roomId: string | null; relaxer: Relaxer }
>();

export function registerHandlers(io: AppServer, socket: AppSocket) {
  incrementOnline().catch(() => {});

  // ── join_queue ──────────────────────────────────────────────────────────────

  socket.on("join_queue", async (filters) => {
    // Bail early with a clear message if Redis isn't ready yet.
    // Client should show this as a retryable error.
    if (!isRedisReady()) {
      socket.emit("queue_status", {
        message: "Server not ready — please try again in a moment.",
        stage: 0,
      });
      return;
    }

    try {
      // Clean up any existing queue state for this socket (duplicate join guard)
      const existing = socketState.get(socket.id);
      if (existing) {
        existing.relaxer.stop();
        await removeFromQueue(existing.entry);
        socketState.delete(socket.id);
      }

      const entry: QueueEntry = {
        ...filters,
        socketId: socket.id,
        queuedAt: Date.now(),
      };

      const relaxer = new Relaxer(socket, async (stage) => {
        await tryMatch(io, socket, entry, stage);
      });

      socketState.set(socket.id, { entry, roomId: null, relaxer });

      await addToQueue(entry);
      relaxer.start();

      socket.emit("queue_status", { message: "Looking for someone...", stage: 0 });

      await tryMatch(io, socket, entry, 0);
    } catch (err) {
      console.error("[join_queue] error:", err);
      socket.emit("queue_status", {
        message: "Something went wrong — please try again.",
        stage: 0,
      });
    }
  });

  // ── send_message ────────────────────────────────────────────────────────────

  socket.on("send_message", (text) => {
    const state = socketState.get(socket.id);
    if (!state?.roomId) return;

    const sanitized = text.trim();
    if (!sanitized || sanitized.length > 500) return;

    const message: ChatMessage = {
      id: uuidv4(),
      text: sanitized,
      sender: "stranger",
      timestamp: Date.now(),
    };

    socket.to(state.roomId).emit("receive_message", message);
    recordMessage().catch(() => {});
  });

  // ── typing ──────────────────────────────────────────────────────────────────

  socket.on("typing", () => {
    const state = socketState.get(socket.id);
    if (!state?.roomId) return;
    socket.to(state.roomId).emit("partner_typing");
  });

  // ── seen ─────────────────────────────────────────────────────────────────────

  socket.on("seen", () => {
    const state = socketState.get(socket.id);
    if (!state?.roomId) return;
    socket.to(state.roomId).emit("partner_seen");
  });

  // ── skip ────────────────────────────────────────────────────────────────────

  socket.on("skip", async () => {
    await handleLeaveRoom(io, socket, true);
  });

  // ── leave ───────────────────────────────────────────────────────────────────

  socket.on("leave", async () => {
    await handleLeaveRoom(io, socket, false);
  });

  // ── disconnect ──────────────────────────────────────────────────────────────

  socket.on("disconnect", async () => {
    decrementOnline().catch(() => {});
    await handleLeaveRoom(io, socket, false);
  });
}

// ─── Try Match ────────────────────────────────────────────────────────────────

async function tryMatch(
  io: AppServer,
  socket: AppSocket,
  entry: QueueEntry,
  stage: RelaxStage
) {
  try {
    const state = socketState.get(socket.id);
    if (!state || state.roomId) return;

    const candidates = await getQueueEntries(entry.vibe);
    const match = findMatch(entry, candidates, stage);

    if (!match) return;

    // Check partner socket is still alive
    const matchSocket = io.sockets.sockets.get(match.socketId);
    if (!matchSocket) {
      // Partner is gone — remove their stale queue entry and try again
      await removeFromQueue(match);
      const freshCandidates = await getQueueEntries(entry.vibe);
      const nextMatch = findMatch(entry, freshCandidates, stage);
      if (!nextMatch) return;
      const nextSocket = io.sockets.sockets.get(nextMatch.socketId);
      if (!nextSocket) return;
      return doMatch(io, socket, entry, nextMatch, nextSocket, state);
    }

    await doMatch(io, socket, entry, match, matchSocket, state);
  } catch (err) {
    console.error("[tryMatch] error:", err);
  }
}

async function doMatch(
  io: AppServer,
  socket: AppSocket,
  entry: QueueEntry,
  match: QueueEntry,
  matchSocket: AppSocket,
  state: { entry: QueueEntry; roomId: string | null; relaxer: Relaxer }
) {
  const roomId = uuidv4();

  await removeFromQueue(entry);
  await removeFromQueue(match);

  state.relaxer.stop();
  const matchState = socketState.get(match.socketId);
  matchState?.relaxer.stop();

  socket.join(roomId);
  matchSocket.join(roomId);

  state.roomId = roomId;
  if (matchState) matchState.roomId = roomId;

  await setRoom(roomId, entry.sessionId, match.sessionId);
  await recordMatch(entry, match).catch(() => {});
  incrementRooms().catch(() => {});

  socket.emit("matched", {
    roomId,
    partnerSession:  match.sessionId,
    partnerNickname: match.nickname,
  });
  matchSocket.emit("matched", {
    roomId,
    partnerSession:  entry.sessionId,
    partnerNickname: entry.nickname,
  });
}

// ─── Handle Leave Room ────────────────────────────────────────────────────────

async function handleLeaveRoom(
  io: AppServer,
  socket: AppSocket,
  requeue: boolean
) {
  try {
    const state = socketState.get(socket.id);
    if (!state) return;

    const { entry, roomId, relaxer } = state;
    relaxer.stop();

    if (roomId) {
      const reason = requeue ? "skip" : "leave";
      socket.to(roomId).emit("partner_left", { reason });

      const roomSockets = await io.in(roomId).fetchSockets();
      for (const s of roomSockets) {
        if (s.id !== socket.id) {
          const partnerState = socketState.get(s.id);
          if (partnerState) partnerState.roomId = null;
        }
      }

      socket.leave(roomId);
      await deleteRoom(roomId);
      decrementRooms().catch(() => {});
      state.roomId = null;
    }

    await removeFromQueue(entry);

    if (requeue) {
      // Use a fresh object so the old serialized form in Redis is never aliased
      // to the new enqueue — prevents lrem ghost-entry bugs on removal.
      const requeuedEntry: QueueEntry = { ...entry, queuedAt: Date.now() };
      state.entry = requeuedEntry;
      const newRelaxer = new Relaxer(socket, async (stage) => {
        await tryMatch(io, socket, requeuedEntry, stage);
      });
      state.relaxer = newRelaxer;
      await addToQueue(requeuedEntry);
      newRelaxer.start();
      socket.emit("queue_status", { message: "Looking for someone...", stage: 0 });
      await tryMatch(io, socket, requeuedEntry, 0);
    } else {
      socketState.delete(socket.id);
    }
  } catch (err) {
    console.error("[handleLeaveRoom] error:", err);
  }
}