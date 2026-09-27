import { useSyncExternalStore } from "react";

import { storage } from "./storage";

export type ThemePref = "system" | "light" | "dark";
const KEY = "botdesk.theme";
const listeners = new Set<() => void>();

function systemDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

export function getThemePref(): ThemePref {
  const v = storage.get(KEY);
  return v === "light" || v === "dark" ? v : "system";
}

export function resolvedTheme(pref: ThemePref = getThemePref()): "light" | "dark" {
  return pref === "system" ? (systemDark() ? "dark" : "light") : pref;
}

export function applyTheme(pref: ThemePref = getThemePref()): void {
  const root = document.documentElement;
  root.classList.toggle("dark", resolvedTheme(pref) === "dark");
  root.classList.toggle("light", pref === "light");
}

export function setThemePref(pref: ThemePref): void {
  storage.set(KEY, pref);
  applyTheme(pref);
  listeners.forEach((l) => l());
}

/** Keep `.dark` in sync with the OS while the preference is "system". */
export function watchSystemTheme(): () => void {
  let mq: MediaQueryList;
  try {
    mq = window.matchMedia("(prefers-color-scheme: dark)");
  } catch {
    return () => {};
  }
  const onChange = () => {
    if (getThemePref() === "system") {
      applyTheme("system");
      listeners.forEach((l) => l());
    }
  };
  mq.addEventListener?.("change", onChange);
  return () => mq.removeEventListener?.("change", onChange);
}

export function useThemePref(): ThemePref {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getThemePref,
    () => "system",
  );
}
