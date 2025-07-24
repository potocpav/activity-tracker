import {
    Device,
    Subscription,
  } from "react-native-ble-plx";


export type Unit = string | SubUnit[];

export type SubUnit = {
  name: string;
  symbol: string;
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
export type DateList = [number, number, number];

export type DataPoint = {
  date: DateList;
  value: number | object;
  note?: string;
  tags: TagName[];
};

export type StatValue = "n_days" | "n_points" | "sum" | "mean" | "max" | "min" | "last";

export const allStatValues : StatValue[] = [
  "n_days", "n_points", "sum", "mean", "max", "min", "last"
];

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

export type GoalType = {
  name: string;
  description: string;
  unit: Unit;
  dataPoints: DataPoint[];
  tags: Tag[];
  color: number;
  stats: Stat[];
};

export type State = {
  allDevices: Device[];
  isConnected: boolean;
  connectedDevice: Device | null;
  subscription: Subscription | null;

  dataPoints: { w: number, t: number }[];

  goals: GoalType[];
  theme: "light" | "dark";
  blackBackground: boolean;

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
  updateGoalDataPoint: any;
};


export const dateToDateList = (date: Date): DateList => {
    return [date.getFullYear(), date.getMonth(), date.getDate()];
};

export const normalizeDateList = (dateList: DateList): DateList => {
    return dateToDateList(new Date(...dateList));
};

// TODO: move to a util file
export const timeToDateList = (time: number): DateList => {
    const date = new Date(time);
    return [date.getFullYear(), date.getMonth(), date.getDate()];
};

export const dateListToTime = (dateList: DateList): number => {
    return new Date(...dateList).getTime();
};