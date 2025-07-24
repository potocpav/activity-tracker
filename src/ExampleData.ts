
import { GoalType, Stat, Unit } from "./StoreTypes";

export const defaultStats = (unit: Unit): Stat[] => {
  let subUnit: string | null = null;
  if (typeof unit === "string") {
    subUnit = null;
  } else {
    subUnit = unit[0].name;
  }
  return [
    {
      label: "Count",
      value: "n_points",
      subUnit: subUnit,
      period: "all_time",
      tagFilters: [],
    },
    {
      label: "Days",
      value: "n_days",
      subUnit: subUnit,
      period: "all_time",
      tagFilters: [],
    },
    {
      label: "Last",
      value: "last",
      subUnit: subUnit,
      period: "last_active_day",
      tagFilters: [],
    },
  ];
};



export const defaultGoal: GoalType = {
  name: "",
  description: "",
  unit: "",
  dataPoints: [],
  tags: [],
  color: 19,
  stats: defaultStats(""),
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

const fingerStrengthExample: GoalType = {
  name: "Finger Strength (Example)",
  description: "Finger strength as measured using Tindeq Progressor",
  color: 4,
  stats: defaultStats(fingerStrengthUnit),
  unit: fingerStrengthUnit,
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
      time: new Date("2025-07-11T03:24:00").getTime(),
      value: {
        Mean: 70,
        Max: 75,
        TUT: 1.5,
      },
      tags: ["left"],
    },
    {
      time: new Date("2025-07-12T03:24:00").getTime(),
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

const bodyWeightExample: GoalType = {
  name: "Body Weight (Example)",
  description: "Body weight measured in the morning before breakfast",
  unit: bodyWeightUnit,
  tags: [],
  color: 10,
  stats: defaultStats(bodyWeightUnit),
  dataPoints:
    Array.from({ length: 50 }, (_, i) => ({
      time: new Date("2023-01-01").getTime() +
        Math.random() * (new Date("2025-07-14").getTime() - new Date("2023-01-01").getTime()),
      value: Math.round((70 + Math.random() * 2) * 10) / 10,
      tags: [],
    })).sort((a, b) => a.time - b.time),
}

const bodyWeightExample2: GoalType = {
  name: "Body Weight (Example 2)",
  description: "Body weight measured in the morning before breakfast",
  unit: bodyWeightUnit,
  tags: [],
  color: 0,
  stats: defaultStats(bodyWeightUnit),
  dataPoints: [
    {
      time: new Date("2025-07-08T00:00:00").getTime(),
      value: 81.4,
      tags: [],
    },
    {
      time: new Date("2025-07-09T00:00:00").getTime(),
      value: 79.8,
      tags: [],
    },
    {
      time: new Date("2025-07-10T00:00:00").getTime(),
      value: 80.9,
      tags: [],
    },
    {
      time: new Date("2025-07-11T00:00:00").getTime(),
      value: 80.9,
      tags: [],
    },
    {
      time: new Date("2025-07-12T00:00:00").getTime(),
      value: 79.9,
      tags: [],
    },
    {
      time: new Date("2025-07-13T00:00:00").getTime(),
      value: 79.1,
      tags: [],
    },
    {
      time: new Date("2025-07-14T00:00:00").getTime(),
      value: 80.1,
      tags: [],
    },
  ],
};


export const exampleGoals = [
  bodyWeightExample,
  bodyWeightExample2,
  fingerStrengthExample,
]