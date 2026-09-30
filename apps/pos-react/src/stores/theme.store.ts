import { create } from "zustand";

/**
 * Theme identifiers.
 *
 * - `arcom` is the brand theme (Ruta C) and the application default. It is a
 *   light surface built on sand/paper with the terracotta accent.
 * - `dark` and `light` are the neutral themes kept from before the rebrand.
 *
 * `arcom` is intentionally a separate identifier rather than an alias of
 * `light` so the brand theme can evolve without touching the neutral one, and
 * so `localStorage` values written by older builds keep resolving.
 */
export type Theme = "arcom" | "dark" | "light";

export const THEMES: readonly Theme[] = ["arcom", "dark", "light"] as const;

const STORAGE_KEY = "arcom-theme";
const DEFAULT_THEME: Theme = "arcom";

/**
 * Reads the persisted theme and falls back to the default when the stored
 * value is missing or no longer valid. Older builds only ever wrote
 * `"dark" | "light"`, so those values still resolve, but an unknown value
 * (a typo, a value from a future build) must not leak into the DOM as
 * `data-theme` and leave the app with no token definitions at all.
 */
function readStoredTheme(): Theme {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(stored as Theme) ? (stored as Theme) : DEFAULT_THEME;
}

function persist(theme: Theme): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, theme);
}

interface ThemeState {
  theme: Theme;
  /** Steps to the next theme, wrapping around. Used by the header toggle. */
  cycleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: readStoredTheme(),
  cycleTheme: () =>
    set((s) => {
      const next = THEMES[(THEMES.indexOf(s.theme) + 1) % THEMES.length] as Theme;
      persist(next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    persist(theme);
    set({ theme });
  },
}));
