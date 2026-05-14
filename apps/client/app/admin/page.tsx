"use client";

import { useEffect, useState, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveStats {
  totalMatches: number;
  totalMessages: number;
  activeRooms: number;
  onlineUsers: number;
  queues: { friendly: number; deep: number; flirty: number };
}

interface DayStat   { date: string; matches: number; messages: number }
interface ReportStat { reason: string; _count: { reason: number } }
interface UniStat    { university: string; count: number }
interface Overview   { totalMatches: number; totalReports: number; totalMatchLogs: number }

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken()              { return localStorage.getItem("admin_token"); }
function setToken(t: string)     { localStorage.setItem("admin_token", t); }
function clearToken()            { localStorage.removeItem("admin_token"); }

async function apiFetch(path: string) {
  const res = await fetch(`${API}/admin${path}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (res.status === 401) { clearToken(); throw new Error("Unauthorized"); }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check existing token on mount
  useEffect(() => {
    if (getToken()) {
      apiFetch("/live")
        .then(() => setAuthed(true))
        .catch(() => { clearToken(); })
        .finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, []);

  if (checking) return <Loader />;
  if (!authed)  return <LoginScreen onSuccess={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { clearToken(); setAuthed(false); }} />;
}

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [secret, setSecret] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!secret.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API}/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setToken(data.token);
      onSuccess();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080B0F] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-xs text-emerald-400 tracking-[0.3em] uppercase">
              HeatMatch Admin
            </span>
          </div>
          <h1 className="font-mono text-white text-2xl font-bold tracking-tight">
            Access Terminal
          </h1>
        </div>

        {/* Form */}
        <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-6 font-mono">
          <div className="flex items-center gap-2 text-emerald-400 text-xs mb-4">
            <span>$</span><span className="text-gray-400">authenticate --role admin</span>
          </div>

          <label className="block text-[11px] text-gray-500 mb-1.5 tracking-widest uppercase">
            Secret Key
          </label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="enter secret..."
            className="w-full bg-[#161B22] border border-[#30363D] rounded-lg px-4 py-2.5
                       text-sm text-white placeholder-gray-700 font-mono
                       focus:outline-none focus:border-emerald-500 transition-colors mb-4"
          />

          {error && (
            <div className="text-red-400 text-xs mb-3 flex items-center gap-1.5">
              <span>✗</span> {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !secret.trim()}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30
                       disabled:cursor-not-allowed text-white text-sm font-mono font-semibold
                       rounded-lg transition-colors"
          >
            {loading ? "Verifying..." : "$ login"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [live, setLive]         = useState<LiveStats | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [daily, setDaily]       = useState<DayStat[]>([]);
  const [reports, setReports]   = useState<ReportStat[]>([]);
  const [unis, setUnis]         = useState<UniStat[]>([]);
  const [lastUpdate, setLastUpdate] = useState("");
  const [error, setError]       = useState("");

  const fetchAll = useCallback(async () => {
    try {
      const [l, o, d, r, u] = await Promise.all([
        apiFetch("/live"),
        apiFetch("/overview"),
        apiFetch("/daily?days=14"),
        apiFetch("/reports"),
        apiFetch("/universities?limit=8"),
      ]);
      setLive(l);
      setOverview(o);
      setDaily(d);
      setReports(r);
      setUnis(u);
      setLastUpdate(new Date().toLocaleTimeString());
      setError("");
    } catch (e: any) {
      if (e.message === "Unauthorized") onLogout();
      else setError("Failed to fetch data");
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 15_000); // auto-refresh every 15s
    return () => clearInterval(interval);
  }, [fetchAll]);

  const maxMatches = Math.max(...daily.map((d) => d.matches), 1);

  return (
    <div className="min-h-screen bg-[#080B0F] text-white font-mono">

      {/* Header */}
      <div className="border-b border-[#21262D] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs tracking-[0.25em] uppercase">
            HeatMatch Admin
          </span>
          <span className="text-gray-700 text-xs">
            /{" "}{lastUpdate && `Updated ${lastUpdate}`}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          $ logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

        {error && (
          <div className="text-red-400 text-xs border border-red-900 rounded-lg px-4 py-2">
            ✗ {error}
          </div>
        )}

        {/* ── Live section ── */}
        <Section label="live —— real-time">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Online Now"    value={live?.onlineUsers ?? "—"} accent="emerald" />
            <StatCard label="Active Rooms"  value={live?.activeRooms ?? "—"} accent="blue" />
            <StatCard label="Total Matches" value={live?.totalMatches ?? "—"} accent="violet" />
            <StatCard label="Msg Sent"      value={live?.totalMessages ?? "—"} accent="amber" />
          </div>

          {/* Queue sizes */}
          <div className="mt-4 bg-[#0D1117] border border-[#21262D] rounded-xl p-4">
            <p className="text-[10px] text-gray-600 tracking-widest uppercase mb-3">
              Queue Sizes
            </p>
            <div className="flex gap-6">
              {[
                { label: "🤝 Friendly", val: live?.queues.friendly ?? 0 },
                { label: "💬 Deep",     val: live?.queues.deep     ?? 0 },
                { label: "🔥 Flirty",  val: live?.queues.flirty   ?? 0 },
              ].map((q) => (
                <div key={q.label}>
                  <span className="text-gray-400 text-xs">{q.label}</span>
                  <div className="text-xl font-bold text-white mt-0.5">{q.val}</div>
                  <div className="text-[10px] text-gray-600">waiting</div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Daily chart ── */}
        <Section label="activity —— last 14 days">
          <div className="bg-[#0D1117] border border-[#21262D] rounded-xl p-5">
            {daily.length === 0 ? (
              <EmptyState label="No data yet" />
            ) : (
              <div className="flex items-end gap-1.5 h-32">
                {daily.map((d) => {
                  const pct = Math.round((d.matches / maxMatches) * 100);
                  const label = new Date(d.date).toLocaleDateString("en", {
                    month: "short", day: "numeric",
                  });
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col items-center gap-1 group"
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity
                                      text-[9px] text-emerald-400 whitespace-nowrap">
                        {d.matches}
                      </div>
                      {/* Bar */}
                      <div className="w-full flex items-end" style={{ height: "96px" }}>
                        <div
                          className="w-full bg-emerald-500/70 hover:bg-emerald-400 rounded-t
                                     transition-all duration-300 min-h-[2px]"
                          style={{ height: `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                      {/* Date */}
                      <span className="text-[8px] text-gray-700 rotate-45 origin-left
                                       hidden sm:block mt-1 ml-1">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="text-[10px] text-gray-700 mt-3">Matches per day</p>
          </div>
        </Section>

        {/* ── Bottom two-col ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Reports */}
          <Section label="reports —— by reason">
            <div className="bg-[#0D1117] border border-[#21262D] rounded-xl divide-y divide-[#21262D]">
              {reports.length === 0 ? (
                <div className="p-4"><EmptyState label="No reports yet" /></div>
              ) : (
                reports.map((r) => {
                  const total = reports.reduce((s, x) => s + x._count.reason, 0);
                  const pct = Math.round((r._count.reason / total) * 100);
                  const EMOJI: Record<string, string> = {
                    harassment: "😤", spam: "🤖", underage: "🔞",
                    explicit: "🚫", other: "📋",
                  };
                  return (
                    <div key={r.reason} className="px-4 py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span>{EMOJI[r.reason] ?? "•"}</span>
                        <span className="text-gray-300 capitalize">{r.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1 bg-[#21262D] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right tabular-nums">
                          {r._count.reason}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {overview && (
              <p className="text-[10px] text-gray-700 mt-2">
                {overview.totalReports} total reports
              </p>
            )}
          </Section>

          {/* Universities */}
          <Section label="universities —— top by matches">
            <div className="bg-[#0D1117] border border-[#21262D] rounded-xl divide-y divide-[#21262D]">
              {unis.length === 0 ? (
                <div className="p-4"><EmptyState label="No matches yet" /></div>
              ) : (
                unis.map((u, i) => {
                  const maxCount = unis[0].count;
                  const pct = Math.round((u.count / maxCount) * 100);
                  return (
                    <div key={u.university} className="px-4 py-2.5 flex items-center gap-3">
                      <span className="text-[10px] text-gray-700 w-4 tabular-nums">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-300 truncate">{u.university}</p>
                        <div className="w-full h-0.5 bg-[#21262D] rounded-full mt-1.5 overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums w-6 text-right">
                        {u.count}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-gray-800 pb-4">
          Auto-refreshes every 15s · Data is anonymized · No personal info stored
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-gray-600 tracking-[0.3em] uppercase mb-3">{label}</p>
      {children}
    </div>
  );
}

function StatCard({
  label, value, accent,
}: {
  label: string; value: number | string;
  accent: "emerald" | "blue" | "violet" | "amber";
}) {
  const colors = {
    emerald: "border-emerald-900/50 text-emerald-400",
    blue:    "border-blue-900/50    text-blue-400",
    violet:  "border-violet-900/50  text-violet-400",
    amber:   "border-amber-900/50   text-amber-400",
  };
  return (
    <div className={`bg-[#0D1117] border rounded-xl p-4 ${colors[accent]}`}>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-[10px] text-gray-600 tracking-widest uppercase mt-1">{label}</div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs text-gray-700 text-center py-4">{label}</p>
  );
}

function Loader() {
  return (
    <div className="min-h-screen bg-[#080B0F] flex items-center justify-center">
      <span className="font-mono text-emerald-400 text-sm animate-pulse">
        Initializing...
      </span>
    </div>
  );
}
