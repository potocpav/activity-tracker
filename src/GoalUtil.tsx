import { Tag, StatPeriod, DataPoint, DateList, dateListToTime, normalizeDateList, TagFilter } from "./StoreTypes";
import { View, Text, StyleSheet } from "react-native";

export type BinSize = "day" | "week" | "month" | "quarter" | "year";

export const dayCmp = (dp: [DataPoint, number], day: DateList) => {
  return cmpDateList(dp[0].date, day);
}

export const cmpDateList = (d1: DateList, d2: DateList) => {
  return d1[0] - d2[0] || d1[1] - d2[1] || d1[2] - d2[2];
}

export const dateBetween = (d: DateList, lo: DateList, hi: DateList) => {
  return cmpDateList(d, lo) >= 0 && cmpDateList(d, hi) <= 0;
}

export const statPeriodCmp = (
  dp: DataPoint, period: StatPeriod, today: DateList, lastActive: DateList | null) => {
  let lo: DateList | null = null;
  let hi: DateList | null = null;
  if (period === "today") {
    lo = hi = today;
  } else if (period === "this_week") {
    const dayOfWeek = new Date(...today).getDay();
    lo = [today[0], today[1], today[2] - dayOfWeek];
    hi = [today[0], today[1], today[2] - dayOfWeek  + 6];
  } else if (period === "this_month") {
    lo = [today[0], today[1], 1];
    hi = [today[0], today[1] + 1, 0];
  } else if (period === "this_year") {
    lo = [today[0], 0, 1];
    hi = [today[0] + 1, 0, 0];
  } else if (period === "last_7_days") {
    lo = [today[0], today[1], today[2] - 7];
    hi = today;
  } else if (period === "last_30_days") {
    lo = [today[0], today[1], today[2] - 30];
    hi = today;
  } else if (period === "last_365_days") {
    lo = [today[0], today[1], today[2] - 365];
    hi = today;
  } else if (period === "last_active_day") {
    lo = hi = lastActive;
  } else if (period === "all_time") {
    lo = [0, 0, 0];
    hi = [3000, 12, 31];
  }
  if (lo && hi) {
    return dateBetween(dp.date, lo, hi) ? 0 : cmpDateList(dp.date, lo);
  } else {
    // don't match
    return -1;
  }
}

export const extractValue = (dataPoint: DataPoint, tagFiters: TagFilter[], subUnitName: string | null) => {
  const requiredTags = tagFiters.filter((t) => t.state === "yes");
  const negativeTags = tagFiters.filter((t) => t.state === "no");
  const hasAllRequiredTags = requiredTags.every((t) => dataPoint.tags.includes(t.name));
  const hasAnyNegativeTags = negativeTags.some((t) => dataPoint.tags.includes(t.name));
  if (hasAllRequiredTags && !hasAnyNegativeTags) {
    const value = subUnitName ? (dataPoint.value as any)[subUnitName] : dataPoint.value;
    return value;
  } else {
    return null;
  }
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

export const binTime = (binSize: BinSize, t0: number, i: number) => {
  const t0Date = new Date(t0);
  if (binSize === "day") {
    return new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() + i, 0).getTime();

  } else if (binSize === "week") {
    const dayOfWeek = t0Date.getDay();
    return new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() - dayOfWeek + i * 7, 0).getTime();
  } else if (binSize === "month") {
    return new Date(t0Date.getFullYear(), t0Date.getMonth() + i, 1, 0).getTime();
  } else if (binSize === "quarter") {
    const month = t0Date.getMonth()
    return new Date(t0Date.getFullYear(), month - (month % 3) + i * 3, 1, 0).getTime();
  } else if (binSize === "year") {
    return new Date(t0Date.getFullYear() + i, 0, 1, 0).getTime();
  } else {
    throw new Error("Invalid bin size");
  }
};

export const binTimeSeries = (binSize: BinSize, dataPoints: any[]) => {
  if (dataPoints.length === 0) {
    return [];
  }
  const t0 = dateListToTime(dataPoints[0].date);

  var bins: { time: number, values: any[] }[] = [{ time: binTime(binSize, t0, 0), values: [] }];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    var newBin = false;
    while (binTime(binSize, t0, binIx + 1) <= dateListToTime(dp.date)) {
      binIx++;
      newBin = true;
    }
    if (newBin) {
      bins.push({ time: binTime(binSize, t0, binIx), values: [] });
    }
    bins[bins.length - 1].values.push(dp);
  };
  return bins;
};


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