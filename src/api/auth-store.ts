import { useSyncExternalStore } from "react";

import { storage } from "@/lib/storage";

/** JWT kept in memory, mirrored to localStorage (storage failures are tolerated). */
const KEY = "botdesk.token";
let token: string | null = storage.get(KEY);
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export const authStore = {
  getToken(): string | null {
    return token;
  },
  setToken(value: string): void {
    token = value;
    storage.set(KEY, value);
    emit();
  },
  clear(): void {
    if (token === null) return;
    token = null;
    storage.remove(KEY);
    emit();
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function useAuthToken(): string | null {
  return useSyncExternalStore(authStore.subscribe, authStore.getToken, () => null);
}
