
import { StackedArea } from "victory-native";
import { Tag, StatPeriod, DataPoint, DateList, dateListToTime, normalizeDateList, TagFilter, StatValue, Stat, dateToDateList, ActivityType, WeekStart, Unit } from "./StoreTypes";
import { View, Text, StyleSheet } from "react-native";

export type BinSize = "day" | "week" | "month" | "quarter" | "year";

export const dayCmp = (dp: DataPoint, day: DateList) => {
  return cmpDateList(dp.date, day);
}

export const cmpDateList = (d1: DateList, d2: DateList) => {
  return d1[0] - d2[0] || d1[1] - d2[1] || d1[2] - d2[2];
}

export const dateBetween = (d: DateList, lo: DateList, hi: DateList) => {
  return cmpDateList(d, lo) >= 0 && cmpDateList(d, hi) <= 0;
}

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
    const dayOfWeek = new Date(...today).getDay();
    const firstDayOfWeek = weekStart === "sunday" ? 0 : 1;
    lo = [today[0], today[1], today[2] - dayOfWeek + firstDayOfWeek];
    hi = [today[0], today[1], today[2] - dayOfWeek + firstDayOfWeek + 6];
  } else if (period === "this_month") {
    lo = [today[0], today[1], 1];
    hi = [today[0], today[1] + 1, 0];
  } else if (period === "this_year") {
    lo = [today[0], 0, 1];
    hi = [today[0] + 1, 0, 0];
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

export const getUnitSymbol = (stat: Stat, unit: Unit) => {
  let symbol = "";
  if (["n_days", "n_points"].includes(stat.value)) {
    symbol = "";
  } else if (stat.value === "daily_mean") {
    symbol = "%";
  } else if (unit === null) {
    symbol = "";
  } else if (typeof unit === "string") {
    symbol = unit;
  } else {
    symbol = unit.find((u) => u.name === stat.subUnit)?.symbol ?? "";
  }
  return symbol;
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

export const formatNumber = (value: number) => {
  return Math.round(value * 10) / 10;
}

export const binTime = (binSize: BinSize, t0: number, i: number, weekStart: WeekStart) => {
  const t0Date = new Date(t0);
  if (binSize === "day") {
    return new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() + i, 0).getTime();

  } else if (binSize === "week") {
    const dayOfWeek = t0Date.getDay();
    const startDay = weekStart === "sunday" ? 0 : 1;
    return new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() - dayOfWeek + startDay + i * 7, 0).getTime();
  } else if (binSize === "month") {
    return new Date(t0Date.getFullYear(), t0Date.getMonth() + i, 1, 0).getTime();
  } else if (binSize === "quarter") {
    const month = t0Date.getMonth()
    return new Date(t0Date.getFullYear(), month - (month % 3) + i * 3, 1, 0).getTime();
  } else if (binSize === "year") {
    return new Date(t0Date.getFullYear() + i, 0, 1, 0).getTime();
  } else {
    console.log("Invalid bin size: " + binSize);
    throw new Error("Invalid bin size: " + binSize);
  }
};

export const binTimeSeries = (binSize: BinSize, dataPoints: any[], weekStart: WeekStart) => {
  if (dataPoints.length === 0) {
    return [];
  }
  const t0 = dateListToTime(dataPoints[0].date);

  const nDays = (binSize: BinSize, idx: number) => {
    const tDiff = binTime(binSize, t0, idx + 1, weekStart) - binTime(binSize, t0, idx, weekStart);
    return Math.round(tDiff / (1000 * 60 * 60 * 24));
  };

  var bins: { time: number, nDays: number, values: any[] }[] = [{ time: binTime(binSize, t0, 0, weekStart), nDays: nDays(binSize, 0), values: [] }];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    var newBin = false;
    while (binTime(binSize, t0, binIx + 1, weekStart) <= dateListToTime(dp.date)) {
      binIx++;
      newBin = true;
    }
    if (newBin) {
      bins.push({ time: binTime(binSize, t0, binIx, weekStart), nDays: nDays(binSize, binIx), values: [] });
    }
    bins[bins.length - 1].values.push(dp);
  };
  return bins;
};

export const statPeriodDays = (period: StatPeriod, weekStart: WeekStart) => {
  const today = new Date();
  switch (period) {
    case "today":
      return 1;
    case "this_week":
      const startDay = weekStart === "sunday" ? 0 : 1;
      return (today.getDay() - startDay + 8) % 7;
    case "this_month":
      return today.getDate();
    case "this_year":
      return 365;
    case "last_7_days":
      return 7;
    case "last_30_days":
      return 30;
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


export const renderTags = (tags: Tag[], theme: any, palette: string[]) => {
  if (tags.length === 0) return null;

  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => (
        <View key={index} style={[styles.tag, { backgroundColor: palette[tag.color], borderColor: theme.colors.surface }]}>
          <Text style={[styles.tagText, { color: theme.colors.surface }]}>{tag.name}</Text>
        </View>
      ))}
    </View>
  );
};

export const periodToLabel = (period: StatPeriod): string => {
  switch (period) {
    case "today":
      return "Today";
    case "this_week":
      return "This Week";
    case "this_month":
      return "This Month";
    case "this_year":
      return "This Year";
    case "last_7_days":
      return "Last 7 Days";
    case "last_30_days":
      return "Last 30 Days";
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
      return "# Points";
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

const styles = StyleSheet.create({
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});