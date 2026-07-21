import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

let current = new Date();
const listeners = new Set<() => void>();
let interval: ReturnType<typeof setInterval> | null = null;
let appStateSub: { remove: () => void } | null = null;

const refresh = () => {
  const now = new Date();
  if (!isSameDay(current, now)) {
    current = now;
    listeners.forEach((l) => l());
  }
};

const subscribe = (listener: () => void) => {
  if (listeners.size === 0) {
    // First subscriber: sync in case the day rolled over while dormant, then
    // start the single shared timer + foreground listener for all consumers.
    const now = new Date();
    if (!isSameDay(current, now)) current = now;
    interval = setInterval(refresh, 60 * 1000);
    appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
  }
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      appStateSub?.remove();
      appStateSub = null;
    }
  };
};

const getSnapshot = () => current;

/**
 * Current date, refreshed when the local calendar day changes. Polls once a
 * minute (cheap — a re-render only fires when the day actually rolls over) and
 * re-checks immediately when the app returns to the foreground, since JS timers
 * are paused while backgrounded.
 *
 * Backed by a single module-level timer shared across all consumers via
 * useSyncExternalStore, so N calls cost one interval + one AppState listener.
 *
 * Use instead of a bare `new Date()` in render: the React Compiler caches a
 * dependency-free `new Date()` for the component's lifetime, so "today" would
 * otherwise freeze until the component remounts. The returned value is stable
 * within a day, so it won't bust downstream memoization.
 */
export const useToday = (): Date => useSyncExternalStore(subscribe, getSnapshot);
