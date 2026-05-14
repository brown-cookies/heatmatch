"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getSocket } from "@/lib/socket";
import { useAppStore } from "@/store/useAppStore";
import { ChatMessage, UserFilters } from "@heatmatch/types";

export function useSocket() {
  const router = useRouter();
  const typingTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    setStatus,
    setRoomId,
    setPartnerSession,
    setPartnerNickname,
    setPartnerLeftReason,
    setQueueMessage,
    addMessage,
    setPartnerTyping,
    setPartnerSeenAt,
    reset,
  } = useAppStore();

  useEffect(() => {
    const socket = getSocket();

    // ── Connect ──────────────────────────────────────────────────────────────
    if (!socket.connected) socket.connect();

    // ── Server → Client Events ───────────────────────────────────────────────

    socket.on("matched", ({ roomId, partnerSession, partnerNickname }) => {
      setRoomId(roomId);
      setPartnerSession(partnerSession);
      setPartnerNickname(partnerNickname || "Anonymous");
      setPartnerLeftReason(null);
      setStatus("chatting");
      router.push("/chat");
    });

    socket.on("receive_message", (msg: ChatMessage) => {
      addMessage(msg);
    });

    socket.on("partner_typing", () => {
      setPartnerTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setPartnerTyping(false), 2000);
    });

    socket.on("partner_left", ({ reason }) => {
      // Don't navigate — let chat page show the "left" overlay
      setPartnerLeftReason(reason);
      setStatus("idle");
      setRoomId(null);
      setPartnerSession(null);
    });

    socket.on("partner_seen", () => {
      setPartnerSeenAt(Date.now());
    });

    socket.on("queue_status", ({ message }) => {
      setQueueMessage(message);
    });

    socket.on("no_match", () => {
      setStatus("idle");
      setRoomId(null);
      setPartnerSession(null);
      router.push("/");
    });

    return () => {
      socket.off("matched");
      socket.off("receive_message");
      socket.off("partner_typing");
      socket.off("partner_seen");
      socket.off("partner_left");
      socket.off("queue_status");
      socket.off("no_match");
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────────

  function joinQueue(filters: UserFilters) {
    const socket = getSocket();
    socket.emit("join_queue", filters);
    setStatus("queued");
    router.push("/waiting");
  }

  function sendMessage(text: string) {
    const socket = getSocket();
    const msg: ChatMessage = {
      id: uuidv4(),
      text,
      sender: "you",
      timestamp: Date.now(),
    };
    addMessage(msg);
    socket.emit("send_message", text);
  }

  function emitTyping() {
    getSocket().emit("typing");
  }

  // Emitted when user receives and reads a message while chat is focused
  function emitSeen() {
    getSocket().emit("seen");
  }

  function skip() {
    getSocket().emit("skip");
    setStatus("queued");
    router.push("/waiting");
  }

  function leave() {
    getSocket().emit("leave");
    reset();
    router.push("/");
  }

  return { joinQueue, sendMessage, emitTyping, emitSeen, skip, leave };
}
