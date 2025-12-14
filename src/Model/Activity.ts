
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

export const statPeriodCmp = (
  dp: DataPoint, 
  period: StatPeriod, 
  today: DateList, 
  lastActive: DateList | null,
  weekStart: WeekStart
) => {
  let lo: DateList | null = null;
  let hi: DateList | null = null;
  if (period === "today") {
    lo = hi = today;
  } else if (period === "this_week") {
    const startDay = weekStart === "sunday" ? 0 : 1;
    const dayOfWeek = (dateListToDate(today).getDay() - startDay + 7) % 7;
    lo = [today[0], today[1], today[2] - dayOfWeek];
    hi = [today[0], today[1], today[2] - dayOfWeek + 6];
  } else if (period === "this_month") {
    lo = [today[0], today[1], 1];
    hi = [today[0], today[1] + 1, 0];
  } else if (period === "this_quarter") {
    const thisQuarter = Math.floor((today[1] - 1) / 3);
    lo = [today[0], thisQuarter * 3 + 1, 1];
    hi = [today[0], thisQuarter * 3 + 4, 0];
  } else if (period === "this_year") {
    lo = [today[0], 1, 1];
    hi = [today[0] + 1, 1, 0];
  } else if (period === "last_7_days") {
    lo = [today[0], today[1], today[2] - 6];
    hi = today;
  } else if (period === "last_30_days") {
    lo = [today[0], today[1], today[2] - 29];
    hi = today;
  } else if (period === "last_365_days") {
    lo = [today[0], today[1], today[2] - 364];
    hi = today;
  } else if (period === "last_active_day") {
    lo = hi = lastActive;
  } else if (period === "all_time") {
    lo = [0, 0, 0];
    hi = [3000, 12, 31];
  }
  // normalize lo and hi
  if (lo && hi) {
    lo = normalizeDateList(lo);
    hi = normalizeDateList(hi);
    return dateBetween(dp.date, lo, hi) ? 0 : cmpDateList(dp.date, lo);
  } else {
    // don't match
    return -1;
  }
}

export const extractValue = (dataPoint: DataPoint, tagFiters: TagFilter[], subUnitName: string | null) : number | null => {
  const requiredTags = tagFiters.filter((t) => t.state === "yes");
  const negativeTags = tagFiters.filter((t) => t.state === "no");
  const hasAllRequiredTags = requiredTags.every((t) => (dataPoint.tags ?? []).includes(t.name));
  const hasAnyNegativeTags = negativeTags.some((t) => (dataPoint.tags ?? []).includes(t.name));
  if (hasAllRequiredTags && !hasAnyNegativeTags) {
    const value = subUnitName !== null ? (dataPoint.value as any)[subUnitName] ?? null : dataPoint.value ?? 1;
    return value;
  } else {
    return null;
  }
}


export const calcStatValue = (stat: Stat, activity: ActivityType, weekStart: WeekStart) => {
  const today = dateToDateList(new Date());
  const lastActive = activity.dataPoints.length > 0 ?
    activity.dataPoints[activity.dataPoints.length - 1].date :
    null;
  const periodSlice = findZeroSlice(
    activity.dataPoints,
    (dp: DataPoint) => statPeriodCmp(dp, stat.period, today, lastActive, weekStart)
  );

  const filteredValues: any[] = activity.dataPoints
    .slice(...periodSlice)
    .map((dp: DataPoint) => [dp.date, extractValue(dp, stat.tagFilters, stat.subUnit)])
    .filter((v: any) => v[1] !== null);
  return extractStatValue(filteredValues, stat.value, stat.period, weekStart);
}

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
}

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
}

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
      const month = t0Date.getMonth()
      return new Date(t0Date.getFullYear(), month - (month % 3) + i * 3, 1, 0);
    }
    case "year": {
      return new Date(t0Date.getFullYear() + i, 0, 1, 0);
    }
  }
};

export const binTimeSeries = (binSize: BinnableSize, dataPoints: { date: DateList, value: number }[], weekStart: WeekStart) : { time: number, nDays: number, values: any[] }[] => {
  if (dataPoints.length === 0) {
    return [];
  }
  const t0 = dateListToTime(dataPoints[0].date);

  const nDays = (binSize: BinnableSize, idx: number) => {
    const tDiff = binTime(binSize, t0, idx + 1, weekStart).getTime() - binTime(binSize, t0, idx, weekStart).getTime();
    return Math.round(tDiff / (1000 * 60 * 60 * 24));
  };

  var bins: { time: number, nDays: number, values: any[] }[] = [{ 
    time: binTime(binSize, t0, 0, weekStart).getTime(), 
    nDays: nDays(binSize, 0), 
    values: [] 
  }];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    while (binTime(binSize, t0, binIx + 1, weekStart).getTime() <= dateListToTime(dp.date)) {
      binIx++;
      bins.push({ time: binTime(binSize, t0, binIx, weekStart).getTime(), nDays: nDays(binSize, binIx), values: [] });
    }
    bins[bins.length - 1].values.push(dp.value);
  };
  // pad till today
  const t1 = new Date().getTime();
  while (binTime(binSize, t0, binIx + 1, weekStart).getTime() <= t1) {
    binIx++;
    bins.push({ time: binTime(binSize, t0, binIx, weekStart).getTime(), nDays: nDays(binSize, binIx), values: [] });
  }

  return bins;
};

export const statPeriodDays = (period: StatPeriod, weekStart: WeekStart) => {
  const today = new Date();
  switch (period) {
    case "today":
      return 1;
    case "this_week": {
      const startDay = weekStart === "sunday" ? 0 : 1;
      const dayOfWeek = (today.getDay() - startDay + 7) % 7;
      return dayOfWeek + 1;
    }
    case "this_month": {
      return today.getDate();
    }
    case "this_quarter": {
      const startDay = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
      return Math.floor((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
    case "this_year": {
      const startDay = new Date(today.getFullYear(), 0, 1);
      return Math.floor((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }
      return 365;
    case "last_7_days":
      return 7;
    case "last_30_days":
      return 30;
    case "last_90_days":
      return 90;
    case "last_365_days":
      return 365;
    case "last_active_day":
      return 1;
    case "all_time":
      return 365;
  }
}

export const extractStatValue = (filteredValues: [DateList, number][], statValue: StatValue, period: StatPeriod, weekStart: WeekStart) : number | null => {
  const periodValues = filteredValues.map((v: any) => v[1]);
  const periodDates = filteredValues.map((v: any) => v[0]);

  let value;
  if (statValue === "n_days") {
    value = new Set(periodDates.map((d: DateList) => d.join("-"))).size;
  } else if (statValue === "n_points") {
    value = periodValues.length;
  } else if (statValue === "daily_mean") {
    value = Math.round(periodValues.length / statPeriodDays(period, weekStart) * 100);
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
}

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
}

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
}

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};
