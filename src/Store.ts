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

export type Tag = {
  name: TagName;
  color: string;
};

export type TagName = string;

export type DataPoint = {
    time: number;
    value: number | object;
    tags: TagName[];
};

export type GoalType = {
  name: string;
  description: string;
  unit: Unit;
  dataPoints: DataPoint[];
  tags: Tag[];
};

export type State = {
  allDevices: Device[];
  isConnected: boolean;
  connectedDevice: Device | null;
  subscription: Subscription | null;

  dataPoints: {w: number, t: number}[];

  goals: GoalType[];
  theme: "light" | "dark";

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
      theme: "light",

      requestPermissions: requestPermissions,

      setTheme: (theme: "light" | "dark") => {
        set({theme: theme});
      },

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

      setGoals: (goals: GoalType[]) => {
        set({goals: goals});
      },

      deleteGoal: (goalName: string) => {
        set((state: any) => {
          const goals = state.goals.filter((goal: GoalType) => goal.name !== goalName);
          return { goals };
        });
      },

      updateGoal: (goalName: string, goal: GoalType) => {
        set((state: any) => {
          const goalExists = state.goals.find((g: GoalType) => g.name === goalName);
          if (goalExists) {
            const goals = state.goals.map((g: GoalType) => goalName === g.name ? goal : g);
            return { goals };
          } else {
            return { goals: [...state.goals, goal] };
          }
        });
      },

      setTags: (goalName: string, tags: Tag[]) => {
        set((state: any) => {
          const goals = state.goals.map((goal: GoalType) => goal.name === goalName ? { ...goal, tags: tags } : goal);
          return { goals };
        });
      },

      findTag: (goalName: string, tagName: string) => {
        return get().goals.find((g: GoalType) => g.name === goalName)?.tags.find((t: Tag) => t.name === tagName);
      },

      addTag: (goalName: string, tag: Tag) => {
        set((state: any) => {
          const existingTags = state.goals.find((g: GoalType) => g.name === goalName)?.tags;
          if (!existingTags.find((t: Tag) => t.name === tag.name)) {
            const goals = state.goals.map((goal: GoalType) => goal.name === goalName ? { ...goal, tags: [...goal.tags, tag] } : goal);
            return { goals };
          } else {
            console.log("Tag already exists");
            return {};
          }
        });
      },

      deleteTag: (goalName: string, tagName: string) => {
        set((state: any) => {
          const updateDataPoints = (dataPoints: DataPoint[], tagName: string) => {
            return dataPoints.map((dataPoint: DataPoint) => dataPoint.tags.includes(tagName) ? { ...dataPoint, tags: dataPoint.tags.filter((t: string) => t !== tagName) } : dataPoint);
          }
          const updateTags = (tags: Tag[], tagName: string) => {
            return tags.filter((t: Tag) => t.name !== tagName);
          } 
          const goals = state.goals.map((goal: GoalType) => goal.name === goalName ? { ...goal, tags: updateTags(goal.tags, tagName), dataPoints: updateDataPoints(goal.dataPoints, tagName) } : goal);
          return { goals };
        });
      },

      renameTag: (goalName: string, tagName: string, newTagName: string) => {
        set((state: any) => {
          const updateTags = (tags: Tag[], oldTagName: string, newTagName: string) => {
            return tags.map((tag: Tag) => tag.name === oldTagName ? { ...tag, name: newTagName } : tag);
          }
          const updateDataPoints = (dataPoints: DataPoint[], oldTagName: string, newTagName: string) => {
            return dataPoints.map((dataPoint: DataPoint) => dataPoint.tags.includes(oldTagName) ? { ...dataPoint, tags: [...dataPoint.tags.filter((t: string) => t !== oldTagName), newTagName] } : dataPoint);
          }
          const goals = state.goals.map((goal: GoalType) => goal.name === goalName ? { 
            ...goal, 
            tags: updateTags(goal.tags, tagName, newTagName),
            dataPoints: updateDataPoints(goal.dataPoints, tagName, newTagName)
          } : goal);

          return { goals };
        });
      },

      updateGoalDataPoint: (goalName: string, dataPointIndex: number | undefined, updatedDataPoint: DataPoint) => {
        var insertIndex: number = NaN;
        set((state: any) => {
          const goals = state.goals.map((goal: GoalType) => {
            if (goal.name === goalName) {
              const updatedDataPoints = [...goal.dataPoints];
              if (dataPointIndex !== undefined) {
                updatedDataPoints.splice(dataPointIndex, 1);
              }
              insertIndex = updatedDataPoints.findLastIndex((dp: DataPoint) => dp.time <= updatedDataPoint.time) + 1;
              updatedDataPoints.splice(insertIndex, 0, updatedDataPoint);
              return { ...goal, dataPoints: updatedDataPoints };
            }
            return goal;
          });
          return { goals };
        });
        return insertIndex;
      },

      deleteGoalDataPoint: (goalName: string, dataPointIndex: number) => {
        set((state: any) => {
          const goals = state.goals.map((goal: GoalType) => {
            if (goal.name === goalName) {
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
    version: 0,
    partialize: (state) => ({
      goals: state.goals,
      theme: state.theme,
    }),
    
  }
));

export default useStore; 