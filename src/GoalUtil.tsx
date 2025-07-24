import { Tag, StatPeriod, DataPoint } from "./StoreTypes";
import { View, Text, StyleSheet } from "react-native";

export type BinSize = "day" | "week" | "month" | "quarter" | "year";

export const dayCmp = (dp: [DataPoint, number], day: Date) => {
  const dpDate = new Date(dp[0].time);
  if (dpDate.getFullYear() == day.getFullYear() && dpDate.getMonth() == day.getMonth() && dpDate.getDate() == day.getDate()) {
    return 0;
  } else {
    return dpDate.getTime() - day.getTime();
  }
}

// export type StatPeriod = 
//   "today" | "this_week" | "this_month" | "this_year" |
//   "last_24_hours" | "last_7_days" | "last_30_days" | "last_365_days" |
//   "last_active_day" |
//   "all_time";

// export const statPeriodCmp = (dp: any, period: StatPeriod) => {
//   const dpDate = new Date(dp[0].time);
//   const now = new Date();
//   const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
// }

// Returns the indices of the slice in data that zero the condition `cmp`
// Data must be sorted in ascending order, such that cmp is monotonic.
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
  const t0 = dataPoints[0].time;

  var bins: { time: number, values: any[] }[] = [{ time: binTime(binSize, t0, 0), values: [] }];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    var newBin = false;
    while (binTime(binSize, t0, binIx + 1) <= dp.time) {
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