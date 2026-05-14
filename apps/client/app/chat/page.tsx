"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useSocket } from "@/hooks/useSocket";
import { ReportModal } from "@/components/ReportModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function ChatPage() {
  const router = useRouter();
  const {
    status, messages, partnerTyping,
    filters, roomId, partnerSession,
    partnerNickname, partnerLeftReason,
    partnerSeenAt, reset,
  } = useAppStore();
  const { sendMessage, emitTyping, emitSeen, skip, leave, joinQueue } = useSocket();

  const [input, setInput]           = useState("");
  const [isTyping, setIsTyping]     = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const typingTimer                 = useRef<NodeJS.Timeout | null>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  useEffect(() => { if (!filters) router.replace("/"); }, [filters]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, partnerTyping]);

  const emitSeenIfFocused = useCallback(() => {
    if (document.visibilityState === "visible") emitSeen();
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (last?.sender === "stranger") emitSeenIfFocused();
  }, [messages]);

  useEffect(() => {
    document.addEventListener("visibilitychange", emitSeenIfFocused);
    return () => document.removeEventListener("visibilitychange", emitSeenIfFocused);
  }, [emitSeenIfFocused]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setInput(e.target.value);
    if (!isTyping) { emitTyping(); setIsTyping(true); }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setIsTyping(false), 1500);
  }

  function handleSend() {
    const text = input.trim();
    if (!text) return;
    sendMessage(text);
    setInput("");
    setIsTyping(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleFindNext() {
    if (filters) joinQueue(filters);
  }

  function handleGoHome() { reset(); router.push("/"); }

  const lastSentIdx = [...messages].reverse().findIndex((m) => m.sender === "you");
  const lastSentMsg = lastSentIdx >= 0 ? messages[messages.length - 1 - lastSentIdx] : null;
  const isSeen = lastSentMsg !== null && partnerSeenAt !== null && partnerSeenAt >= lastSentMsg.timestamp;
  const isChatting = status === "chatting";

  const vibeEmoji = filters?.vibe === "flirty" ? "🔥" : filters?.vibe === "deep" ? "💬" : "🤝";

  return (
    <div className="h-screen flex flex-col bg-bg">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-surface px-4 py-3 flex items-center gap-3 shrink-0">
        {/* Back */}
        <button
          onClick={() => setMenuOpen(false)}
          className="w-8 h-8 flex items-center justify-center text-text-secondary
                     hover:text-text-primary transition-colors rounded-lg"
        >
          ←
        </button>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-9 h-9 bg-accent/15 rounded-xl flex items-center justify-center text-base">
            👤
          </div>
          {isChatting && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full
                             bg-success border-2 border-surface" />
          )}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary truncate">{partnerNickname}</p>
          <p className="text-[11px] text-text-muted truncate">
            {partnerTyping
              ? <span className="text-accent font-medium">typing...</span>
              : <>{vibeEmoji} {filters?.vibe} mode</>
            }
          </p>
        </div>

        {/* Desktop actions */}
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <button
            onClick={skip}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-xs font-semibold text-text-secondary hover:text-text-primary
                       hover:bg-elevated transition-all"
          >
            Skip <span className="text-text-muted">→</span>
          </button>
          <button
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                       text-xs font-semibold text-text-secondary hover:text-danger
                       hover:bg-elevated transition-all"
          >
            Report
          </button>
          <button
            onClick={leave}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold
                       text-danger hover:bg-danger/10 transition-all"
          >
            Leave
          </button>
        </div>

        {/* Mobile: theme + kebab */}
        <div className="sm:hidden flex items-center gap-1 shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-8 h-8 flex items-center justify-center text-text-secondary
                       hover:text-text-primary transition-colors rounded-lg font-bold text-base"
          >
            &#8943;
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-surface border-b border-border flex animate-fade-in shrink-0">
          {[
            { label: "Skip →",  fn: () => { skip(); setMenuOpen(false); }, cls: "text-text-secondary" },
            { label: "Report",  fn: () => { setShowReport(true); setMenuOpen(false); }, cls: "text-text-secondary" },
            { label: "Leave",   fn: leave,  cls: "text-danger" },
          ].map(({ label, fn, cls }) => (
            <button key={label} onClick={fn}
                    className={`flex-1 py-2.5 text-xs font-semibold ${cls} hover:bg-elevated transition-colors`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── Messages ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-1">

        {messages.length === 0 && isChatting && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center text-2xl mb-4">
              👋
            </div>
            <p className="text-text-primary font-semibold text-sm">
              Say hi to <span className="text-accent">{partnerNickname}</span>
            </p>
            <p className="text-text-muted text-xs mt-1">Messages disappear when you leave.</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isYou  = msg.sender === "you";
          const isLast = msg.id === lastSentMsg?.id;
          const prev   = messages[idx - 1];
          const next   = messages[idx + 1];
          const sameAsPrev = prev?.sender === msg.sender;
          const sameAsNext = next?.sender === msg.sender;

          // Flat bubble shape based on grouping
          const radius = isYou
            ? `rounded-2xl rounded-tr-${sameAsPrev ? "2xl" : "sm"} rounded-br-${sameAsNext ? "2xl" : "sm"}`
            : `rounded-2xl rounded-tl-${sameAsPrev ? "2xl" : "sm"} rounded-bl-${sameAsNext ? "2xl" : "sm"}`;

          return (
            <div key={msg.id} className={`flex flex-col ${isYou ? "items-end" : "items-start"} animate-fade-in`}>
              {/* Sender label — first in group only */}
              {!sameAsPrev && (
                <span className="text-[10px] text-text-muted font-medium mb-1 px-1">
                  {isYou ? (filters?.nickname || "You") : partnerNickname}
                </span>
              )}

              {/* Bubble */}
              <div className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 text-sm leading-relaxed
                               break-words ${radius} ${
                isYou
                  ? "bg-accent text-white"
                  : "bg-surface text-text-primary"
              }`}>
                {msg.text}

                {/* Timestamp — only on last of group */}
                {!sameAsNext && (
                  <span className={`block text-[10px] mt-1 ${
                    isYou ? "text-white/50 text-right" : "text-text-muted"
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </div>

              {/* Seen / Sent receipt */}
              {isYou && isLast && (
                <div className="flex items-center gap-1 mt-1 px-1 h-3">
                  {isSeen ? (
                    <>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                           stroke="#FF6B55" strokeWidth="2.5" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span className="text-[10px] text-accent font-medium">Seen</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-text-muted">Sent</span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {partnerTyping && (
          <div className="flex flex-col items-start animate-fade-in">
            <span className="text-[10px] text-text-muted font-medium mb-1 px-1">{partnerNickname}</span>
            <div className="bg-surface rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1.5 items-center">
              {[0,1,2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-text-muted"
                      style={{ animation: `bounceDot 1.2s ${i*0.15}s ease-in-out infinite` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input ───────────────────────────────────────────────────────────── */}
      <div className="bg-surface px-4 py-3 shrink-0">
        <div className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={isChatting ? `Message ${partnerNickname}...` : "Waiting..."}
            maxLength={500}
            disabled={!isChatting}
            className="flex-1 min-w-0 bg-elevated text-text-primary text-sm font-medium
                       placeholder-text-muted px-4 py-3 rounded-xl border-0
                       focus:outline-none focus:ring-2 focus:ring-accent/40
                       disabled:opacity-40 disabled:cursor-not-allowed transition-shadow"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !isChatting}
            className="w-11 h-11 rounded-xl bg-accent hover:bg-accent-dark disabled:opacity-30
                       disabled:cursor-not-allowed transition-all flex items-center justify-center
                       shrink-0 active:scale-90"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                 stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Char count */}
        <div className="h-3 mt-1.5 flex items-center justify-end">
          {input.length > 400 && (
            <span className={`text-[10px] tabular-nums ${input.length >= 490 ? "text-danger" : "text-text-muted"}`}>
              {500 - input.length}
            </span>
          )}
        </div>
      </div>

      {/* ── Partner Left Overlay ─────────────────────────────────────────────── */}
      {partnerLeftReason && (
        <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm z-40
                        flex items-end sm:items-center justify-center
                        px-4 pb-8 sm:pb-0 animate-fade-in">
          <div className="w-full max-w-sm bg-surface rounded-2xl p-6
                          text-center animate-slide-up">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center text-2xl
                            bg-elevated">
              {partnerLeftReason === "skip" ? "⏭️" : "👋"}
            </div>
            <h3 className="text-text-primary font-bold text-base mb-1">
              {partnerLeftReason === "skip"
                ? `${partnerNickname} skipped`
                : `${partnerNickname} left`}
            </h3>
            <p className="text-text-muted text-xs mb-6">
              {partnerLeftReason === "skip"
                ? "They moved on — ready for your next match?"
                : "The chat has ended."}
            </p>
            <div className="space-y-2">
              <button
                onClick={handleFindNext}
                className="w-full py-3.5 bg-accent hover:bg-accent-dark text-white
                           font-bold text-sm rounded-xl transition-all active:scale-[0.98]"
              >
                Find Next →
              </button>
              <button
                onClick={handleGoHome}
                className="w-full py-3 text-text-secondary hover:text-text-primary
                           font-medium text-sm rounded-xl hover:bg-elevated transition-all"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReport && filters && roomId && partnerSession && (
        <ReportModal
          reporterSession={filters.sessionId}
          reportedSession={partnerSession}
          roomId={roomId}
          onClose={() => setShowReport(false)}
          onReported={() => { setShowReport(false); skip(); }}
        />
      )}
    </div>
  );
}
