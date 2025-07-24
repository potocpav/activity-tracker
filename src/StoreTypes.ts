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

export type DataPoint = {
  time: number;
  value: number | object;
  note?: string;
  tags: TagName[];
};

export type StatValue = "n_days" | "n_points" | "sum" | "mean" | "max" | "min" | "last";

export type StatPeriod = 
  "today" | "this_week" | "this_month" | "this_year" |
  "last_24_hours" | "last_7_days" | "last_30_days" | "last_365_days" |
  "last_active_day" |
  "all_time";

export type TagFilter = {
  name: string;
  state: "yes" | "no" | "maybe";
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