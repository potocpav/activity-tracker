
import { CalendarProps, ActivityType, GraphProps, Stat, Unit } from "./StoreTypes";

const firstSubUnit = (unit: Unit): string | null => {
  if (unit === null || typeof unit === "string") {
    return null;
  }
  return unit[0].name;
}

export const defaultStats = (unit: Unit): Stat[] => {
  return [
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
    unit === null ? {
      label: "Today",
      value: "n_points",
      subUnit: firstSubUnit(unit),
      period: "today",
      tagFilters: [],
    } : {
      label: "Last",
      value: "last",
      subUnit: firstSubUnit(unit),
      period: "last_active_day",
      tagFilters: [],
    },
  ];
};

export const defaultCalendar = (unit: Unit): CalendarProps => {
  return {
    label: "Calendar",
    value: "n_points",
    subUnit: firstSubUnit(unit),
    tagFilters: [],
  };
};

export const defaultGraph = (unit: Unit): GraphProps => {
  return {
    label: "Graph",
    subUnit: firstSubUnit(unit),
    tagFilters: [],
    graphType: "box",
    binSize: "day",
  };
};

export const defaultActivity : ActivityType = {
  name: "",
  description: "",
  unit: "",
  dataPoints: [],
  tags: [],
  color: 18,
  stats: defaultStats(""),
  calendars: [defaultCalendar("")],
  graphs: [defaultGraph("")],
};

