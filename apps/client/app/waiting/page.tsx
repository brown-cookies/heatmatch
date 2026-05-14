"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/useAppStore";
import { useSocket } from "@/hooks/useSocket";
import { ThemeToggle } from "@/components/ThemeToggle";

const STAGES = [
  { label: "Searching with your filters",    detail: "Strict match" },
  { label: "Widening age range ±3 years",    detail: "Stage 2 of 3" },
  { label: "Opening to all universities",    detail: "Stage 3 of 3" },
];

export default function WaitingPage() {
  const router = useRouter();
  const { status, queueMessage, filters } = useAppStore();
  const { leave } = useSocket();

  useEffect(() => {
    if (status === "idle") router.replace("/");
  }, [status]);

  const stage =
    queueMessage.includes("age") ? 1 :
    queueMessage.includes("universit") ? 2 : 0;

  return (
    <main className="min-h-screen bg-bg flex flex-col">

      {/* Header */}
      <div className="px-5 pt-8 pb-0 flex items-center justify-between">
        <p className="text-[10px] text-text-muted tracking-[0.25em] uppercase font-medium">
          HeatMatch
        </p>
        <ThemeToggle />
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 -mt-12">

        {/* Flat pulsing square — no circles */}
        <div className="relative mb-10">
          <div className="w-20 h-20 bg-accent rounded-2xl flex items-center justify-center
                          animate-pulse">
            <span className="text-3xl">👤</span>
          </div>
          {/* Flat expanding squares */}
          <div className="absolute inset-0 rounded-2xl border-2 border-accent/30
                          animate-ping" />
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-1">
          Finding your stranger
        </h2>
        <p className="text-sm text-text-secondary mb-10">
          {queueMessage}
        </p>

        {/* Stage steps — flat list */}
        <div className="w-full max-w-xs space-y-2">
          {STAGES.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                i === stage
                  ? "bg-accent text-white"
                  : i < stage
                  ? "bg-elevated text-text-secondary"
                  : "bg-surface text-text-muted"
              }`}
            >
              <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px]
                               font-bold shrink-0 ${
                i < stage
                  ? "bg-success text-bg"
                  : i === stage
                  ? "bg-white/20 text-white"
                  : "bg-border text-text-muted"
              }`}>
                {i < stage ? "✓" : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{s.label}</p>
              </div>
              {i === stage && (
                <div className="flex gap-0.5">
                  {[0,1,2].map((j) => (
                    <span key={j}
                          className="w-1 h-1 rounded-full bg-white/60"
                          style={{ animation: `bounceDot 1.2s ${j*0.2}s ease-in-out infinite` }} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Your vibe badge */}
        {filters && (
          <div className="mt-8 flex items-center gap-2 bg-elevated px-4 py-2 rounded-full">
            <span className="text-sm">
              {filters.vibe === "flirty" ? "🔥" : filters.vibe === "deep" ? "💬" : "🤝"}
            </span>
            <span className="text-xs text-text-secondary font-medium capitalize">
              {filters.vibe} mode
            </span>
            <span className="text-text-muted">·</span>
            <span className="text-xs text-text-secondary font-medium">
              {filters.nickname}
            </span>
          </div>
        )}
      </div>

      {/* Cancel */}
      <div className="px-5 pb-10 pt-4">
        <button
          onClick={leave}
          className="w-full py-3.5 bg-elevated hover:bg-border active:scale-[0.98]
                     text-text-secondary font-semibold text-sm rounded-2xl transition-all"
        >
          Cancel
        </button>
      </div>
    </main>
  );
}
