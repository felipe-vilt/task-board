import { useEffect } from "react";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  handler: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      for (const s of shortcuts) {
        if (e.key.toLowerCase() === s.key && (!s.ctrl || e.ctrlKey || e.metaKey)) {
          const target = e.target as HTMLElement;
          if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") continue;
          e.preventDefault();
          s.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
}
