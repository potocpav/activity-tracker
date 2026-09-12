import {
  StatPeriod,
  DataPoint,
  ISODate,
  dayFromISO,
  TagFilter,
  StatValue,
  Stat,
  ActivityType,
  WeekStart,
  BinnableSize,
} from "./StoreTypes";
import * as D from "./Date";
import { renderLongFormNumber, renderLongFormValue } from "./Unit";
import { NativeModules } from "react-native";

const locale = NativeModules.I18nManager.localeIdentifier;

/**
 * How far ahead a data point may be dated. Planned points are ordinary points, so this
 * limit is only here to keep the calendar and the graphs from having to span decades.
 */
export const FUTURE_HORIZON_DAYS = 365;

/** The last day a data point may be dated to */
export const futureHorizon = (today: D.Day): D.Day => D.add(FUTURE_HORIZON_DAYS, today);

/** Orders a data point against a day, for `findZeroSlice` */
export const dayCmp = (dp: DataPoint, day: D.Day) => D.compare(dayFromISO(dp.date), day);

/// This is a gem. Leaving for posterity.
///
// export const uniqueName = (exists: (name: string) => boolean, name: string) : string => {
//   if (!exists(name)) {
//     return name;
//   } else {
//     const nameRoot = name.replace(/ \(copy\s*\d*\)$/, "");
//     let newName = (i: number) => i == 1 ? `${nameRoot} (copy)` : `${nameRoot} (copy ${i})`;
//     let i = 1;
//     while (exists(newName(i))) {
//       i++;
//     }
//     return newName(i);
//   }
// };

/** A closed interval of days: both `lo` and `hi` are part of it */
export type DayInterval = { lo: D.Day; hi: D.Day };

/** The whole of the period of `binSize` that contains `day` */
export const binPeriod = (binSize: BinnableSize, day: D.Day, weekStart: WeekStart): D.Period => {
  switch (binSize) {
    case "day":
      return day;
    case "week":
      return D.week(weekStart, day);
    case "month":
      return D.month(day);
    case "quarter":
      return D.quarter(day);
    case "year":
      return D.year(day);
  }
};

/** First day of the bin `i` bins on from the one holding `origin`; `i` may be negative */
export const binStart = (binSize: BinnableSize, origin: D.Day, i: number, weekStart: WeekStart): D.Day =>
  D.firstDay(D.add(i, binPeriod(binSize, origin, weekStart)));

/** How far an activity's data reaches, for the periods that are relative to it */
export type DataExtent = {
  /** Day of the first data point */
  first: D.Day | null;
  /** Day of the last data point, which may be in the future */
  last: D.Day | null;
  /** Day of the last data point that is not in the future, so today at the latest */
  lastActive: D.Day | null;
};

export const dataExtent = (dataPoints: DataPoint[], today: D.Day): DataExtent => {
  if (dataPoints.length === 0) {
    return { first: null, last: null, lastActive: null };
  }
  // Points are kept sorted by day, so the ones up to today are a prefix of the array
  const nUpToToday = findZeroSlice(dataPoints, (dp: DataPoint) => (dayCmp(dp, today) > 0 ? 1 : 0))[1];
  return {
    first: dayFromISO(dataPoints[0].date),
    last: dayFromISO(dataPoints[dataPoints.length - 1].date),
    lastActive: nUpToToday > 0 ? dayFromISO(dataPoints[nUpToToday - 1].date) : null,
  };
};

/**
 * The interval of days a stat period covers.
 *
 * The `this_*` periods span their whole calendar period, future days included, so a
 * point planned for later this week counts towards "This Week" just like a past one.
 * The `last_*` periods end today and never look ahead. `all_time` runs from the first
 * point to today, or to the last point when that is further ahead.
 *
 * Null when the period has no interval at all, which only happens for
 * `last_active_day` before there is any data.
 */
export const statPeriodInterval = (
  period: StatPeriod,
  today: D.Day,
  extent: DataExtent,
  weekStart: WeekStart,
): DayInterval | null => {
  /** The calendar period around today, from its first day to its last */
  const around = (p: D.Period): DayInterval => ({ lo: D.firstDay(p), hi: D.lastDay(p) });
  /** The `n` days ending today, today included */
  const lastDays = (n: number): DayInterval => ({ lo: D.sub(n - 1, today), hi: today });

  switch (period) {
    case "today":
      return { lo: today, hi: today };
    case "this_week":
      return around(D.week(weekStart, today));
    case "this_month":
      return around(D.month(today));
    case "this_quarter":
      return around(D.quarter(today));
    case "this_year":
      return around(D.year(today));
    case "last_7_days":
      return lastDays(7);
    case "last_30_days":
      return lastDays(30);
    case "last_90_days":
      return lastDays(90);
    case "last_365_days":
      return lastDays(365);
    case "last_active_day":
      return extent.lastActive === null ? null : { lo: extent.lastActive, hi: extent.lastActive };
    case "all_time":
      if (extent.first === null || extent.last === null) {
        return { lo: today, hi: today };
      }
      return { lo: extent.first, hi: D.compare(extent.last, today) > 0 ? extent.last : today };
  }
};

/** Days covered by a stat period, which is what "Daily %" divides by */
export const dayIntervalLength = (interval: DayInterval | null): number => {
  if (interval === null) {
    return 1;
  }
  return Math.max(1, D.daysBetween(interval.lo, interval.hi) + 1);
};

/**
 * Orders a data point against a period's interval, for `findZeroSlice`: 0 inside it,
 * and the side it falls on otherwise. A null interval matches nothing.
 */
export const statPeriodCmp = (dp: DataPoint, interval: DayInterval | null) => {
  if (interval === null) {
    return -1;
  }
  const day = dayFromISO(dp.date);
  return D.compare(day, interval.lo) >= 0 && D.compare(day, interval.hi) <= 0 ? 0 : D.compare(day, interval.lo);
};

export const extractValue = (
  dataPoint: DataPoint,
  tagFiters: TagFilter[],
  subUnitName: string | null,
): number | null => {
  const requiredTags = tagFiters.filter((t) => t.state === "yes");
  const negativeTags = tagFiters.filter((t) => t.state === "no");
  const hasAllRequiredTags = requiredTags.every((t) => (dataPoint.tags ?? []).includes(t.name));
  const hasAnyNegativeTags = negativeTags.some((t) => (dataPoint.tags ?? []).includes(t.name));
  if (hasAllRequiredTags && !hasAnyNegativeTags) {
    const value = subUnitName !== null ? ((dataPoint.value as any)[subUnitName] ?? null) : (dataPoint.value ?? 1);
    return value;
  } else {
    return null;
  }
};

export const calcStatValue = (stat: Stat, activity: ActivityType, weekStart: WeekStart) => {
  const today = D.today();
  const interval = statPeriodInterval(stat.period, today, dataExtent(activity.dataPoints, today), weekStart);
  const periodSlice = findZeroSlice(activity.dataPoints, (dp: DataPoint) => statPeriodCmp(dp, interval));

  const filteredValues: any[] = activity.dataPoints
    .slice(...periodSlice)
    .map((dp: DataPoint) => [dp.date, extractValue(dp, stat.tagFilters, stat.subUnit)])
    .filter((v: any) => v[1] !== null);
  return extractStatValue(filteredValues, stat.value, dayIntervalLength(interval));
};

export const renderStatValue = (stat: Stat, activity: ActivityType, weekStart: WeekStart) => {
  const value = calcStatValue(stat, activity, weekStart);

  if (value === null) {
    return "-";
  } else if (["n_days", "n_points"].includes(stat.value)) {
    return renderLongFormNumber(value);
  } else if (stat.value === "daily_mean") {
    return renderLongFormValue(value, { type: "percentage" });
  } else {
    if (activity.unit.type === "none") {
      return renderLongFormNumber(value);
    } else if (activity.unit.type === "single") {
      return renderLongFormValue(value, activity.unit.unit);
    } else if (activity.unit.type === "multiple") {
      const subUnit = activity.unit.values.find((u) => u.name === stat.subUnit)?.unit;
      if (!subUnit) {
        return renderLongFormNumber(value);
      } else {
        return renderLongFormValue(value, subUnit);
      }
    }
  }
  return "-";
};

// Returns the indices of the slice in data that zero the condition `cmp`
// Data must be sorted in ascending order, such that (x)=>signum(cmp(x)) is monotonic.
export const findZeroSlice = (data: any[], cmp: (x: any) => number): [number, number] => {
  if (data.length === 0) {
    return [0, 0];
  }

  let cmpResultFirst = cmp(data[0]);
  let cmpResultLast = cmp(data[data.length - 1]);
  if (cmpResultFirst > 0) {
    return [0, 0];
  } else if (cmpResultLast < 0) {
    return [data.length, data.length];
  }

  // start is within range

  let startLo = 0;
  let startHi = data.length - 1;

  let endLo = 0;
  let endHi = data.length - 1;

  if (cmpResultFirst === 0) {
    startLo = 0;
    startHi = 0;
  } else {
    // start is not 0, we must binary search for it, while updating bounds for `end`
    while (startLo < startHi) {
      const mid = Math.floor((startLo + startHi) / 2);
      let cmpResult = cmp(data[mid]);
      if (cmpResult < 0) {
        startLo = mid + 1;
        endLo = startLo;
      } else if (cmpResult > 0) {
        startHi = mid;
        endHi = startHi;
      } else {
        startHi = mid;
        endLo = startHi;
      }
    }
  }

  if (cmpResultLast === 0) {
    endLo = data.length;
    endHi = data.length;
  } else {
    // end is not data.length, we must binary search for it
    while (endLo < endHi) {
      const mid = Math.floor((endLo + endHi) / 2);
      let cmpResult = cmp(data[mid]);
      if (cmpResult <= 0) {
        endLo = mid + 1;
      } else {
        endHi = mid;
      }
    }
  }

  return [startLo, endLo];
};

/** One bin of a time series: the days it spans, and the values that fell in it */
export type Bin = { day: D.Day; nDays: number; values: any[] };

export const binTimeSeries = (
  binSize: BinnableSize,
  dataPoints: { date: ISODate; value: number }[],
  weekStart: WeekStart,
): Bin[] => {
  if (dataPoints.length === 0) {
    return [];
  }
  const origin = dayFromISO(dataPoints[0].date);
  const start = (i: number) => binStart(binSize, origin, i, weekStart);
  const bin = (i: number): Bin => ({ day: start(i), nDays: D.daysBetween(start(i), start(i + 1)), values: [] });

  const bins: Bin[] = [bin(0)];
  let binIx = 0;
  for (const dp of dataPoints) {
    const day = dayFromISO(dp.date);
    while (D.compare(start(binIx + 1), day) <= 0) {
      binIx++;
      bins.push(bin(binIx));
    }
    bins[bins.length - 1].values.push(dp.value);
  }
  // pad till today
  const today = D.today();
  while (D.compare(start(binIx + 1), today) <= 0) {
    binIx++;
    bins.push(bin(binIx));
  }

  return bins;
};

export const extractStatValue = (
  filteredValues: [ISODate, number][],
  statValue: StatValue,
  /** Days the values were collected over, from `dayIntervalLength` */
  periodDays: number,
): number | null => {
  const periodValues = filteredValues.map((v: any) => v[1]);
  const periodDates = filteredValues.map((v: any) => v[0]);

  let value;
  if (statValue === "n_days") {
    value = new Set(periodDates).size;
  } else if (statValue === "n_points") {
    value = periodValues.length;
  } else if (statValue === "daily_mean") {
    value = Math.round((periodValues.length / periodDays) * 100);
  } else if (statValue === "sum") {
    value = periodValues.reduce((acc, v) => acc + v, 0);
  } else if (statValue === "mean") {
    value = periodValues.reduce((acc, v) => acc + v, 0) / periodValues.length;
  } else if (statValue === "max") {
    value = Math.max(...periodValues);
  } else if (statValue === "min") {
    value = Math.min(...periodValues);
  } else if (statValue === "last") {
    value = periodValues[periodValues.length - 1];
  }
  return Number.isFinite(value) ? value : null;
};

export const periodToLabel = (period: StatPeriod): string => {
  switch (period) {
    case "today":
      return "Today";
    case "this_week":
      return "This Week";
    case "this_month":
      return "This Month";
    case "this_quarter":
      return "This Quarter";
    case "this_year":
      return "This Year";
    case "last_7_days":
      return "Last 7 Days";
    case "last_30_days":
      return "Last 30 Days";
    case "last_90_days":
      return "Last 90 Days";
    case "last_365_days":
      return "Last 365 Days";
    case "last_active_day":
      return "Last Active Day";
    case "all_time":
      return "All Time";
  }
};

export const valueToLabel = (value: StatValue): string => {
  switch (value) {
    case "n_days":
      return "# Days";
    case "n_points":
      return "Count";
    case "daily_mean":
      return "Daily %";
    case "sum":
      return "Sum";
    case "mean":
      return "Mean";
    case "max":
      return "Max";
    case "min":
      return "Min";
    case "last":
      return "Last";
  }
};

/** A day written out for the user, in their locale. One of the few places a `Date` is still the right tool. */
export const formatDate = (day: D.Day) => {
  return D.toDate(day)!.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};
