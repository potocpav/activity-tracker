export type BinSize = "day" | "week" | "month" | "quarter" | "year";

export const binTime = (binSize: BinSize, t0: number, i: number) => {
  const t0Date = new Date(t0);
  if (binSize === "day") {
    // console.log(new Date(t0Date.getFullYear(), t0Date.getMonth(), t0Date.getDate() + i, 0).toLocaleString());
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
