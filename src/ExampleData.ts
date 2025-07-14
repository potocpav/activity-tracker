

export const exampleGoals = [
    {
      id: "body-weight",
      name: "Body Weight (Example)",
      description: "Body weight measured in the morning before breakfast",
      unit: "kg",
      dataPoints: 
        Array.from({ length: 200 }, (_, i) => ({
            time: new Date("2023-01-01").getTime() + 
              Math.random() * (new Date("2025-07-14").getTime() - new Date("2023-01-01").getTime()),
            value: 70 + Math.random() * 2,
            tags: [],
        })).sort((a, b) => a.time - b.time),
    },
    {
      id: "finger-strength",
      name: "Finger Strength (Example)",
      description: "Finger strength as measured using Tindeq Progressor",
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