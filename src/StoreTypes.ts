// import {
//     Device,
//     Subscription,
//   } from "react-native-ble-plx";


// No value, single value, or multiple named values
export type Unit = null | string | SubUnit[];

export type CompositeUnit = 
  { type: "none" } |
  { type: "single", unit: SubUnit2 } |
  { type: "multiple", values: { name: string, unit: SubUnit2 }[] };

export type SubUnit2 = 
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
    unit: "seconds" | "minutes" | "hours",
  } |
  {
    type: "climbing_grade",
    grade: "uiaa" | "french" | "font" | "v-scale",
  };

export type SubUnit = {
  name: string;
  symbol: string;
};

export const areUnitsEqual = (unit1: CompositeUnit, unit2: CompositeUnit): boolean => {
  if (unit1.type === "none" && unit2.type === "none") {
    return true;
  } else if (unit1.type === "single" && unit2.type === "single") {
    return areSubUnitsEqual(unit1.unit, unit2.unit);
  } else if (unit1.type === "multiple" && unit2.type === "multiple") {
    return unit1.values.length === unit2.values.length && unit1.values.every((u1, i) => areSubUnitsEqual(u1.unit, unit2.values[i].unit));
  } else {
    return false;
  }
}

export const areSubUnitsEqual = (subUnit1: SubUnit2, subUnit2: SubUnit2): boolean => {
  if (subUnit1.type === subUnit2.type) {
    let subUnit2Copy : any = subUnit2; // we know the constructor is the same as subUnit1 here.
    switch (subUnit1.type) {
      case "number":
        return subUnit1.symbol === subUnit2Copy.symbol;
      case "count":
        return true;
      case "weight":
        return subUnit1.unit === subUnit2Copy.unit;
      case "time":
        return subUnit1.unit === subUnit2Copy.unit;
      case "climbing_grade":
        return subUnit1.grade === subUnit2Copy.grade;
    }
  } else {
    return false;
  }
}

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
  unit: CompositeUnit;
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