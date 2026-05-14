"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { UserFilters, Gender, LookingFor, Vibe } from "@heatmatch/types";
import { useAppStore } from "@/store/useAppStore";
import { useSocket } from "@/hooks/useSocket";
import { useUniversities } from "@/hooks/useUniversities";
import { useFormPersist } from "@/hooks/useFormPersist";
import { ThemeToggle } from "@/components/ThemeToggle";

const VIBES: { value: Vibe; emoji: string; label: string; sub: string }[] = [
  { value: "friendly", emoji: "🤝", label: "Friendly", sub: "Casual" },
  { value: "deep", emoji: "💬", label: "Deep Talk", sub: "Serious" },
  { value: "flirty", emoji: "🔥", label: "Flirty", sub: "18+" },
];

export default function HomePage() {
  const { setFilters } = useAppStore();
  const { joinQueue } = useSocket();
  const { grouped, loading: uniLoading } = useUniversities();

  // ── Persisted form state ─────────────────────────────────────────────────────
  // Survives navigation and cancelling back to this page.
  // Automatically cleared when the browser tab is closed (sessionStorage).
  const { form, setForm } = useFormPersist();
  const { nickname, gender, lookingFor, university, ageMin, ageMax, vibe } =
    form;

  const [ageGate, setAgeGate] = useState(false);
  const [error, setError] = useState("");

  // ── Age input handlers ──────────────────────────────────────────────────────
  // Update freely while typing; clamp to valid range on blur.

  function handleAgeMin(raw: string) {
    const n = parseInt(raw);
    if (isNaN(n)) return;
    setForm({ ageMin: Math.min(Math.max(n, 18), ageMax) });
  }

  function handleAgeMax(raw: string) {
    const n = parseInt(raw);
    if (isNaN(n)) return;
    setForm({ ageMax: Math.min(Math.max(n, ageMin), 60) });
  }

  function handleStart() {
    if (vibe === "flirty" && !ageGate) {
      setError("Confirm you're 18+ to use Flirty mode.");
      return;
    }
    setError("");
    const filters: UserFilters = {
      sessionId: uuidv4(),
      gender,
      lookingFor,
      university,
      ageRange: [ageMin, ageMax],
      vibe,
      nickname: nickname.trim() || "Anonymous",
    };
    setFilters(filters);
    joinQueue(filters);
  }

  return (
    <main className="min-h-screen bg-bg flex items-start md:items-center justify-center">
      <div className="w-full md:max-w-md md:my-8 md:rounded-3xl md:shadow-2xl md:overflow-hidden bg-bg flex flex-col min-h-screen md:min-h-0">
        {/* Top bar */}
        <div className="px-5 pt-8 pb-2 flex items-end justify-between">
          <div>
            <p className="text-[10px] text-text-muted tracking-[0.25em] uppercase font-medium mb-1">
              Anonymous Chat
            </p>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">
              Heat<span className="text-accent">Match</span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
            Live
          </div>
          <ThemeToggle />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
          {/* Nickname */}
          <Section label="Your name">
            <input
              type="text"
              value={nickname}
              onChange={(e) =>
                setForm({ nickname: e.target.value.slice(0, 20) })
              }
              placeholder="Anonymous"
              className="w-full bg-elevated text-text-primary placeholder-text-muted
                         text-sm font-medium px-4 py-3 rounded-xl border-0
                         focus:outline-none focus:ring-2 focus:ring-accent/40
                         transition-shadow"
            />
          </Section>

          {/* Gender */}
          <Section label="I am">
            <div className="flex gap-2">
              {(["male", "female"] as Gender[]).map((g) => (
                <Pill
                  key={g}
                  active={gender === g}
                  onClick={() => setForm({ gender: g })}
                >
                  {g === "male" ? "Male" : "Female"}
                </Pill>
              ))}
            </div>
          </Section>

          {/* Looking for */}
          <Section label="Looking for">
            <div className="flex gap-2">
              {(["male", "female", "both"] as LookingFor[]).map((l) => (
                <Pill
                  key={l}
                  active={lookingFor === l}
                  onClick={() => setForm({ lookingFor: l })}
                >
                  {l === "male" ? "Male" : l === "female" ? "Female" : "Anyone"}
                </Pill>
              ))}
            </div>
          </Section>

          {/* University */}
          <Section label="University">
            <div className="relative">
              <select
                value={university}
                onChange={(e) => setForm({ university: e.target.value })}
                disabled={uniLoading}
                className="w-full appearance-none bg-elevated text-text-primary text-sm font-medium
                           px-4 py-3 pr-9 rounded-xl border-0
                           focus:outline-none focus:ring-2 focus:ring-accent/40
                           transition-shadow disabled:opacity-50"
              >
                <option value="any">Any university</option>
                {Object.entries(grouped).map(([region, unis]) => (
                  <optgroup key={region} label={region}>
                    {unis.map((u) => (
                      <option key={u.name} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </Section>

          {/* Age range */}
          <Section label="Age range">
            <div className="flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] text-text-muted uppercase tracking-widest">
                  Min
                </span>
                <input
                  type="number"
                  min={18}
                  max={ageMax}
                  value={ageMin}
                  onChange={(e) => setForm({ ageMin: Number(e.target.value) })}
                  onBlur={(e) => handleAgeMin(e.target.value)}
                  className="w-full bg-elevated text-text-primary text-sm font-semibold
                             px-4 py-3 rounded-xl border-0 text-center
                             focus:outline-none focus:ring-2 focus:ring-accent/40
                             transition-shadow [appearance:textfield]
                             [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-text-muted text-sm mt-5">—</span>
              <div className="flex-1 flex flex-col gap-1">
                <span className="text-[10px] text-text-muted uppercase tracking-widest">
                  Max
                </span>
                <input
                  type="number"
                  min={ageMin}
                  max={60}
                  value={ageMax}
                  onChange={(e) => setForm({ ageMax: Number(e.target.value) })}
                  onBlur={(e) => handleAgeMax(e.target.value)}
                  className="w-full bg-elevated text-text-primary text-sm font-semibold
                             px-4 py-3 rounded-xl border-0 text-center
                             focus:outline-none focus:ring-2 focus:ring-accent/40
                             transition-shadow [appearance:textfield]
                             [&::-webkit-outer-spin-button]:appearance-none
                             [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </Section>

          {/* Vibe */}
          <Section label="Vibe">
            <div className="grid grid-cols-3 gap-2">
              {VIBES.map((v) => (
                <button
                  key={v.value}
                  onClick={() => {
                    setForm({ vibe: v.value });
                    setError("");
                  }}
                  className={`flex flex-col items-center py-3.5 px-2 rounded-xl text-xs font-medium
                              transition-all active:scale-95 ${
                                vibe === v.value
                                  ? "bg-accent text-white"
                                  : "bg-elevated text-text-secondary hover:bg-border"
                              }`}
                >
                  <span className="text-xl mb-1.5">{v.emoji}</span>
                  <span className="font-semibold">{v.label}</span>
                  <span
                    className={`text-[10px] mt-0.5 ${vibe === v.value ? "text-white/70" : "text-text-muted"}`}
                  >
                    {v.sub}
                  </span>
                </button>
              ))}
            </div>

            {vibe === "flirty" && (
              <label className="flex items-start gap-2.5 mt-3 p-3 bg-elevated rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={ageGate}
                  onChange={(e) => {
                    setAgeGate(e.target.checked);
                    setError("");
                  }}
                  className="mt-0.5 w-4 h-4 shrink-0 accent-accent"
                />
                <span className="text-xs text-text-secondary leading-relaxed">
                  I confirm I am 18 or older
                </span>
              </label>
            )}
          </Section>
        </div>

        {/* Footer CTA */}
        <div className="px-5 pt-2 pb-8 space-y-2">
          {error && <p className="text-xs text-danger text-center">{error}</p>}
          <button
            onClick={handleStart}
            className="w-full py-4 bg-accent hover:bg-accent-dark active:scale-[0.98]
                       text-white font-bold text-sm rounded-2xl transition-all"
          >
            Find a Stranger →
          </button>
          <p className="text-[10px] text-text-muted text-center">
            No login · No messages stored · Fully anonymous
          </p>
        </div>
      </div>
    </main>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-3">
      <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-semibold mb-2.5">
        {label}
      </p>
      {children}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
        active
          ? "bg-accent text-white"
          : "bg-elevated text-text-secondary hover:bg-border"
      }`}
    >
      {children}
    </button>
  );
}
