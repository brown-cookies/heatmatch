"use client";

import { useState, useEffect } from "react";
import { Gender, LookingFor, Vibe } from "@heatmatch/types";

// ─── Shape of what we persist ─────────────────────────────────────────────────

export interface PersistedForm {
  nickname:   string;
  gender:     Gender;
  lookingFor: LookingFor;
  university: string;
  ageMin:     number;
  ageMax:     number;
  vibe:       Vibe;
}

const KEY = "heatchat:form";

const DEFAULTS: PersistedForm = {
  nickname:   "",
  gender:     "male",
  lookingFor: "both",
  university: "any",
  ageMin:     18,
  ageMax:     25,
  vibe:       "friendly",
};

// ─── Read from sessionStorage safely ─────────────────────────────────────────
// sessionStorage is not available during SSR, so we guard with typeof window.
// If the stored value is malformed we fall back to defaults silently.

function load(): PersistedForm {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

// ─── Write to sessionStorage ──────────────────────────────────────────────────

function save(form: PersistedForm) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(form));
  } catch {
    // Storage quota exceeded or private browsing restrictions — fail silently.
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// Returns the persisted form state and a setter that also writes to storage.
// Data lives for the browser session — cleared automatically when the tab closes.

export function useFormPersist() {
  const [form, setFormState] = useState<PersistedForm>(DEFAULTS);

  // Load from sessionStorage once on mount (client-side only)
  useEffect(() => {
    setFormState(load());
  }, []);

  // Wrap setState so every update is also persisted
  function setForm(patch: Partial<PersistedForm>) {
    setFormState((prev) => {
      const next = { ...prev, ...patch };
      save(next);
      return next;
    });
  }

  return { form, setForm };
}
