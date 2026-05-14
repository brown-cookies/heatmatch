import { redis } from "../matchmaking/queue";
import { QueueEntry } from "@heatmatch/types";

// ─── Redis counter keys ───────────────────────────────────────────────────────
export const KEYS = {
  totalMatches:  "stats:total_matches",
  totalMessages: "stats:total_messages",
  activeRooms:   "stats:active_rooms",
  onlineUsers:   "stats:online_users",
};

// ─── Online / room counters ───────────────────────────────────────────────────
export async function incrementOnline()   { await redis.incr(KEYS.onlineUsers); }
export async function decrementOnline()   { await redis.decr(KEYS.onlineUsers); }
export async function incrementRooms()    { await redis.incr(KEYS.activeRooms); }
export async function decrementRooms()    { await redis.decr(KEYS.activeRooms); }
export async function incrementMessages() { await redis.incr(KEYS.totalMessages); }

// ─── Record a match ───────────────────────────────────────────────────────────
// Redis-only — no DB write.
export async function recordMatch(_a: QueueEntry, _b: QueueEntry): Promise<void> {
  await redis.incr(KEYS.totalMatches);
}

// ─── Record a message ─────────────────────────────────────────────────────────
export async function recordMessage(): Promise<void> {
  await redis.incr(KEYS.totalMessages);
}

// ─── Live stats (from Redis) ──────────────────────────────────────────────────
export async function getLiveStats() {
  const [matches, messages, rooms, online] = await Promise.all([
    redis.get(KEYS.totalMatches),
    redis.get(KEYS.totalMessages),
    redis.get(KEYS.activeRooms),
    redis.get(KEYS.onlineUsers),
  ]);

  const [friendlyQueue, deepQueue, flirtyQueue] = await Promise.all([
    redis.llen("queue:friendly"),
    redis.llen("queue:deep"),
    redis.llen("queue:flirty"),
  ]);

  return {
    totalMatches:  parseInt(matches  ?? "0"),
    totalMessages: parseInt(messages ?? "0"),
    activeRooms:   Math.max(0, parseInt(rooms  ?? "0")),
    onlineUsers:   Math.max(0, parseInt(online ?? "0")),
    queues: { friendly: friendlyQueue, deep: deepQueue, flirty: flirtyQueue },
  };
}

// ─── Overview stats (Redis only) ─────────────────────────────────────────────
export async function getOverviewStats() {
  const [totalMatches, totalMessages] = await Promise.all([
    redis.get(KEYS.totalMatches),
    redis.get(KEYS.totalMessages),
  ]);

  return {
    totalMatches:  parseInt(totalMatches  ?? "0"),
    totalMessages: parseInt(totalMessages ?? "0"),
  };
}
