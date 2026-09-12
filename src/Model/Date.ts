/**
 * Calendar periods — days, weeks, months, quarters and years — with a single
 * `add` / `sub` / `firstDay` / `lastDay` algebra shared by all of them.
 *
 * Representation: every period is an integer index into the infinite grid of
 * periods of its kind, tagged with the kind. The index is meaningful and stable:
 *
 *   day      days since 1970-01-01
 *   week     weeks since the first week (for that `weekStart`) beginning on or
 *            after 1970-01-01
 *   month    year * 12 + (month - 1)
 *   quarter  year * 4 + (quarter - 1)
 *   year     the year itself
 *
 * Alongside the definite periods, every kind has a far past (`value ===
 * -Infinity`) and a far future (`value === Infinity`). They lie before and after
 * every definite day, have no calendar form, and absorb every operation:
 * shifting one returns it, and its first and last day are itself.
 *
 * Definite periods are unbounded, but only everyday dates are meant to be useful.
 * Calendar fields are converted through `Date`, which keeps days exact out to
 * roughly ±273,000 years and meaningless beyond that. Nothing is clamped.
 *
 * All values are immutable; every operation returns a new object. Calendar
 * arithmetic is done on UTC day numbers so it is unaffected by DST, while
 * `today` / `fromDate` / `toDate` read and write the *local* calendar date.
 */

export type WeekStart = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type Day = { readonly type: "day"; readonly value: number };
export type Week = { readonly type: "week"; readonly weekStart: WeekStart; readonly value: number };
export type Month = { readonly type: "month"; readonly value: number };
export type Quarter = { readonly type: "quarter"; readonly value: number };
export type Year = { readonly type: "year"; readonly value: number };

/** Anything `add`, `sub`, `firstDay` and `lastDay` work on. */
export type Period = Day | Week | Month | Quarter | Year;

/** Calendar fields of a definite day. */
export type DayParts = { readonly year: number; readonly month: number; readonly dayOfMonth: number };

const MS_PER_DAY = 86_400_000;

// 0 = Sunday, matching Date.prototype.getUTCDay.
const WEEKDAY: Record<WeekStart, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const mod = (a: number, b: number): number => ((a % b) + b) % b;

/** Day number of a calendar date. Out-of-range month/day fields normalise (month 13 is January of the next year). */
const dayValueOfCivil = (year: number, month: number, dayOfMonth: number): number => {
  // setUTCFullYear rather than Date.UTC, which folds years 0..99 into 1900..1999.
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, dayOfMonth);
  return Math.round(date.getTime() / MS_PER_DAY);
};

const civilOfDayValue = (value: number): DayParts => {
  const date = new Date(value * MS_PER_DAY);
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, dayOfMonth: date.getUTCDate() };
};

/** Day number of the first day, on or after the epoch, falling on `weekStart`. 1970-01-01 was a Thursday (4). */
const weekAnchor = (weekStart: WeekStart): number => mod(WEEKDAY[weekStart] - 4, 7);

const weekValueOfDay = (value: number, weekStart: WeekStart): number => Math.floor((value - weekAnchor(weekStart)) / 7);
const monthValueOfDay = (value: number): number => {
  const { year, month } = civilOfDayValue(value);
  return year * 12 + (month - 1);
};
const quarterValueOfDay = (value: number): number => {
  const { year, month } = civilOfDayValue(value);
  return year * 4 + Math.floor((month - 1) / 3);
};
const yearValueOfDay = (value: number): number => civilOfDayValue(value).year;

// Both only ever see a definite period; firstDay/lastDay handle the infinities.
const firstDayValue = (period: Period): number => {
  switch (period.type) {
    case "day":
      return period.value;
    case "week":
      return weekAnchor(period.weekStart) + 7 * period.value;
    case "month":
      return dayValueOfCivil(Math.floor(period.value / 12), mod(period.value, 12) + 1, 1);
    case "quarter":
      return dayValueOfCivil(Math.floor(period.value / 4), mod(period.value, 4) * 3 + 1, 1);
    case "year":
      return dayValueOfCivil(period.value, 1, 1);
  }
};

const lastDayValue = (period: Period): number => {
  switch (period.type) {
    case "day":
      return period.value;
    case "week":
      return weekAnchor(period.weekStart) + 7 * period.value + 6;
    case "month":
      // Day zero of the following month, i.e. the last day of this one.
      return dayValueOfCivil(Math.floor(period.value / 12), mod(period.value, 12) + 2, 0);
    case "quarter":
      return dayValueOfCivil(Math.floor(period.value / 4), mod(period.value, 4) * 3 + 4, 0);
    case "year":
      return dayValueOfCivil(period.value, 12, 31);
  }
};

// --- days ------------------------------------------------------------------

/** Day infinitely far in the past; earlier than every other day. */
export const farPast: Day = { type: "day", value: -Infinity };

/** Day infinitely far in the future; later than every other day. */
export const farFuture: Day = { type: "day", value: Infinity };

/** Day from calendar fields (month is 1..12). Out-of-range fields normalise: month 13 is January of the next year. */
export const day = (year: number, month: number, dayOfMonth: number): Day => ({
  type: "day",
  value: dayValueOfCivil(year, month, dayOfMonth),
});

/** The local calendar date of a `Date`, discarding its time of day. */
export const fromDate = (date: Date): Day => day(date.getFullYear(), date.getMonth() + 1, date.getDate());

/** The current local calendar date. */
export const today = (): Day => fromDate(new Date());

/** Parses `YYYY-MM-DD`; `null` if the text is not such a date. */
export const fromISODate = (text: string): Day | null => {
  const match = /^(-?\d{4,})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return null;
  const [year, month, dayOfMonth] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (month < 1 || month > 12 || dayOfMonth < 1 || dayOfMonth > 31) return null;
  const result = day(year, month, dayOfMonth);
  // Reject days that only exist after normalisation, e.g. 2026-02-31.
  const parts = dayParts(result);
  if (parts && (parts.year !== year || parts.month !== month || parts.dayOfMonth !== dayOfMonth)) return null;
  return result;
};

/** True for a real calendar period, false for the far past and the far future. */
export const isDefinite = (period: Period): boolean => Number.isFinite(period.value);

export const isFarPast = (period: Period): boolean => period.value === -Infinity;
export const isFarFuture = (period: Period): boolean => period.value === Infinity;

/** Calendar fields of a day, or `null` for the far past / far future. */
export const dayParts = (value: Day): DayParts | null => (isDefinite(value) ? civilOfDayValue(value.value) : null);

/** Local midnight of a day, or `null` for the far past / far future. */
export const toDate = (value: Day): Date | null => {
  const parts = dayParts(value);
  return parts ? new Date(parts.year, parts.month - 1, parts.dayOfMonth) : null;
};

/** `YYYY-MM-DD`, or `null` for the far past / far future. */
export const toISODate = (value: Day): string | null => {
  const parts = dayParts(value);
  if (!parts) return null;
  const pad = (n: number, width: number) => n.toString().padStart(width, "0");
  return `${pad(parts.year, 4)}-${pad(parts.month, 2)}-${pad(parts.dayOfMonth, 2)}`;
};

/** Which weekday a day falls on, or `null` for the far past / far future. */
export const weekday = (value: Day): WeekStart | null => {
  if (!isDefinite(value)) return null;
  const index = mod(value.value + 4, 7);
  return (Object.keys(WEEKDAY) as WeekStart[]).find((name) => WEEKDAY[name] === index)!;
};

// --- the period algebra ----------------------------------------------------

/**
 * Shifts a period by `n` periods of its own kind: days for a `Day`, weeks for a
 * `Week`, and so on. `n` may be negative, and shifting by ±Infinity lands on the
 * far future or far past. The far past and far future are returned unchanged.
 */
export const add = <P extends Period>(n: number, period: P): P => {
  if (!isDefinite(period)) return period;
  // Spreading a generic widens it back to Period, so the tag has to be re-asserted.
  return { ...period, value: period.value + Math.trunc(n) } as P;
};

/** `add` in the other direction. */
export const sub = <P extends Period>(n: number, period: P): P => add(-n, period);

/** The next period of the same kind. */
export const next = <P extends Period>(period: P): P => add(1, period);

/** The previous period of the same kind. */
export const prev = <P extends Period>(period: P): P => sub(1, period);

/** First day of a period — the period itself when it is a `Day`. */
export const firstDay = (period: Period): Day => ({
  type: "day",
  value: isDefinite(period) ? firstDayValue(period) : period.value,
});

/** Last day of a period — the period itself when it is a `Day`. */
export const lastDay = (period: Period): Day => ({
  type: "day",
  value: isDefinite(period) ? lastDayValue(period) : period.value,
});

// --- the period containing a day -------------------------------------------

/** The week containing a day, given which weekday weeks start on. */
export const week = (weekStart: WeekStart, value: Day): Week => ({
  type: "week",
  weekStart,
  value: isDefinite(value) ? weekValueOfDay(value.value, weekStart) : value.value,
});

/** The month containing a day. */
export const month = (value: Day): Month => ({
  type: "month",
  value: isDefinite(value) ? monthValueOfDay(value.value) : value.value,
});

/** The quarter containing a day. */
export const quarter = (value: Day): Quarter => ({
  type: "quarter",
  value: isDefinite(value) ? quarterValueOfDay(value.value) : value.value,
});

/** The year containing a day. */
export const year = (value: Day): Year => ({
  type: "year",
  value: isDefinite(value) ? yearValueOfDay(value.value) : value.value,
});

// --- comparison ------------------------------------------------------------

/** Chronological ordering of two days: negative, zero or positive. Total, including the far past and far future. */
export const compare = (a: Day, b: Day): number => (a.value < b.value ? -1 : a.value > b.value ? 1 : 0);

/** Two periods are equal when they are the same kind of period covering the same span. */
export const equals = (a: Period, b: Period): boolean => {
  if (a.type !== b.type || a.value !== b.value) return false;
  if (a.type === "week" && b.type === "week") return a.weekStart === b.weekStart;
  return true;
};

/** Whether a day falls within a period, ends included. */
export const contains = (period: Period, value: Day): boolean =>
  compare(firstDay(period), value) <= 0 && compare(value, lastDay(period)) <= 0;
