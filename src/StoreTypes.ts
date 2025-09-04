// import {
//     Device,
//     Subscription,
//   } from "react-native-ble-plx";


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
    type: "weight",
    unit: "kg" | "lb",
  } |
  {
    type: "time",
    unit: "seconds" | "hours",
  } |
  {
    type: "climbing_grade",
    grade: "uiaa" | "french" | "font" | "v-scale",
  };

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
  "today" | "last_active_day" | "this_week" | "this_month" | "this_year" |
  "last_7_days" | "last_30_days" | "last_365_days" |
  "all_time";

export const allStatPeriods : StatPeriod[] = [
  "today", "last_active_day", "this_week", "this_month", "this_year",
  "last_7_days", "last_30_days", "last_365_days",
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

export type GraphType = "box" | "bar-count" | "bar-daily-mean" | "bar-sum" | "line-mean";

export type BinSize = "day" | "week" | "month" | "quarter" | "year";

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
  name: string;
  description: string;
  unit: Unit;
  dataPoints: DataPoint[];
  tags: Tag[];
  color: number;
  stats: Stat[];
  calendars: CalendarProps[];
  graphs: GraphProps[];
};

export type WeekStart = "sunday" | "monday";

export type State = {
  // allDevices: Device[];
  // isConnected: boolean;
  // connectedDevice: Device | null;
  // subscription: Subscription | null;

  dataPoints: { w: number, t: number }[];

  activities: ActivityType[];
  theme: "system" | "light" | "dark";
  blackBackground: boolean;
  weekStart: WeekStart;
/*
  requestPermissions: any;
  connectToDevice: any;
  disconnectDevice: any;
  scanForPeripherals: any;
  onDataUpdate: any;
  withDevice: any;
  tareScale: any;
  startMeasurement: any;
  stopMeasurement: any;
  shutdown: any;
  sampleBatteryVoltage: any;
  startStreamingData: any;
  updateActivityDataPoint: any;
  */
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