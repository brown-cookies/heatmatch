import { QueueEntry } from "@heatmatch/types";

// ─── Filter Stages ────────────────────────────────────────────────────────────
// We relax filters over time. Each stage loosens constraints.
// Vibe is NEVER relaxed — it requires mutual opt-in.

export type RelaxStage = 0 | 1 | 2;
// Stage 0 → strict: all filters apply
// Stage 1 → relax age: expand ±3 years on each side
// Stage 2 → relax university: treat both as "any"

// ─── Gender Check ─────────────────────────────────────────────────────────────
// Both users must want each other.
// "both" means the user accepts any gender.

function genderMatch(a: QueueEntry, b: QueueEntry): boolean {
  const aWantsB =
    a.lookingFor === "both" || a.lookingFor === b.gender;
  const bWantsA =
    b.lookingFor === "both" || b.lookingFor === a.gender;
  return aWantsB && bWantsA;
}

// ─── University Check ─────────────────────────────────────────────────────────
// Match if either is "any" or both are the same university.

function universityMatch(
  a: QueueEntry,
  b: QueueEntry,
  relaxed: boolean
): boolean {
  if (relaxed) return true;
  return (
    a.university === "any" ||
    b.university === "any" ||
    a.university === b.university
  );
}

// ─── Age Range Overlap ────────────────────────────────────────────────────────
// Two ranges [a0, a1] and [b0, b1] overlap if a0 <= b1 AND b0 <= a1.
// Stage 1 relaxation expands each range by ±3 years before checking.

function ageMatch(
  a: QueueEntry,
  b: QueueEntry,
  relaxed: boolean
): boolean {
  const expand = relaxed ? 3 : 0;
  const aMin = a.ageRange[0] - expand;
  const aMax = a.ageRange[1] + expand;
  const bMin = b.ageRange[0] - expand;
  const bMax = b.ageRange[1] + expand;
  return aMin <= bMax && bMin <= aMax;
}

// ─── Main Match Check ─────────────────────────────────────────────────────────

export function isMatch(
  a: QueueEntry,
  b: QueueEntry,
  stage: RelaxStage
): boolean {
  // Never match a user with themselves
  if (a.sessionId === b.sessionId) return false;

  const ageRelaxed = stage >= 1;
  const uniRelaxed = stage >= 2;

  return (
    genderMatch(a, b) &&
    universityMatch(a, b, uniRelaxed) &&
    ageMatch(a, b, ageRelaxed)
    // vibe is pre-filtered by queue key — no check needed here
  );
}

// ─── Find Best Match ──────────────────────────────────────────────────────────
// Given a user and a list of queue entries, find the first compatible match.

export function findMatch(
  user: QueueEntry,
  candidates: QueueEntry[],
  stage: RelaxStage
): QueueEntry | null {
  for (const candidate of candidates) {
    if (isMatch(user, candidate, stage)) {
      return candidate;
    }
  }
  return null;
}
