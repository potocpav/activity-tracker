
import { CalendarProps, ActivityType, GraphProps, Stat, CompositeUnit, SubUnit2 } from "./StoreTypes";

const firstSubUnitName = (unit: CompositeUnit): string | null => {
  if (unit.type === "none" || unit.type === "single") {
    return null;
  }
  return unit.values[0].name;
}

export const defaultStats = (unit: CompositeUnit): Stat[] => {
  return [
    {
      label: "Count",
      value: "n_points",
      subUnit: firstSubUnitName(unit),
      period: "all_time",
      tagFilters: [],
    },
    {
      label: "Days",
      value: "n_days",
      subUnit: firstSubUnitName(unit),
      period: "all_time",
      tagFilters: [],
    },
    unit === null ? {
      label: "Today",
      value: "n_points",
      subUnit: firstSubUnitName(unit),
      period: "today",
      tagFilters: [],
    } : {
      label: "Last",
      value: "last",
      subUnit: firstSubUnitName(unit),
      period: "last_active_day",
      tagFilters: [],
    },
  ];
};

export const defaultCalendar = (unit: CompositeUnit): CalendarProps => {
  return {
    label: "Calendar",
    value: "n_points",
    subUnit: firstSubUnitName(unit),
    tagFilters: [],
  };
};

export const defaultGraph = (unit: CompositeUnit): GraphProps => {
  return {
    label: "Graph",
    subUnit: firstSubUnitName(unit),
    tagFilters: [],
    graphType: "box",
    binSize: "day",
  };
};

const defaultUnit: CompositeUnit = { type: "single", unit: { type: "number", symbol: "" } };

export const defaultActivity : ActivityType = {
  name: "",
  description: "",
  unit: defaultUnit,
  dataPoints: [],
  tags: [],
  color: 18,
  stats: defaultStats(defaultUnit),
  calendars: [defaultCalendar(defaultUnit)],
  graphs: [defaultGraph(defaultUnit)],
};

