import {
    Device,
    Subscription,
  } from "react-native-ble-plx";
import * as Crypto from "expo-crypto";


export type Unit = 
  { type: "none" } |
  { type: "single", unit: SubUnit } |
  { type: "multiple", values: { name: string, unit: SubUnit }[] };

export type SubUnit = 
  {
    type: "number",
    symbol: string,
  } |
  {
    type: "count",
  } |
  { 
    type: "percentage",
  } |
  {
    type: "distance",
    unit: DistanceUnit,
  } |
  {
    type: "weight",
    unit: WeightUnit,
  } |
  {
    type: "time",
    unit: TimeUnit,
  } |
  {
    type: "climbing_grade",
    grade: ClimbingGrade,
  };

export type SubUnitType = "number" | "count" | "percentage" | "distance" | "weight" | "time" | "climbing_grade";

export type DistanceUnit = "mm" | "cm" | "m" | "km" | "in" | "ft" | "yd" | "mi";

export type WeightUnit = "g" | "kg" | "oz" | "lb";

export type TimeUnit = "seconds" | "hours";

export type ClimbingGrade = "uiaa" | "french" | "yds" | "font" | "v-scale";

export type Tag = {
  name: TagName;
  color: number;
};

export type SetTag = {
  oldTagName: TagName | null;
  name: TagName;
  color: number;
}

export type TagName = string;

// Normalized [year, month, day] numbers
// !! Both month and day are 1-indexed, which is different from the Date object. There, month is 0-indexed
export type DateList = [number, number, number];

export type DataPoint = {
  uuid: string;
  date: DateList;
  value?: number | Record<string, number>;
  note?: string;
  tags?: TagName[];
};

export type StatValue = "n_days" | "n_points" | "daily_mean" | "sum" | "mean" | "max" | "min" | "last";

export const numericStatValues : StatValue[] = [
  "n_days", "n_points", "sum", "mean", "max", "min", "last"
];

export const statValueUnit = (statValue: StatValue, unit: SubUnit) : SubUnit => {
  if (["n_days", "n_points", "daily_mean"].includes(statValue)) {
    return { type: "count" };
  } else {
    return unit;
  }
}

export const unaryStatValues : StatValue[] = [
  "n_days", "n_points", "daily_mean"
]

export type StatPeriod = 
  "today" | "last_active_day" | "this_week" | "this_month" | "this_quarter" | "this_year" |
  "last_7_days" | "last_30_days" | "last_90_days" | "last_365_days" |
  "all_time";

export const allStatPeriods : StatPeriod[] = [
  "today", "last_active_day", "this_week", "this_month", "this_quarter", "this_year",
  "last_7_days", "last_30_days", "last_90_days", "last_365_days",
  "all_time"
];


export type TagFilter = {
  name: string;
  state: "yes" | "no";
};

export type Stat = {
  label: string;
  value: StatValue;
  subUnit: string | null;
  period: StatPeriod;
  tagFilters: TagFilter[];
};

export type CalendarProps = {
  label: string;
  value: StatValue;
  tagFilters: TagFilter[];
  subUnit: string | null;
};

//TODO: remove line-mean, or implement it
export type GraphType = "box" | "bar-count" | "bar-daily-mean" | "bar-sum";

export type BinSize = "point" | "day" | "week" | "month" | "quarter" | "year";

// subset of `BinSize` that can be used for time-based binning
export type BinnableSize = "day" | "week" | "month" | "quarter" | "year";

export const binSizes : BinSize[] = [
  "day", "week", "month", "quarter", "year"
];

export type GraphProps = {
  label: string;
  tagFilters: TagFilter[];
  subUnit: string | null;
  graphType: GraphType;
  binSize: BinSize;
};

export type ActivityType = {
  uuid: string;
  name: string;
  description: string;
  unit: Unit;
  dataPoints: DataPoint[];
  tags: Tag[];
  color: number;
  stats: Stat[];
  calendars: CalendarProps[];
  graphs: GraphProps[];
  special: SpecialActivity | null;
};

export type SpecialActivity = { type: "ble_scale", minWeight: number };

export type WeekStart = "sunday" | "monday";

export type HintType = 
  "hello" | "reorder_activities" | 
  "add_data_point" | "overview_edit_hint" | "rename_calendar" | "calendar_introduction" | "quick_check_daily_activity" |
  "save_data_point"

// hint sequencing. Must contain all hints.
export const hintDependencyChains : HintType[][] = [
  // Activities screen
  ["hello", "reorder_activities"],
  // Activity screen
  ["add_data_point", "calendar_introduction", "overview_edit_hint", "quick_check_daily_activity", "rename_calendar"],
  // Edit activity screen
  // (none)
  // Edit data point screen
  ["save_data_point"],
  // Data list screen
  // (none)
];

export const allHints : HintType[] = [...new Set(hintDependencyChains.flat(Infinity))] as HintType[];

export type ActivityTab = {
  tabName: string;
  activities: ActivityType[];
}

export type ActivityPath = {
  tabId: number;
  activityId: number;
}

export type BleScaleWorkoutState = { state: "playing", t0: number, t0Rest: number, date: DateList };

export type State = {
  // Device related state
  allDevices: Device[];
  connecting: boolean;
  connectedDevice: Device | null;
  subscription: Subscription | null;
  bleScaleWorkoutState: BleScaleWorkoutState | null;

  currentTabId: number;
  activities: ActivityTab[];
  theme: "system" | "light" | "dark";
  blackBackground: boolean;
  weekStart: WeekStart;

  activeHints: HintType[];
  showHints: boolean;

  // Currently unused
  // It used to be needed for BLE scales
  experimentalFeatures: boolean;

  // Bluetooth device related state
  requestPermissions: any;
  connectToDevice: any;
  disconnectDevice: any;
  scanForPeripherals: any;
  withDevice: any;
  tareScale: any;
  startMeasurement: any;
  stopMeasurement: any;
  shutdown: any;
  sampleBatteryVoltage: any;
  startStreamingData: any;
  updateActivityDataPoint: any;
};


export const dateToDateList = (date: Date): DateList => {
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()];
};

export const dateListToDate = (dateList: DateList): Date => {
  return new Date(dateList[0], dateList[1] - 1, dateList[2]);
};

export const normalizeDateList = (dateList: DateList): DateList => {
    return dateToDateList(dateListToDate(dateList));
};

export const timeToDateList = (time: number): DateList => {
    return dateToDateList(new Date(time));
};

export const dateListToTime = (dateList: DateList): number => {
    return dateListToDate(dateList).getTime();
};

export const generateUuids = (state: State) => {
  state.activities.forEach((tab: ActivityTab, tabId: number) => {
    tab.activities.forEach((activity: ActivityType, activityId: number) => {
      state.activities[tabId].activities[activityId].uuid = Crypto.randomUUID();
      activity.dataPoints.forEach((dp: DataPoint, dpId: number) => {
        state.activities[tabId].activities[activityId].dataPoints[dpId].uuid = Crypto.randomUUID();
      });
    });
  });
}

export const stripUuids = (state: any): any => {
  state.activities.forEach((tab: ActivityTab, tabId: number) => {
    tab.activities.forEach((activity: any, activityId: number) => {
      delete state.activities[tabId].activities[activityId].uuid;
      activity.dataPoints.forEach((dp: any, dpId: number) => {
        delete state.activities[tabId].activities[activityId].dataPoints[dpId].uuid;
      });
    });
  });
  return state;
}