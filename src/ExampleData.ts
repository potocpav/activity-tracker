

export const exampleGoals = [
  {
    name: "Body Weight (Example)",
    description: "Body weight measured in the morning before breakfast",
    unit: "kg",
    tags: [],
    color: 10,
    dataPoints:
      Array.from({ length: 50 }, (_, i) => ({
        time: new Date("2023-01-01").getTime() +
          Math.random() * (new Date("2025-07-14").getTime() - new Date("2023-01-01").getTime()),
        value: Math.round((70 + Math.random() * 2) * 10) / 10,
        tags: [],
      })).sort((a, b) => a.time - b.time),
  },
  {
    name: "Body Weight",
    description: "Body weight measured in the morning before breakfast",
    unit: "kg",
    tags: [],
    color: 0,
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
  },
  {
    name: "Finger Strength (Example)",
    description: "Finger strength as measured using Tindeq Progressor",
    color: 4,
    unit: [
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
    ],
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
  }
]