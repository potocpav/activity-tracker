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
 * Definite periods are unbounded and nothing is clamped. Day numbers convert to
 * and from calendar fields by exact integer arithmetic, so every day number that
 * fits in a safe integer is exact; only `toDate` / `fromDate` touch `Date`, and
 * inherit its narrower ±273,000-year limit.
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

// Howard Hinnant's civil-calendar algorithms (howardhinnant.github.io/date_algorithms.html).
// They count in a calendar shifted to begin in March, which puts the leap day last and
// makes every 400-year era exactly 146,097 days, so no table or branching on leap years
// is needed — just integer arithmetic, exact wherever doubles hold integers exactly.

const DAYS_PER_ERA = 146_097; // 400 years
const ERA_OFFSET = 719_468; // days from 0000-03-01, the shifted calendar's origin, to 1970-01-01

/** Day number of a calendar date. Out-of-range fields normalise: month 13 is January of the next year, day 0 the last day of the previous month. */
const dayValueOfCivil = (year: number, month: number, dayOfMonth: number): number => {
  // Fold the month into 1..12 first: the closed form tolerates only a month or two of
  // overshoot, while callers rely on arbitrary month numbers normalising. The day of
  // the month needs no such care — it enters the sum linearly, so any value works.
  const months = year * 12 + (month - 1);
  const civilYear = Math.floor(months / 12);
  const civilMonth = months - civilYear * 12 + 1; // [1, 12]

  const shiftedYear = civilYear - (civilMonth <= 2 ? 1 : 0); // January and February end the previous year
  const era = Math.floor(shiftedYear / 400);
  const yearOfEra = shiftedYear - era * 400; // [0, 399]
  const dayOfYear = Math.floor((153 * (civilMonth + (civilMonth > 2 ? -3 : 9)) + 2) / 5) + dayOfMonth - 1;
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * DAYS_PER_ERA + dayOfEra - ERA_OFFSET;
};

const civilOfDayValue = (value: number): DayParts => {
  const shifted = value + ERA_OFFSET;
  const era = Math.floor(shifted / DAYS_PER_ERA);
  const dayOfEra = shifted - era * DAYS_PER_ERA; // [0, 146096]
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36524) - Math.floor(dayOfEra / 146096)) / 365,
  ); // [0, 399]
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100)); // [0, 365]
  const shiftedMonth = Math.floor((5 * dayOfYear + 2) / 153); // [0, 11], counting from March
  const dayOfMonth = dayOfYear - Math.floor((153 * shiftedMonth + 2) / 5) + 1; // [1, 31]
  const month = shiftedMonth + (shiftedMonth < 10 ? 3 : -9); // [1, 12]
  return { year: era * 400 + yearOfEra + (month <= 2 ? 1 : 0), month, dayOfMonth };
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

/** Local midnight of a day, or `null` for the far past / far future. Days beyond what `Date` can hold give an invalid `Date`. */
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

/**
 * Days from `from` to `to`: positive when `to` is the later one, zero for the same day.
 * ±Infinity when one end is the far past or far future, and NaN when both are the same
 * one, since the distance between two infinities is not a number of days.
 */
export const daysBetween = (from: Day, to: Day): number => to.value - from.value;

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
