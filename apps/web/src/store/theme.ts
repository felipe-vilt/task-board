import { create } from "zustand";

type Theme = "light" | "dark";

interface ThemeState {
  theme: Theme;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: (localStorage.getItem("theme") as Theme) ?? "light",
  toggle: () =>
    set((s) => {
      const next = s.theme === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      return { theme: next };
    }),
}));
