import { useEffect } from "react";
import { useThemeStore } from "../store/theme";

export function ThemeToggle() {
  const { theme, toggle } = useThemeStore();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      onClick={toggle}
      className="rounded p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      title={theme === "dark" ? "Tema claro" : "Tema escuro"}
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
