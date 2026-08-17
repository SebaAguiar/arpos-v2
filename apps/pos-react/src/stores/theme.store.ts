import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("arcom-theme") as Theme) || "dark",
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      localStorage.setItem("arcom-theme", next);
      return { theme: next };
    }),
  setTheme: (theme) => {
    localStorage.setItem("arcom-theme", theme);
    set({ theme });
  },
}));
