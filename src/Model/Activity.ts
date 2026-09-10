import {
  StatPeriod,
  DataPoint,
  DateList,
  dateListToTime,
  normalizeDateList,
  TagFilter,
  StatValue,
  Stat,
  dateToDateList,
  ActivityType,
  WeekStart,
  dateListToDate,
  BinnableSize,
} from "./StoreTypes";
import { renderLongFormNumber, renderLongFormValue } from "./Unit";
import { NativeModules } from "react-native";

const locale = NativeModules.I18nManager.localeIdentifier;

/**
 * How far ahead a data point may be dated. Planned points are ordinary points, so this
 * limit is only here to keep the calendar and the graphs from having to span decades.
 */
export const FUTURE_HORIZON_DAYS = 365;

/** The last day a data point may be dated to */
export const futureHorizon = (today: Date): Date =>
  new Date(today.getFullYear(), today.getMonth(), today.getDate() + FUTURE_HORIZON_DAYS);

export const dayCmp = (dp: DataPoint, day: DateList) => {
  return cmpDateList(dp.date, day);
};

export const cmpDateList = (d1: DateList, d2: DateList) => {
  return d1[0] - d2[0] || d1[1] - d2[1] || d1[2] - d2[2];
};

export const dateBetween = (d: DateList, lo: DateList, hi: DateList) => {
  return cmpDateList(d, lo) >= 0 && cmpDateList(d, hi) <= 0;
};

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
export type DayInterval = { lo: DateList; hi: DateList };

/** How far an activity's data reaches, for the periods that are relative to it */
export type DataExtent = {
  /** Day of the first data point */
  first: DateList | null;
  /** Day of the last data point, which may be in the future */
  last: DateList | null;
  /** Day of the last data point that is not in the future, so today at the latest */
  lastActive: DateList | null;
};

export const dataExtent = (dataPoints: DataPoint[], today: DateList): DataExtent => {
  if (dataPoints.length === 0) {
    return { first: null, last: null, lastActive: null };
  }
  // Points are kept sorted by day, so the ones up to today are a prefix of the array
  const nUpToToday = findZeroSlice(dataPoints, (dp: DataPoint) => (cmpDateList(dp.date, today) > 0 ? 1 : 0))[1];
  return {
    first: dataPoints[0].date,
    last: dataPoints[dataPoints.length - 1].date,
    lastActive: nUpToToday > 0 ? dataPoints[nUpToToday - 1].date : null,
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
  today: DateList,
  extent: DataExtent,
  weekStart: WeekStart,
): DayInterval | null => {
  switch (period) {
    case "today":
      return { lo: today, hi: today };
    case "this_week": {
      const startDay = weekStart === "sunday" ? 0 : 1;
      const dayOfWeek = (dateListToDate(today).getDay() - startDay + 7) % 7;
      return {
        lo: normalizeDateList([today[0], today[1], today[2] - dayOfWeek]),
        hi: normalizeDateList([today[0], today[1], today[2] - dayOfWeek + 6]),
      };
    }
    case "this_month":
      return { lo: normalizeDateList([today[0], today[1], 1]), hi: normalizeDateList([today[0], today[1] + 1, 0]) };
    case "this_quarter": {
      const thisQuarter = Math.floor((today[1] - 1) / 3);
      return {
        lo: normalizeDateList([today[0], thisQuarter * 3 + 1, 1]),
        hi: normalizeDateList([today[0], thisQuarter * 3 + 4, 0]),
      };
    }
    case "this_year":
      return { lo: normalizeDateList([today[0], 1, 1]), hi: normalizeDateList([today[0] + 1, 1, 0]) };
    case "last_7_days":
      return { lo: normalizeDateList([today[0], today[1], today[2] - 6]), hi: today };
    case "last_30_days":
      return { lo: normalizeDateList([today[0], today[1], today[2] - 29]), hi: today };
    case "last_90_days":
      return { lo: normalizeDateList([today[0], today[1], today[2] - 89]), hi: today };
    case "last_365_days":
      return { lo: normalizeDateList([today[0], today[1], today[2] - 364]), hi: today };
    case "last_active_day":
      return extent.lastActive === null ? null : { lo: extent.lastActive, hi: extent.lastActive };
    case "all_time":
      if (extent.first === null || extent.last === null) {
        return { lo: today, hi: today };
      }
      return { lo: extent.first, hi: cmpDateList(extent.last, today) > 0 ? extent.last : today };
  }
};

/** Days covered by a stat period, which is what "Daily %" divides by */
export const dayIntervalLength = (interval: DayInterval | null): number => {
  if (interval === null) {
    return 1;
  }
  // Rounding absorbs the hour a daylight saving change adds to or takes off the span
  const loTime = dateListToTime(interval.lo);
  const hiTime = dateListToTime(interval.hi);
  return Math.max(1, Math.round((hiTime - loTime) / (1000 * 60 * 60 * 24)) + 1);
};

/**
 * Orders a data point against a period's interval, for `findZeroSlice`: 0 inside it,
 * and the side it falls on otherwise. A null interval matches nothing.
 */
export const statPeriodCmp = (dp: DataPoint, interval: DayInterval | null) => {
  if (interval === null) {
    return -1;
  }
  return dateBetween(dp.date, interval.lo, interval.hi) ? 0 : cmpDateList(dp.date, interval.lo);
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
  const today = dateToDateList(new Date());
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

export const binTime = (binSize: BinnableSize, t0: number, i: number, weekStart: WeekStart): Date => {
  const t0Date = new Date(t0);
  switch (binSize) {
    case "day": {
      return new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() + i, 0);
    }
    case "week": {
      const startDay = weekStart === "sunday" ? 0 : 1;
      const dayOfWeek = (t0Date.getDay() - startDay + 7) % 7;
      return new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() - dayOfWeek + i * 7, 0);
    }
    case "month": {
      return new Date(t0Date.getFullYear(), t0Date.getMonth() + i, 1, 0);
    }
    case "quarter": {
      const month = t0Date.getMonth();
      return new Date(t0Date.getFullYear(), month - (month % 3) + i * 3, 1, 0);
    }
    case "year": {
      return new Date(t0Date.getFullYear() + i, 0, 1, 0);
    }
  }
};

export const binTimeSeries = (
  binSize: BinnableSize,
  dataPoints: { date: DateList; value: number }[],
  weekStart: WeekStart,
): { time: number; nDays: number; values: any[] }[] => {
  if (dataPoints.length === 0) {
    return [];
  }
  const t0 = dateListToTime(dataPoints[0].date);

  const nDays = (binSize: BinnableSize, idx: number) => {
    const tDiff = binTime(binSize, t0, idx + 1, weekStart).getTime() - binTime(binSize, t0, idx, weekStart).getTime();
    return Math.round(tDiff / (1000 * 60 * 60 * 24));
  };

  var bins: { time: number; nDays: number; values: any[] }[] = [
    {
      time: binTime(binSize, t0, 0, weekStart).getTime(),
      nDays: nDays(binSize, 0),
      values: [],
    },
  ];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    while (binTime(binSize, t0, binIx + 1, weekStart).getTime() <= dateListToTime(dp.date)) {
      binIx++;
      bins.push({ time: binTime(binSize, t0, binIx, weekStart).getTime(), nDays: nDays(binSize, binIx), values: [] });
    }
    bins[bins.length - 1].values.push(dp.value);
  }
  // pad till today
  const t1 = new Date().getTime();
  while (binTime(binSize, t0, binIx + 1, weekStart).getTime() <= t1) {
    binIx++;
    bins.push({ time: binTime(binSize, t0, binIx, weekStart).getTime(), nDays: nDays(binSize, binIx), values: [] });
  }

  return bins;
};

export const extractStatValue = (
  filteredValues: [DateList, number][],
  statValue: StatValue,
  /** Days the values were collected over, from `dayIntervalLength` */
  periodDays: number,
): number | null => {
  const periodValues = filteredValues.map((v: any) => v[1]);
  const periodDates = filteredValues.map((v: any) => v[0]);

  let value;
  if (statValue === "n_days") {
    value = new Set(periodDates.map((d: DateList) => d.join("-"))).size;
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

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};
