import { useEffect, useRef } from "react";

export interface Hotkey {
  keys: string;
  handler: (event: KeyboardEvent) => void;
  /** Allow the shortcut to fire while focus is inside an input/textarea/contenteditable */
  allowInInput?: boolean;
}

function matchesCombo(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.split("+");
  const key = (parts[parts.length - 1] ?? "").toLowerCase();
  const mods = parts.slice(0, -1).map((m) => m.toLowerCase());
  if (event.key.toLowerCase() !== key) return false;
  if (mods.includes("alt") !== event.altKey) return false;
  if (mods.includes("ctrl") !== event.ctrlKey) return false;
  if (mods.includes("meta") !== event.metaKey) return false;
  if (mods.includes("shift") !== event.shiftKey) return false;
  return true;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable
  );
}

export function useHotkeys(hotkeys: Hotkey[], enabled = true): void {
  const hotkeysRef = useRef(hotkeys);

  useEffect(() => {
    hotkeysRef.current = hotkeys;
  }, [hotkeys]);

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const inInput = isEditableTarget(event.target);
      for (const hotkey of hotkeysRef.current) {
        if (!matchesCombo(event, hotkey.keys)) continue;
        if (inInput && !hotkey.allowInInput) continue;
        event.preventDefault();
        hotkey.handler(event);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
