import { CalendarProps, GraphProps, Stat, Unit, BinSize } from "./StoreTypes";

const firstSubUnitName = (unit: Unit): string | null => {
  if (unit.type === "none" || unit.type === "single") {
    return null;
  }
  return unit.values[0].name;
}

export const defaultStats = (unit: Unit): Stat[] => {
  if (unit.type === "none") {
    return [
      {
        label: "Count",
        value: "n_points",
        subUnit: null,
        period: "all_time",
        tagFilters: [],
      },
      {
        label: "Last 30 Days",
        value: "daily_mean",
        subUnit: null,
        period: "all_time",
        tagFilters: [],
      },
    ];
  } else {
    return [
      {
        label: "Count",
        value: "n_points",
        subUnit: firstSubUnitName(unit),
        period: "all_time",
        tagFilters: [],
      },
      {
        label: "Mean",
        value: "mean",
        subUnit: firstSubUnitName(unit),
        period: "all_time",
        tagFilters: [],
      },
      {
        label: "Last",
        value: "last",
        subUnit: firstSubUnitName(unit),
        period: "last_active_day",
        tagFilters: [],
      },
    ];
  }
};

export const defaultCalendar = (unit: Unit): CalendarProps => {
  return {
    label: "Calendar",
    value: "mean",
    subUnit: firstSubUnitName(unit),
    tagFilters: [],
  };
};

export const defaultGraph = (unit: Unit, binSize?: BinSize): GraphProps => {
  if (unit.type === "none") {
    return {
      label: "Graph",
      subUnit: null,
      tagFilters: [],
      graphType: "bar-count",
      binSize: binSize || "day",
    };
  } else {
    return {
      label: "Graph",
      subUnit: firstSubUnitName(unit),
      tagFilters: [],
      graphType: "box",
      binSize: binSize || "day",
    };
  }
};


