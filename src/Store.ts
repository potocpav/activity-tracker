/* eslint-disable no-bitwise */

/*
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
} from "react-native-ble-plx";
 */
import { create } from "zustand";
import { areUnitsEqual, CalendarProps, GraphProps, Stat, TagFilter } from "./StoreTypes";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ActivityType, Tag, DataPoint, SetTag, TagName, State } from "./StoreTypes";
import { findZeroSlice, dayCmp } from "./ActivityUtil";

export const version = 11;

export const migrate = (persisted: any, version: number) => {
  if (version <= 5) {
    persisted.goals.forEach((goal: any) => {
      goal.graph.binSize = "day";
    });
  }
  if (version <= 7) {
    persisted.goals.forEach((goal: any) => {
      if (goal.stats.length > 0 && typeof goal.stats[0] === 'object') {
        goal.stats = [goal.stats];
      }
    });
  }
  if (version <= 8) {
    persisted.weekStart = "monday";
  }
  if (version <= 9) {
    persisted.activities = persisted.goals;
    delete persisted.goals;
  }
  if (version <= 10) {
    persisted.activities.forEach((activity: ActivityType) => {
      activity.stats = activity.stats.flat(1);
    });
  }
  return persisted
};

// Save only the state that is needed to be saved
export const partialize = (state: State) => ({
  activities: state.activities,
  theme: state.theme,
  blackBackground: state.blackBackground,
  weekStart: state.weekStart,
});

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

      // Activities related state
      activities: [],
      theme: "system",
      blackBackground: false,
      weekStart: "monday",
      
      setState: (state: State) => {
        set(state);
      },
      
      setTheme: (theme: "system" | "light" | "dark") => {
        set({ theme: theme });
      },
      
      setBlackBackground: (blackBackground: boolean) => {
        set({ blackBackground: blackBackground });
      },
      
      setWeekStart: (weekStart: "sunday" | "monday") => {
        set({ weekStart: weekStart });
      },

      setActivities: (activities: ActivityType[]) => {
        set({ activities: activities });
      },

      deleteActivity: (activityName: string) => {
        set((state: any) => {
          const activities = state.activities.filter((activity: ActivityType) => activity.name !== activityName);
          return { activities };
        });
      },

      updateActivity: (activityName: string | null, activity: ActivityType) => {
        set((state: any) => {
          const activityExists = state.activities.find((a: ActivityType) => a.name === activityName);
          if (activityExists) {
            const activities = state.activities.map((a: ActivityType) => activityName === a.name ? activity : a);
            return { activities };
          } else {
            return { activities: [...state.activities, activity] };
          }
        });
      },

      setActivityCalendar: (activityName: string, calendar: CalendarProps) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, calendar } : a);
          return { activities };
        });
      },

      setActivityGraph: (activityName: string, graph: GraphProps) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, graph } : a);
          return { activities };
        });
      },

      setActivityStat: (activityName: string, statId: number, stat: Stat) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => 
            activityName === a.name 
              ? { 
                ...a, 
                stats: a.stats.map((s: Stat, i: number) => 
                  i === statId ? stat : s
                )
                } 
              : a
          );
          return { activities };
        });
      },

      addActivityStat: (activityName: string, stat: Stat) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => 
            activityName === a.name 
              ? { 
                ...a, 
                stats: [...a.stats, stat]
              } 
              : a);
          return { activities };
        });
      },

      deleteActivityStat: (activityName: string, statId: number) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => 
            activityName === a.name 
              ? { 
                ...a, 
                stats: a.stats.filter((s: Stat, i: number) => i !== statId)
              } 
              : a);
          return { activities };
        });
      },

      setUnit: (activityName: string, unit: null | string | { name: string, symbol: string, oldName?: null | string }[]) => {
        set((state: any) => {
          const activity = state.activities.find((a: ActivityType) => a.name === activityName);
          if (!activity) {
            console.log("Activity not found");
            return {};
          }
          // don't update unit if it's the same
          if (areUnitsEqual(activity.unit, unit)) {
            return {};
          }

          const setSubUnitName = (subUnit: string | null) => {
            if (unit === null || typeof unit === 'string') {
              return null;
            } else if (Array.isArray(unit)) {
              if (activity.unit === null || typeof activity.unit === 'string') {
                return unit[0].name;
              } else if (Array.isArray(activity.unit)) {
                return unit.find((u: any) => u.oldName === subUnit)?.name ?? unit[0].name;
              }
            }
            console.log("Unknown unit type", unit);
            return null;
          }

          const mapDpValue = (value: undefined | number | object) => {
            let newValue;
            if (unit === null) {
              value = undefined;
            } else if (typeof unit === 'string') {
              if (activity.unit === null) {
                newValue = 1;
              } else if (typeof activity.unit === 'string') {
                newValue = value;
              } else if (Array.isArray(activity.unit)) {
                newValue = (value as any)[activity.unit[0].name];
              }
            } else if (Array.isArray(unit)) {
              if (activity.unit === null) {
                // first element is 1, the rest are undefined
                newValue = Object.fromEntries([[unit[0].name, 1]]);
              } else if (typeof activity.unit === 'string') {
                // all subunits with oldName == null are value, the rest are undefined
                newValue = Object.fromEntries(unit.filter((u: any) => u.oldName === null).map(u => [u.name, value]));
              } else if (Array.isArray(activity.unit)) {
                // all subunits with oldName are set to the appropriate previous value
                newValue = Object.fromEntries(unit.filter((u: any) => typeof u.oldName === 'string').map(u => [u.name, (value as any)[u.oldName as string]]).filter((u: any) => u[1] !== undefined));
              }
            } else {
              console.error("Unknown unit type", unit);
              newValue = value;
            }
            return newValue;
          }

          // update data points
          const newDataPoints = activity.dataPoints.map((dp: DataPoint) => {
            let {value, ...dpValueless} = dp;
            const newDpValue = mapDpValue(dp.value);
            return {
              ...dpValueless ,
              ...(newDpValue !== undefined ? {value: newDpValue} : {}),
            }
          });

          let newCalendarValue;
          if (unit === null) {
            newCalendarValue = "n_points";
          } else {
            newCalendarValue = activity.calendar.value;
          }

          // update calendar, graph, and stats
          const newCalendar = {
            ...activity.calendar,
            value: newCalendarValue,
            subUnit: setSubUnitName(activity.calendar.subUnit)
          };
          
          let newGraphType;
          if (unit === null && activity.unit !== null) {
            newGraphType = "bar-count";
          } else if (unit !== null && activity.unit === null) {
            newGraphType = "box";
          } else  {
            newGraphType = activity.graph.graphType;
          }

          const newGraph = {
            ...activity.graph,
            graphType: newGraphType,
            subUnit: setSubUnitName(activity.graph.subUnit)
          };

          const newStats = activity.stats.map((stat: Stat) => ({
            ...stat,
            subUnit: setSubUnitName(stat.subUnit)
          }));

          const newActivity = {
            ...activity,
            unit,
            dataPoints: newDataPoints,
            calendar: newCalendar,
            graph: newGraph,
            stats: newStats
          };
          return { activities: [...state.activities.filter((a: ActivityType) => a.name !== activityName), newActivity] };
        });
      },

      setTags: (activityName: string, tags: SetTag[]) => {
        const newTagNames = tags.map((t: SetTag) => t.name);
        const oldTagNames = tags.map((t: SetTag) => t.oldTagName).filter((t: TagName | null) => t !== null);
        if (new Set(newTagNames).size !== newTagNames.length) {
          console.log("Tag names must be unique");
          return;
        }
        if (new Set(oldTagNames).size !== oldTagNames.length) {
          console.log("Old tag names must be unique");
          return;
        }

        const newTags = tags.map((t: SetTag) => ({ name: t.name, color: t.color }));
        const updateTag = (tagName: TagName) =>
          tags.find((t: SetTag) => t.oldTagName === tagName)?.name ?? null;
        const updateTags = (tags: TagName[] | undefined) => {
          if (tags === undefined) {
            return undefined;
          } else {
            const newTags = tags.map((t: TagName) => updateTag(t)).filter((t: TagName | null) => t !== null);
            if (newTags.length > 0) {
              return newTags
            } else {
              return undefined;
            }
          }
        };
        const updateTagFilters = (tagFilters: TagFilter[]) =>
          tagFilters.map((tf: TagFilter) => ({
            ...tf,
            name: updateTag(tf.name)
          })).filter((tf: any) => tf.name !== null);

        set((state: any) => {
          const activities = state.activities.map((activity: ActivityType) => activity.name === activityName ? {
            ...activity,
            tags: newTags,
            calendar: {
              ...activity.calendar,
              tagFilters: updateTagFilters(activity.calendar.tagFilters)
            },
            graph: {
              ...activity.graph,
              tagFilters: updateTagFilters(activity.graph.tagFilters)
            },
            stats: activity.stats.map((stat: Stat) => ({
              ...stat,
              tagFilters: updateTagFilters(stat.tagFilters)
            })),
            dataPoints: activity.dataPoints.map((dp: DataPoint) => {
              const newTags = updateTags(dp.tags);
              if (newTags === undefined) {
                return dp;
              } else {
                return {
                  ...dp,
                  tags: newTags
                }
              }
            })
          } : activity);
          return { activities };
        });
      },

      findTag: (activityName: string, tagName: string) => {
        return get().activities.find((a: ActivityType) => a.name === activityName)?.tags.find((t: Tag) => t.name === tagName);
      },

      addTag: (activityName: string, tag: Tag) => {
        set((state: any) => {
          const existingTags = state.activities.find((a: ActivityType) => a.name === activityName)?.tags;
          if (!existingTags.find((t: Tag) => t.name === tag.name)) {
            const activities = state.activities.map((activity: ActivityType) => activity.name === activityName ? { ...activity, tags: [...activity.tags, tag] } : activity);
            return { activities };
          } else {
            console.log("Tag already exists");
            return {};
          }
        });
      },

      deleteTag: (activityName: string, tagName: string) => {
        set((state: any) => {
          const updateDataPoints = (dataPoints: DataPoint[]) => {
            return dataPoints.map((dataPoint: DataPoint) => {
              if (dataPoint.tags == undefined) {
                return dataPoint;
              } else {
                const newTags = dataPoint.tags.filter((t: string) => t !== tagName);
                if (newTags.length > 0) {
                  return { ...dataPoint, tags: newTags };
                } else {
                  return dataPoint;
                }
              }
            });
          }
          const updateTags = (tags: Tag[]) => {
            return tags.filter((t: Tag) => t.name !== tagName);
          }
          const activities = state.activities.map((activity: ActivityType) => activity.name === activityName ? 
            { 
              ...activity, 
              tags: updateTags(activity.tags), 
              dataPoints: updateDataPoints(activity.dataPoints) 
            } : activity);
          return { activities };
        });
      },

      renameTag: (activityName: string, tagName: string, newTagName: string) => {
        set((state: any) => {
          const updateTags = (tags: Tag[], oldTagName: string, newTagName: string) => {
            return tags.map((tag: Tag) => tag.name === oldTagName ? { ...tag, name: newTagName } : tag);
          }
          const updateDataPoints = (dataPoints: DataPoint[], oldTagName: string, newTagName: string) => {
            return dataPoints.map((dataPoint: DataPoint) => {
              if (dataPoint.tags !== undefined) {
                return dataPoint.tags.includes(oldTagName) ? { ...dataPoint, tags: [...dataPoint.tags.filter((t: string) => t !== oldTagName), newTagName] } : dataPoint;
              } else {
                return dataPoint;
              }
            });
          }
          const activities = state.activities.map((activity: ActivityType) => activity.name === activityName ? {
            ...activity,
            tags: updateTags(activity.tags, tagName, newTagName),
            dataPoints: updateDataPoints(activity.dataPoints, tagName, newTagName)
          } : activity);

          return { activities };
        });
      },

      updateActivityDataPoint: (activityName: string, dataPointIndex: number | undefined, updatedDataPoint: DataPoint) => {
        var insertIndex: number = NaN;
        set((state: any) => {
          if (updatedDataPoint.tags?.length === 0) {
            delete updatedDataPoint.tags;
          }
          const activities = state.activities.map((activity: ActivityType) => {
            if (activity.name === activityName) {
              const updatedDataPoints = [...activity.dataPoints];
              if (dataPointIndex !== undefined) {
                if (dayCmp(updatedDataPoint, updatedDataPoints[dataPointIndex].date) == 0) {
                  // if date is the same, update in place
                  updatedDataPoints[dataPointIndex] = updatedDataPoint;
                  insertIndex = dataPointIndex;
                } else {
                  // if date is different, remove the old data point and insert the new one as the last element in the new day
                  updatedDataPoints.splice(dataPointIndex, 1);
                  insertIndex = findZeroSlice(updatedDataPoints, (dp: DataPoint) => dayCmp(dp, updatedDataPoint.date))[1];
                  updatedDataPoints.splice(insertIndex, 0, updatedDataPoint);
                }
              } else {
                // if data point index is undefined, insert the new data point as the last element in the new day
                insertIndex = findZeroSlice(updatedDataPoints, (dp: DataPoint) => dayCmp(dp, updatedDataPoint.date))[1];
                updatedDataPoints.splice(insertIndex, 0, updatedDataPoint);
              }
              return { ...activity, dataPoints: updatedDataPoints };
            }
            return activity;
          });
          return { activities };
        });
        return insertIndex;
      },

      deleteActivityDataPoint: (activityName: string, dataPointIndex: number) => {
        set((state: any) => {
          const activities = state.activities.map((activity: ActivityType) => {
            if (activity.name === activityName) {
              const updatedDataPoints = [...activity.dataPoints];
              updatedDataPoints.splice(dataPointIndex, 1);
              return { ...activity, dataPoints: updatedDataPoints };
            }
            return activity;
          });
          return { activities };
        });
      },

            /*
      requestPermissions: requestPermissions,
      
      connectToDevice: async (device: Device) => {
        try {
          const deviceConnection = await connectToDevice(device);
          set({ connectedDevice: deviceConnection, isConnected: true });
          deviceConnection.onDisconnected(async () => {
            console.log("Device is disconnected asynchronously.");
            set({ isConnected: false });
          });
        } catch (e) {
          console.log("FAILED TO CONNECT", e);
        }
      },

      disconnectDevice: async () => {
        const connectedDevice: any = get().connectedDevice;
        if (connectedDevice) {
          await disconnectDevice(connectedDevice);
          set({ isConnected: false });
        }
      },

      scanForPeripherals: () => {
        scanForPeripherals((device) => {
          const isDuplicteDevice = (devices: Device[], nextDevice: Device) => {
            return devices.findIndex((device) => nextDevice.id === device.id) > -1;
          };
          set((state: any) => {
            if (!isDuplicteDevice(state.allDevices, device)) {
              return { allDevices: [...state.allDevices, device] };
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
          set({ dataPoints: [] });
          await startMeasurementCommand(device);
          get().startStreamingData(device);
        });
      },

      stopMeasurement: async () => {
        get().withDevice(async (device: Device) => {
          await stopMeasurementCommand(device);
          get().subscription?.remove();
          set({ subscription: null });
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
          set({ subscription: subscription });
        });
      },
*/
    }),
    {
      name: "store",
      storage: createJSONStorage(() => AsyncStorage),
      version: version,
      partialize: partialize,
      migrate: migrate,
    }
  ));


export default useStore; 