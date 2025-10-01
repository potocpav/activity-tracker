
import {
  ActivityType,
  DataPoint,
  GraphProps,
  HintType,
  allHints
} from "./StoreTypes";

export const version = 21;

export const migrate = (persisted: any, version: number) => {
  if (version < 6) {
    persisted.goals.forEach((goal: any) => {
      goal.graph.binSize = "day";
    });
  }
  if (version < 8) {
    persisted.goals.forEach((goal: any) => {
      if (goal.stats.length > 0 && typeof goal.stats[0] === 'object') {
        goal.stats = [goal.stats];
      }
    });
  }
  if (version < 9) {
    persisted.weekStart = "monday";
  }
  if (version < 10) {
    persisted.activities = persisted.goals;
    delete persisted.goals;
  }
  if (version < 11) {
    persisted.activities.forEach((activity: ActivityType) => {
      activity.stats = activity.stats.flat(1);
    });
  }
  if (version < 12) {
    persisted.activities.forEach((activity: ActivityType) => {
      activity.dataPoints = activity.dataPoints.map((dp: DataPoint) => ({
        ...dp,
        date: [dp.date[0], dp.date[1] + 1, dp.date[2]]
      }));
    });
  }
  if (version < 14) {
    persisted.activities.forEach((activity: any) => {
      activity.calendars = [activity.calendar];
      activity.graphs = [activity.graph];
      delete activity.calendar;
      delete activity.graph;
    });
  }
  if (version < 15) {
    persisted.activities.forEach((activity: any) => {
      activity.calendars.forEach((calendar: any) => {
        calendar.label = calendar.label == "Count" ? "Calendar" : calendar.label;
      });
      activity.graphs.forEach((graph: any) => {
        graph.label = graph.label || "Graph";
      });
    });
  }
  if (version < 16) {
    persisted.activities.forEach((activity: any) => {
      if (activity.unit === null) {
        activity.unit = { type: "none" };
      } else if (typeof activity.unit === 'string') {
        activity.unit = { type: "single", unit: { type: "number", symbol: activity.unit } };
      } else if (Array.isArray(activity.unit)) {
        activity.unit = { type: "multiple", values: activity.unit.map((u: any) => ({ name: u.name, unit: { type: "number", symbol: u.symbol } })) };
      } else {
        console.error("Unknown unit type", activity.unit);
      }
    });
  }
  if (version < 17) {
    persisted.activeHints = ["add_data_point"];
  }
  if (version < 18) {
    persisted.showHints = true;
  }
  if (version < 19) {
    persisted.activeHints = allHints;
  }
  if (version < 20) {
    persisted.activeHints = persisted.activeHints.filter((h: HintType | "duplicate_calendar") => h !== "duplicate_calendar");
  }
  if (version < 21) {
    persisted.activities.forEach((activity: ActivityType) => {
      activity.graphs = activity.graphs.map((graph: GraphProps) => ({ ...graph, graphType: graph.graphType as any === "line-mean" ? "box" : graph.graphType }));
    });
  }
  return persisted
};