"use client";

import { useState } from "react";
import { ReportReason } from "@heatmatch/types";

const API = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

const REASONS: { value: ReportReason; label: string; emoji: string }[] = [
  { value: "harassment", label: "Harassment / threats",      emoji: "😤" },
  { value: "spam",       label: "Spam or bot",               emoji: "🤖" },
  { value: "underage",   label: "Appears to be underage",    emoji: "🔞" },
  { value: "explicit",   label: "Unwanted explicit content", emoji: "🚫" },
  { value: "other",      label: "Other",                     emoji: "📋" },
];

interface Props {
  reporterSession: string;
  reportedSession: string;
  roomId: string;
  onClose: () => void;
  onReported: () => void;
}

export function ReportModal({ reporterSession, reportedSession, roomId, onClose, onReported }: Props) {
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit() {
    if (!selected) return;
    setStatus("loading");
    try {
      const res = await fetch(`${API}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reporterSession, reportedSession, roomId, reason: selected }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
      setTimeout(onReported, 1200);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-end sm:items-center
                    justify-center px-4 pb-6 sm:pb-0 animate-fade-in"
         onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm bg-surface rounded-2xl p-5 animate-slide-up">

        {status === "done" ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 mx-auto mb-4 bg-success/15 rounded-2xl flex items-center justify-center text-2xl">✅</div>
            <p className="text-text-primary font-bold mb-1">Report Submitted</p>
            <p className="text-text-muted text-xs">Thanks for keeping this space safe.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-text-primary">Report Stranger</p>
              <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg transition-colors">✕</button>
            </div>

            <p className="text-xs text-text-muted mb-3">Why are you reporting this person?</p>

            <div className="space-y-1.5 mb-4">
              {REASONS.map((r) => (
                <button key={r.value} onClick={() => setSelected(r.value)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm
                                    text-left font-medium transition-all ${
                          selected === r.value
                            ? "bg-danger/15 text-danger"
                            : "bg-elevated text-text-secondary hover:bg-border"
                        }`}>
                  <span>{r.emoji}</span> {r.label}
                </button>
              ))}
            </div>

            {status === "error" && (
              <p className="text-danger text-xs text-center mb-3">Failed to submit. Try again.</p>
            )}

            <button onClick={handleSubmit}
                    disabled={!selected || status === "loading"}
                    className="w-full py-3.5 bg-danger hover:bg-red-600 disabled:opacity-30
                               disabled:cursor-not-allowed text-white font-bold text-sm
                               rounded-xl transition-all active:scale-[0.98]">
              {status === "loading" ? "Submitting..." : "Submit & Skip"}
            </button>

            <p className="text-[10px] text-text-muted text-center mt-3">
              Reports are anonymous. No personal data stored.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
