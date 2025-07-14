/* eslint-disable no-bitwise */
import { create } from "zustand";
import { 
  requestPermissions, 
  connectToDevice, 
  disconnectDevice, 
  scanForPeripherals,
  extractData, 
  tareScale, 
  shutdown, 
  stopMeasurement as stopMeasurementCommand, 
  sampleBatteryVoltage, 
  startStreamingData,
  startMeasurement as startMeasurementCommand
} from "./Ble";

import {
  BleError,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import { exampleGoals } from "./ExampleData";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Unit = string | SubUnit[];

export type SubUnit = {
    name: string;
    symbol: string;
};

export type Tag = string;

export type DataPoint = {
    time: number;
    value: any;
    tags: Tag[];
};

export type GoalType = {
  id: string;
  name: string;
  description: string;
  unit: Unit;
  dataPoints: DataPoint[];
};

export type State = {
  allDevices: Device[];
  isConnected: boolean;
  connectedDevice: Device | null;
  subscription: Subscription | null;

  dataPoints: {w: number, t: number}[];

  goals: GoalType[];

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

const useStore = create<State>()(
  persist(
  (set, get) => ({
      // Bluetooth device related state
      allDevices: [],
      isConnected: false,
      connectedDevice: null,
      subscription: null,
      
      // Measurement related state
      dataPoints: [],

      // Goals related state
      goals: exampleGoals,

      requestPermissions: requestPermissions,

      connectToDevice: async (device: Device) => {
        try {
            const deviceConnection = await connectToDevice(device);
            set({connectedDevice: deviceConnection, isConnected: true});
            deviceConnection.onDisconnected(async () => {
                console.log("Device is disconnected asynchronously.");
                set({isConnected: false});
            });
        } catch (e) {
            console.log("FAILED TO CONNECT", e);
        }
      },

      disconnectDevice: async () => {
        const connectedDevice: any = get().connectedDevice;
        if (connectedDevice) {
            await disconnectDevice(connectedDevice);
            set({isConnected: false});
        }
      },

      scanForPeripherals: () => {
        scanForPeripherals((device) => {
          const isDuplicteDevice = (devices: Device[], nextDevice: Device) => {
              return devices.findIndex((device) => nextDevice.id === device.id) > -1;
            };
          set((state: any) => {
              if (!isDuplicteDevice(state.allDevices, device)) {
                  return {allDevices: [...state.allDevices, device]};
              } else {
                  return {};
              }
          });
        });
      },
    
      onDataUpdate: (
        error: BleError | null,
        characteristic: Characteristic | null
      ) => {
        const data = extractData(error, characteristic);
        if (data) {
          set((state: any) => {
            const newDataPoints = [...state.dataPoints, ...data].slice(-800);
            return {
              dataPoints: newDataPoints
            };
          });
          console.log("Data updated", data);
        }
      },

      withDevice: (callback: (device: Device) => void) => {
        const device = get().connectedDevice;
        if (device) {
            callback(device);
        } else {
            console.log("No device connected");
        }
      },

      tareScale: async () => {
        get().withDevice(async (device: Device) => {
            await tareScale(device);
        });
      },

      startMeasurement: async () => {
        get().withDevice(async (device: Device) => {
            set({dataPoints: []});
            await startMeasurementCommand(device);
            get().startStreamingData(device);
        });
      },
    
      stopMeasurement: async () => {
        get().withDevice(async (device: Device) => {
            await stopMeasurementCommand(device);
            get().subscription?.remove();
            console.log(get().dataPoints);
            set({subscription: null});
        });
      },
    
      shutdown: async () => {
        get().withDevice(async (device: Device) => {
            await shutdown(device);
            await get().disconnectDevice();
        });
      },
    
      sampleBatteryVoltage: async () => {
        get().withDevice(async (device: Device) => {
            console.log("Sampling battery voltage");
            await sampleBatteryVoltage(device);
        });
      },
    
      startStreamingData: () => {
        get().withDevice((device: Device) => {
          const subscription = startStreamingData(device, get().onDataUpdate);
          set({subscription: subscription});
        });
      },

      resetGoals: () => {
        set({goals: exampleGoals});
      },

      updateGoalDataPoint: (goalId: string, dataPointIndex: number | undefined, updatedDataPoint: DataPoint) => {
        set((state: any) => {
          const goals = state.goals.map((goal: GoalType) => {
            if (goal.id === goalId) {
              const updatedDataPoints = [...goal.dataPoints];
              if (dataPointIndex !== undefined) {
                updatedDataPoints[dataPointIndex] = updatedDataPoint;
              } else {
                updatedDataPoints.push(updatedDataPoint);
                updatedDataPoints.sort((a, b) => a.time - b.time);
              }
              return { ...goal, dataPoints: updatedDataPoints };
            }
            return goal;
          });
          return { goals };
        });
      },

      deleteGoalDataPoint: (goalId: string, dataPointIndex: number) => {
        set((state: any) => {
          const goals = state.goals.map((goal: GoalType) => {
            if (goal.id === goalId) {
              const updatedDataPoints = [...goal.dataPoints]; 
              updatedDataPoints.splice(dataPointIndex, 1);
              return { ...goal, dataPoints: updatedDataPoints };
            }
            return goal;
          });
          return { goals };
        });
      },
    }),
  {
    name: "store",
    storage: createJSONStorage(() => AsyncStorage),
    partialize: (state) => ({
      goals: state.goals,
    }),
    
  }
));

export default useStore; 