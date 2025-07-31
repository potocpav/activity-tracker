
import { CalendarProps, dateListToTime, ActivityType, GraphProps, Stat, timeToDateList, Unit } from "./StoreTypes";

const firstSubUnit = (unit: Unit): string | null => {
  if (unit === null || typeof unit === "string") {
    return null;
  }
  return unit[0].name;
}

export const defaultStats = (unit: Unit): Stat[][] => {
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


const fingerStrengthUnit: Unit = [
  {
    name: "Mean",
    symbol: "kg",
  },
  {
    name: "Max",
    symbol: "kg",
  },
  {
    name: "TUT",
    symbol: "s",
  },
];

const fingerStrengthExample: ActivityType = {
  name: "Finger Strength (Example)",
  description: "Finger strength as measured using Tindeq Progressor",
  color: 4,
  unit: fingerStrengthUnit,
  stats: defaultStats(fingerStrengthUnit),
  calendar: defaultCalendar(fingerStrengthUnit),
  graph: defaultGraph(fingerStrengthUnit),
  tags: [
    {
      name: "left",
      color: 10,
    },
    {
      name: "right",
      color: 11,
    },
    {
      name: "warmup",
      color: 12,
    },
  ],
  dataPoints: [
    {
      date: [2025, 7, 11],
      value: {
        Mean: 70,
        Max: 75,
        TUT: 1.5,
      },
      tags: ["left"],
    },
    {
      date: [2025, 7, 12],
      value: {
        Mean: 65,
        Max: null,
        TUT: 1.0,
      },
      tags: ["right", "warmup"],
    },

  ],
};

const bodyWeightUnit: Unit = "kg";

const bodyWeightExample: ActivityType = {
  name: "Body Weight (Example)",
  description: "Body weight measured in the morning before breakfast",
  unit: bodyWeightUnit,
  tags: [],
  color: 10,
  stats: defaultStats(bodyWeightUnit),
  calendar: defaultCalendar(bodyWeightUnit),
  graph: defaultGraph(bodyWeightUnit),
  dataPoints:
    Array.from({ length: 50 }, (_, i) => ({
      date: timeToDateList(
        new Date("2023-01-01").getTime() +
        Math.random() * (new Date("2025-07-14").getTime() - 
        new Date("2023-01-01").getTime())),
      value: Math.round((70 + Math.random() * 2) * 10) / 10,
      tags: [],
    })).sort((a, b) => dateListToTime(a.date) - dateListToTime(b.date)),
}

const bodyWeightExample2: ActivityType = {
  name: "Body Weight (Example 2)",
  description: "Body weight measured in the morning before breakfast",
  unit: bodyWeightUnit,
  tags: [],
  color: 0,
  stats: defaultStats(bodyWeightUnit),
  calendar: defaultCalendar(bodyWeightUnit),
  graph: defaultGraph(bodyWeightUnit),
  dataPoints: [
    {
      date: [2025, 7, 8],
      value: 81.4,
    },
    {
      date: [2025, 7, 9],
      value: 79.8,
    },
    {
      date: [2025, 7, 10],
      value: 80.9,
    },
    {
      date: [2025, 7, 11],
      value: 80.9,
    },
    {
      date: [2025, 7, 12],
      value: 79.9,
    },
    {
      date: [2025, 7, 13],
      value: 79.1,
    },
    {
      date: [2025, 7, 14],
      value: 80.1,
    },
  ],
};


export const exampleActivities = [
  bodyWeightExample,
  bodyWeightExample2,
  fingerStrengthExample,
]