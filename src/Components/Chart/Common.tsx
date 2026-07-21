import { SubUnit } from "../../Model/StoreTypes";

export type BoundingBox = {
  min: number; // domain units
  max: number; // domain units
  padMin: number; // px units
  padMax: number; // px units
} | null;

export const boundingBoxToRange = (viewportHeight: number, box: BoundingBox): { min: number; max: number } => {
  if (box === null) {
    return { min: 0, max: 1 };
  } else {
    let vh = viewportHeight - box.padMin - box.padMax;
    let pxSize = (box.max - box.min) / vh;
    const lim1 = box.min - box.padMin * pxSize;
    const lim2 = box.max + box.padMax * pxSize;
    const min = Math.min(lim1, lim2);
    const max = Math.max(lim1, lim2);
    if (min == max) {
      return { min: min - 0.5, max: max + 0.5 };
    } else {
      return { min: min, max: max };
    }
  }
};

export const cmpMajorTicks = (unit: SubUnit, range: { min: number; max: number }, approxNTicks: number): number[] => {
  "worklet";
  const idealStride = (range.max - range.min) / approxNTicks;

  const defaultStride = (targetStride: number) => {
    const logBase = Math.pow(10, 1 / 3);
    const logStride = Math.round(Math.log(targetStride) / Math.log(logBase));
    let fractionalStride = 0;
    switch (((Math.round(logStride) % 3) + 3) % 3) {
      case 0:
        fractionalStride = 1;
        break;
      case 1:
        fractionalStride = 2;
        break;
      case 2:
        fractionalStride = 5;
        break;
    }
    const stride = Math.pow(10, Math.floor(logStride / 3)) * fractionalStride;
    return stride;
  };

  const enumeratedStride = (targetStride: number, strideList: number[]) => {
    let [min, minStride] = [Infinity, Infinity];
    for (const stride of strideList) {
      const diff = Math.abs(Math.log(stride) - Math.log(targetStride));
      if (diff < min) {
        min = diff;
        minStride = stride;
      }
    }
    return minStride;
  };

  const stridedTicks = (stride: number) => {
    let ticks = [];
    for (let i = Math.ceil(range.min / stride); i <= Math.floor(range.max / stride); i++) {
      ticks.push(i * stride);
    }
    return ticks;
  };

  let stride = defaultStride(idealStride);

  switch (unit.type) {
    case "count":
      stride = defaultStride(Math.max(1, idealStride));
      break;
    case "number":
    case "distance":
    case "weight":
      stride = defaultStride(idealStride);
      break;
    case "time":
      switch (unit.unit) {
        case "hours":
          if (idealStride < 24) {
            stride = enumeratedStride(idealStride, [
              1 / 3600,
              2 / 3600,
              5 / 3600,
              10 / 3600,
              30 / 3600,
              1 / 60,
              2 / 60,
              5 / 60,
              10 / 60,
              15 / 60,
              30 / 60,
              1,
              2,
              6,
              12,
              24,
            ]);
          }
          break;
        case "seconds":
          if (idealStride >= 1 && idealStride < 3600 * 24) {
            stride = enumeratedStride(idealStride, [
              2,
              5,
              10,
              30,
              1 * 60,
              2 * 60,
              5 * 60,
              10 * 60,
              15 * 60,
              30 * 60,
              1 * 3600,
              2 * 3600,
              6 * 3600,
              12 * 3600,
              24 * 3600,
            ]);
          }
          break;
      }
      break;
    case "climbing_grade":
      switch (unit.grade) {
        case "french":
          if (idealStride < 10) {
            stride = enumeratedStride(idealStride, [1 / 6, 1 / 3, 1, 2, 5]);
          }
          break;
        case "uiaa":
          if (idealStride < 10) {
            stride = enumeratedStride(idealStride, [1 / 6, 1 / 3, 1, 2, 5]);
          }
          break;
        case "yds":
          if (idealStride < 10) {
            stride = enumeratedStride(idealStride, [1 / 4, 1, 2, 5]);
          }
          break;
        case "font":
          if (idealStride < 10) {
            stride = enumeratedStride(idealStride, [1 / 6, 1 / 3, 1, 2, 5]);
          }
          break;
        case "v-scale":
          if (idealStride < 10) {
            stride = enumeratedStride(idealStride, [1 / 2, 1, 2, 5]);
          }
          break;
      }
      break;
  }
  return stridedTicks(stride);
};
