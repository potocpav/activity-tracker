import { useState, useEffect } from 'react';
import { AppState } from 'react-native';

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/**
 * Current date, refreshed when the local calendar day changes. Polls once a
 * minute (cheap — a re-render only fires when the day actually rolls over) and
 * re-checks immediately when the app returns to the foreground, since JS timers
 * are paused while backgrounded.
 *
 * Use instead of a bare `new Date()` in render: the React Compiler caches a
 * dependency-free `new Date()` for the component's lifetime, so "today" would
 * otherwise freeze until the component remounts. The returned value is stable
 * within a day, so it won't bust downstream memoization.
 */
export const useToday = (): Date => {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setToday((prev) => (isSameDay(prev, new Date()) ? prev : new Date()));

    const interval = setInterval(refresh, 60 * 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });

    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return today;
};
