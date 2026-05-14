import Redis from "ioredis";
import { QueueEntry, Vibe } from "@heatmatch/types";

// ─── Redis client ─────────────────────────────────────────────────────────────

export const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  // Don't crash the process on connection errors — log and keep retrying.
  // ioredis will automatically reconnect when Redis comes back up.
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times) {
    // Retry with a cap at 3 seconds. Logs every 5 attempts to avoid spam.
    if (times % 5 === 1) {
      console.warn(`[redis] Reconnecting... (attempt ${times})`);
    }
    return Math.min(times * 200, 3000);
  },
});

// Must attach an error handler — without this Node.js treats ioredis
// connection errors as unhandled and crashes async operations silently.
redis.on("error", (err) => {
  console.error("[redis] Connection error:", err.message);
});

redis.on("connect", () => {
  console.log("[redis] Connected");
});

redis.on("ready", () => {
  // Flush stale queue entries on (re)connect so dead socket IDs don't
  // block matchmaking. Stats keys are preserved.
  flushQueues().catch(() => {});
});

// ─── Flush all vibe queues ───────────────────────────────────────────────────
// Called on connect/reconnect. Removes leftover entries from previous server
// runs whose socket IDs are no longer valid.

async function flushQueues() {
  const vibes: Vibe[] = ["friendly", "deep", "flirty"];
  await Promise.all(vibes.map((v) => redis.del(`queue:${v}`)));
  console.log("[redis] Queues flushed");
}

// ─── Queue keys ───────────────────────────────────────────────────────────────

const queueKey   = (vibe: Vibe)       => `queue:${vibe}`;
const sessionKey = (sessionId: string) => `session:${sessionId}`;

// ─── Add to queue ─────────────────────────────────────────────────────────────

export async function addToQueue(entry: QueueEntry): Promise<void> {
  const key = queueKey(entry.vibe);
  await redis.lpush(key, JSON.stringify(entry));
  await redis.hset(sessionKey(entry.sessionId), {
    socketId: entry.socketId,
    vibe:     entry.vibe,
    queuedAt: entry.queuedAt,
  });
  await redis.expire(sessionKey(entry.sessionId), 600);
}

// ─── Remove from queue ────────────────────────────────────────────────────────

export async function removeFromQueue(entry: QueueEntry): Promise<void> {
  const key = queueKey(entry.vibe);
  await redis.lrem(key, 0, JSON.stringify(entry));
  await redis.del(sessionKey(entry.sessionId));
}

// ─── Get all entries for a vibe ───────────────────────────────────────────────

export async function getQueueEntries(vibe: Vibe): Promise<QueueEntry[]> {
  const key = queueKey(vibe);
  const raw = await redis.lrange(key, 0, -1);
  return raw.map((r) => JSON.parse(r) as QueueEntry);
}

// ─── Active room ──────────────────────────────────────────────────────────────

export async function setRoom(
  roomId: string,
  sessionA: string,
  sessionB: string
): Promise<void> {
  await redis.hset(`room:${roomId}`, {
    sessionA,
    sessionB,
    createdAt: Date.now(),
  });
  await redis.expire(`room:${roomId}`, 3600);
}

export async function deleteRoom(roomId: string): Promise<void> {
  await redis.del(`room:${roomId}`);
}

// ─── Redis readiness check ────────────────────────────────────────────────────
// Used by the socket handler to bail early with a clear error instead of
// throwing cryptically inside an async handler.

export function isRedisReady(): boolean {
  return redis.status === "ready";
}
