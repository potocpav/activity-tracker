export type BinSize = "day" | "week" | "month" | "quarter" | "year";

export const binTime = (binSize: BinSize, t0: Date, i: number) => {
  const offset = t0.getTimezoneOffset();
  if (binSize === "day") {
    return new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i, 0, -offset);
  } else if (binSize === "week") {
    const dayOfWeek = t0.getDay();
    return new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - dayOfWeek + i * 7, 0, -offset);
  } else if (binSize === "month") {
    return new Date(t0.getFullYear(), t0.getMonth() + i, 1, 0, -offset);
  } else if (binSize === "quarter") {
    const month = t0.getMonth()
    return new Date(t0.getFullYear(), month - (month % 3) + i * 3, 1, 0, -offset);
  } else if (binSize === "year") {
    return new Date(t0.getFullYear() + i, 0, 1, 0, -offset);
  } else {
    throw new Error("Invalid bin size");
  }
};

export const binTimeSeries = (binSize: BinSize, dataPoints: any[]) => {
  const t0 = dataPoints[0].time;

  var bins: {time: Date, values: any[]}[] = [{time: binTime(binSize, t0, 0), values: []}];
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
