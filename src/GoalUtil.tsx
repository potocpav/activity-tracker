import { Tag } from "./Store";

import { View, Text, StyleSheet } from "react-native";

export type BinSize = "day" | "week" | "month" | "quarter" | "year";

// Returns the indices of the first and last elements in data that zero the condition `cmp`
// Data must be sorted in ascending order, such that cmp is monotonic.
// Returns null if no such element is found.
export const searchInterval = (data: any[], cmp: (x: any) => number) => {
  if (data.length === 0) {
    return null;
  }

  let start = 0;
  let end = data.length - 1;
  let middle = 0;
  
  while (start <= end) {
    middle = Math.floor((start + end) / 2);
    let cmpResult = cmp(data[middle]);
    if (cmpResult < 0) {
      start = middle + 1;
    } else if (cmpResult > 0) {
      end = middle - 1;
    } else {
      break;
    }
  }

  // found one element (`middle`) for which cmp is zero
  // now find the first element for which cmp is zero by linear search

  if (cmp(data[middle]) !== 0) {
    return null;
  }

  start = middle;
  while (true) {
    if (start  == 0) {
      break;
    } else if (cmp(data[start-1]) === 0) {
      start--;
    } else {
      break;
    }
  }
  

  end = middle;
  while (true) {
    if (end == data.length - 1) {
      break;
    } else if (cmp(data[end+1]) === 0) {
      end++;
    } else {
      break;
    }
  }

  return {first: start, last: end};
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

  var bins: {time: number, values: any[]}[] = [{time: binTime(binSize, t0, 0), values: []}];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    var newBin = false;
    while (binTime(binSize, t0, binIx+1) <= dp.time) {
      binIx++;
      newBin = true;
    }
    if (newBin) {
      bins.push({time: binTime(binSize, t0, binIx), values: []});
    }
    bins[bins.length-1].values.push(dp);
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