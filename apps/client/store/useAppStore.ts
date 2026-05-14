import { create } from "zustand";
import { UserFilters, ChatMessage } from "@heatmatch/types";

export type AppStatus = "idle" | "queued" | "matched" | "chatting";

interface AppState {
  // Filters
  filters: UserFilters | null;
  setFilters: (f: UserFilters) => void;

  // Connection
  status: AppStatus;
  setStatus: (s: AppStatus) => void;

  // Room
  roomId: string | null;
  setRoomId: (id: string | null) => void;

  // Partner info
  partnerSession: string | null;
  setPartnerSession: (id: string | null) => void;
  partnerNickname: string;
  setPartnerNickname: (n: string) => void;

  // Partner left
  partnerLeftReason: "skip" | "leave" | null;
  setPartnerLeftReason: (r: "skip" | "leave" | null) => void;

  // Queue feedback
  queueMessage: string;
  setQueueMessage: (msg: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;

  // Typing
  partnerTyping: boolean;
  setPartnerTyping: (v: boolean) => void;

  // Seen receipt — timestamp of when partner last read our messages
  partnerSeenAt: number | null;
  setPartnerSeenAt: (t: number | null) => void;

  // Reset everything (used on leave)
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  filters: null,
  setFilters: (filters) => set({ filters }),

  status: "idle",
  setStatus: (status) => set({ status }),

  roomId: null,
  setRoomId: (roomId) => set({ roomId }),

  partnerSession: null,
  setPartnerSession: (partnerSession) => set({ partnerSession }),

  partnerNickname: "Anonymous",
  setPartnerNickname: (partnerNickname) => set({ partnerNickname }),

  partnerLeftReason: null,
  setPartnerLeftReason: (partnerLeftReason) => set({ partnerLeftReason }),

  queueMessage: "Looking for someone...",
  setQueueMessage: (queueMessage) => set({ queueMessage }),

  messages: [],
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  clearMessages: () => set({ messages: [] }),

  partnerTyping: false,
  setPartnerTyping: (partnerTyping) => set({ partnerTyping }),

  partnerSeenAt: null,
  setPartnerSeenAt: (partnerSeenAt) => set({ partnerSeenAt }),

  reset: () =>
    set({
      status: "idle",
      roomId: null,
      partnerSession: null,
      partnerNickname: "Anonymous",
      partnerLeftReason: null,
      messages: [],
      partnerTyping: false,
      partnerSeenAt: null,
      queueMessage: "Looking for someone...",
    }),
}));
