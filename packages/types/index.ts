// ─── Filters ─────────────────────────────────────────────────────────────────

export type Gender = "male" | "female";
export type LookingFor = "male" | "female" | "both";
export type Vibe = "friendly" | "deep" | "flirty";

export interface UserFilters {
  sessionId: string;
  gender: Gender;
  lookingFor: LookingFor;
  university: string;
  ageRange: [number, number];
  vibe: Vibe;
  nickname: string;        // display name, "Anonymous" if left blank
}

// ─── Messages ─────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  text: string;
  sender: "you" | "stranger";
  timestamp: number;
}

// ─── Socket Events ────────────────────────────────────────────────────────────
// Naming: ClientToServer = what client sends
//         ServerToClient = what server sends back

export interface ClientToServerEvents {
  join_queue: (filters: UserFilters) => void;
  send_message: (text: string) => void;
  typing: () => void;
  seen: () => void;        // emitted when user reads partner's message
  skip: () => void;
  leave: () => void;
}

export interface ServerToClientEvents {
  matched: (data: { roomId: string; partnerSession: string; partnerNickname: string }) => void;
  receive_message: (message: ChatMessage) => void;
  partner_typing: () => void;
  partner_seen: () => void; // emitted to sender when partner reads their message
  partner_left: (data: { reason: "skip" | "leave" }) => void;
  no_match: () => void;
  queue_status: (data: { message: string; stage: number }) => void;
}

// ─── Queue Entry (stored in Redis) ───────────────────────────────────────────

export interface QueueEntry extends UserFilters {
  socketId: string;
  queuedAt: number; // Date.now()
}

// ─── Match Result ─────────────────────────────────────────────────────────────

export interface MatchResult {
  roomId: string;
  userA: QueueEntry;
  userB: QueueEntry;
}

// ─── Report ───────────────────────────────────────────────────────────────────

export type ReportReason =
  | "harassment"
  | "spam"
  | "underage"
  | "explicit"
  | "other";

export interface ReportPayload {
  reporterSession: string;
  reportedSession: string;
  roomId: string;
  reason: ReportReason;
}

// ─── University ───────────────────────────────────────────────────────────────

export interface University {
  name: string;
  region: string;
  city: string;
}
