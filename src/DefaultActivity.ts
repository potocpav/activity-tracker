
import { CalendarProps, ActivityType, GraphProps, Stat, Unit } from "./StoreTypes";

const firstSubUnit = (unit: Unit): string | null => {
  if (unit === null || typeof unit === "string") {
    return null;
  }
  return unit[0].name;
}

const defaultStats = (unit: Unit): Stat[][] => {
  return [[
    {
      label: "Count",
      value: "n_points",
      subUnit: firstSubUnit(unit),
      period: "all_time",
      tagFilters: [],
    },
    {
      label: "Days",
      value: "n_days",
      subUnit: firstSubUnit(unit),
      period: "all_time",
      tagFilters: [],
    },
    {
      label: "Last",
      value: "last",
      subUnit: firstSubUnit(unit),
      period: "last_active_day",
      tagFilters: [],
    },
  ]];
};

export const defaultCalendar = (unit: Unit): CalendarProps => {
  return {
    label: "Count",
    value: "n_points",
    subUnit: firstSubUnit(unit),
    tagFilters: [],
  };
};

export const defaultGraph = (unit: Unit): GraphProps => {
  return {
    label: "",
    subUnit: firstSubUnit(unit),
    tagFilters: [],
    graphType: "box",
    binSize: "day",
  };
};

export const defaultActivity: ActivityType = {
  name: "",
  description: "",
  unit: "",
  dataPoints: [],
  tags: [],
  color: 19,
  stats: defaultStats(""),
  calendar: defaultCalendar(""),
  graph: defaultGraph(""),
};

