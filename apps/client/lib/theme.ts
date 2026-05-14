export type Theme = "dark" | "light";

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("heatmatch-theme") as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  // Fall back to system preference
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  localStorage.setItem("heatmatch-theme", theme);
}

export function toggleTheme(): Theme {
  const current = document.documentElement.classList.contains("light") ? "light" : "dark";
  const next: Theme = current === "dark" ? "light" : "dark";
  applyTheme(next);
  return next;
}
