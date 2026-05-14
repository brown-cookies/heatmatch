"use client";

import { useMemo } from "react";
import { University } from "@heatmatch/types";

// ─── Hardcoded university list (NCR + Region III) ────────────────────────────
// No server fetch needed — update this array to add/remove schools.

const UNIVERSITIES: University[] = [
  // ── NCR ──────────────────────────────────────────────────────────────────
  { name: "University of the Philippines Diliman",     region: "NCR", city: "Quezon City" },
  { name: "Ateneo de Manila University",               region: "NCR", city: "Quezon City" },
  { name: "De La Salle University",                    region: "NCR", city: "Manila" },
  { name: "University of Santo Tomas",                 region: "NCR", city: "Manila" },
  { name: "Far Eastern University",                    region: "NCR", city: "Manila" },
  { name: "Mapúa University",                          region: "NCR", city: "Manila" },
  { name: "Polytechnic University of the Philippines", region: "NCR", city: "Manila" },
  { name: "Technological University of the Philippines", region: "NCR", city: "Manila" },
  { name: "Philippine Normal University",              region: "NCR", city: "Manila" },
  { name: "National University Manila",                region: "NCR", city: "Manila" },
  { name: "Adamson University",                        region: "NCR", city: "Manila" },
  { name: "Lyceum of the Philippines University",      region: "NCR", city: "Manila" },
  { name: "San Beda University",                       region: "NCR", city: "Manila" },
  { name: "Letran College",                            region: "NCR", city: "Manila" },
  { name: "Centro Escolar University",                 region: "NCR", city: "Manila" },

  // ── Region III (Central Luzon) ────────────────────────────────────────────
  { name: "Holy Angel University",                                region: "Region III", city: "Angeles City" },
  { name: "Angeles University Foundation",                        region: "Region III", city: "Angeles City" },
  { name: "Systems Plus College Foundation",                      region: "Region III", city: "Angeles City" },
  { name: "Bulacan State University",                             region: "Region III", city: "Malolos" },
  { name: "Central Luzon State University",                       region: "Region III", city: "Muñoz" },
  { name: "Nueva Ecija University of Science and Technology",     region: "Region III", city: "Cabanatuan" },
  { name: "Don Honorio Ventura State University",                 region: "Region III", city: "Bacolor" },
  { name: "Pampanga State Agricultural University",               region: "Region III", city: "Magalang" },
  { name: "Bataan Peninsula State University",                    region: "Region III", city: "Balanga" },
  { name: "Tarlac State University",                              region: "Region III", city: "Tarlac City" },
  { name: "Tarlac Agricultural University",                       region: "Region III", city: "Camiling" },
  { name: "Gordon College",                                       region: "Region III", city: "Olongapo" },
  { name: "Columban College",                                     region: "Region III", city: "Olongapo" },
];

export function useUniversities() {
  const grouped = useMemo(
    () =>
      UNIVERSITIES.reduce<Record<string, University[]>>((acc, u) => {
        if (!acc[u.region]) acc[u.region] = [];
        acc[u.region].push(u);
        return acc;
      }, {}),
    []
  );

  return { universities: UNIVERSITIES, grouped, loading: false };
}
