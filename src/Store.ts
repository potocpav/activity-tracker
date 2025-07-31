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
} from "react-native-ble-plx";
import { areUnitsEqual, CalendarProps, GraphProps, Stat, TagFilter, timeToDateList } from "./StoreTypes";
import { defaultGraph, defaultCalendar, defaultStats, exampleGoals } from "./ExampleData";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoalType, Tag, DataPoint, SetTag, TagName, State } from "./StoreTypes";
import { findZeroSlice, dayCmp } from "./GoalUtil";

export const version = 9;

export const migrate = (persisted: any, version: number) => {
  if (version <= 0) {
    persisted.goals.forEach((goal: GoalType) => {
      goal.color = 19;
    });
  }
  if (version <= 1) {
    persisted.goals.forEach((goal: GoalType) => {
      goal.tags.forEach((tag: Tag) => {
        tag.color = 19;
      });
    });
  }
  if (version <= 2) {
    persisted.goals.forEach((goal: GoalType) => {
      goal.stats = defaultStats(goal.unit);
    });
  }
  if (version <= 3) {
    persisted.goals.forEach((goal: GoalType) => {
      goal.dataPoints.forEach((dp: any) => {
        dp.date = timeToDateList(dp.time);
        delete dp.time;
      });
    });
  }
  if (version <= 4) {
    persisted.goals.forEach((goal: GoalType) => {
      goal.calendar = defaultCalendar(goal.unit);
      goal.graph = defaultGraph(goal.unit);
    });
  }
  if (version <= 5) {
    persisted.goals.forEach((goal: GoalType) => {
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
  return persisted
};

// Save only the state that is needed to be saved
export const partialize = (state: State) => ({
  goals: state.goals,
  theme: state.theme,
  blackBackground: state.blackBackground,
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

      // Goals related state
      goals: exampleGoals,
      theme: "light",
      blackBackground: false,
      weekStart: "monday",
      requestPermissions: requestPermissions,

      setState: (state: State) => {
        set(state);
      },

      setTheme: (theme: "light" | "dark") => {
        set({ theme: theme });
      },

      setBlackBackground: (blackBackground: boolean) => {
        set({ blackBackground: blackBackground });
      },

      setWeekStart: (weekStart: "sunday" | "monday") => {
        set({ weekStart: weekStart });
      },

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

      resetGoals: () => {
        set({ goals: exampleGoals });
      },

      setGoals: (goals: GoalType[]) => {
        set({ goals: goals });
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

      setGoalCalendar: (goalName: string, calendar: CalendarProps) => {
        set((state: any) => {
          const goals = state.goals.map((g: GoalType) => goalName === g.name ? { ...g, calendar } : g);
          return { goals };
        });
      },

      setGoalGraph: (goalName: string, graph: GraphProps) => {
        set((state: any) => {
          const goals = state.goals.map((g: GoalType) => goalName === g.name ? { ...g, graph } : g);
          return { goals };
        });
      },

      setGoalStats: (goalName: string, stats: Stat[]) => {
        set((state: any) => {
          const goals = state.goals.map((g: GoalType) => goalName === g.name ? { ...g, stats } : g);
          return { goals };
        });
      },

      setGoalStat: (goalName: string, statRowId: number, statColId: number, stat: Stat) => {
        set((state: any) => {
          const goals = state.goals.map((g: GoalType) => 
            goalName === g.name 
              ? { 
                ...g, 
                stats: g.stats.map((s: Stat[], i: number) => 
                  i === statRowId 
                    ? s.map((s: Stat, j: number) => 
                      j === statColId ? stat : s) 
                    : s
                )
                } 
              : g
          );
          return { goals };
        });
      },

      addGoalStat: (goalName: string, stat: Stat, statRowId: number | null) => {
        set((state: any) => {
          const goals = state.goals.map((g: GoalType) => 
            goalName === g.name 
              ? { 
                ...g, 
                stats: statRowId === null 
                  ? [...g.stats, [stat]] 
                  : g.stats.map((s: Stat[], i: number) => 
                    i === statRowId 
                      ? [...s, stat] 
                      : s
                  )
              } 
              : g);
          return { goals };
        });
      },

      deleteGoalStat: (goalName: string, statRowId: number, statColId: number) => {
        set((state: any) => {
          const goals = state.goals.map((g: GoalType) => 
            goalName === g.name 
              ? { 
                ...g, 
                stats: g.stats.map((s: Stat[], i: number) => 
                  i === statRowId 
                    ? s.filter((s: Stat, j: number) => j !== statColId) 
                    : s
                )
              } 
              : g);
          return { goals };
        });
      },

      setUnit: (goalName: string, unit: null | string | { name: string, symbol: string, oldName?: null | string }[]) => {
        set((state: any) => {
          console.log("Setting unit.");
          console.log("    Previous unit:", JSON.stringify(state.goals.find((g: GoalType) => g.name === goalName)?.unit));
          console.log("    New unit:     ", JSON.stringify(unit));
          const goal = state.goals.find((g: GoalType) => g.name === goalName);
          if (!goal) {
            console.log("Goal not found");
            return {};
          }
          // don't update unit if it's the same
          if (areUnitsEqual(goal.unit, unit)) {
            console.log("Unit is the same", goal.unit, unit   );
            return {};
          }

          const setSubUnitName = (subUnit: string | null) => {
            if (unit === null || typeof unit === 'string') {
              return null;
            } else if (Array.isArray(unit)) {
              if (goal.unit === null || typeof goal.unit === 'string') {
                return unit[0].name;
              } else if (Array.isArray(goal.unit)) {
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
              if (goal.unit === null) {
                newValue = 1;
              } else if (typeof goal.unit === 'string') {
                newValue = value;
              } else if (Array.isArray(goal.unit)) {
                newValue = (value as any)[goal.unit[0].name];
              }
            } else if (Array.isArray(unit)) {
              if (goal.unit === null) {
                // first element is 1, the rest are undefined
                newValue = Object.fromEntries([[unit[0].name, 1]]);
              } else if (typeof goal.unit === 'string') {
                // all subunits with oldName == null are value, the rest are undefined
                newValue = Object.fromEntries(unit.filter((u: any) => u.oldName === null).map(u => [u.name, value]));
              } else if (Array.isArray(goal.unit)) {
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
          const newDataPoints = goal.dataPoints.map((dp: DataPoint) => {
            let {value, ...dpValueless} = dp;
            const newDpValue = mapDpValue(dp.value);
            return {
              ...dpValueless ,
              ...(newDpValue !== undefined ? {value: newDpValue} : {}),
            }
          });

          // update calendar, graph, and stats
          const newCalendar = {
            ...goal.calendar,
            subUnit: setSubUnitName(goal.calendar.subUnit)
          };
          
          let newGraphType;
          if (goal.unit === null || typeof goal.unit === 'string') {
            newGraphType = "bar-count";
          } else  {
            newGraphType = goal.graph.graphType;
          }

          const newGraph = {
            ...goal.graph,
            graphType: newGraphType,
            subUnit: setSubUnitName(goal.graph.subUnit)
          };

          const newStats = goal.stats.map((stat: Stat[]) => stat.map((s: Stat) => ({
            ...s,
            subUnit: setSubUnitName(s.subUnit)
          })));

          const newGoal = {
            ...goal,
            unit,
            dataPoints: newDataPoints,
            calendar: newCalendar,
            graph: newGraph,
            stats: newStats
          };
          console.log("New goal:", JSON.stringify(newGoal, null, 2));
          return { goals: [...state.goals.filter((g: GoalType) => g.name !== goalName), newGoal] };
        });
      },

      setTags: (goalName: string, tags: SetTag[]) => {
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
          const goals = state.goals.map((goal: GoalType) => goal.name === goalName ? {
            ...goal,
            tags: newTags,
            calendar: {
              ...goal.calendar,
              tagFilters: updateTagFilters(goal.calendar.tagFilters)
            },
            graph: {
              ...goal.graph,
              tagFilters: updateTagFilters(goal.graph.tagFilters)
            },
            stats: goal.stats.map((stat: Stat[]) => stat.map((s: Stat) => ({
              ...s,
              tagFilters: updateTagFilters(s.tagFilters)
            }))),
            dataPoints: goal.dataPoints.map((dp: DataPoint) => {
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
          } : goal);
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
          const goals = state.goals.map((goal: GoalType) => goal.name === goalName ? 
            { 
              ...goal, 
              tags: updateTags(goal.tags), 
              dataPoints: updateDataPoints(goal.dataPoints) 
            } : goal);
          return { goals };
        });
      },

      renameTag: (goalName: string, tagName: string, newTagName: string) => {
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
                if (dayCmp(updatedDataPoint, updatedDataPoints[dataPointIndex].date) == 0) {
                  // if date is the same, update in place
                  updatedDataPoints[dataPointIndex] = updatedDataPoint;
                } else {
                  // if date is different, remove the old data point and insert the new one as the last element in the new day
                  updatedDataPoints.splice(dataPointIndex, 1);
                  const insertIndex = findZeroSlice(updatedDataPoints, (dp: DataPoint) => dayCmp(dp, updatedDataPoint.date))[1];
                  updatedDataPoints.splice(insertIndex, 0, updatedDataPoint);
                }
              } else {
                // if data point index is undefined, insert the new data point as the last element in the new day
                const insertIndex = findZeroSlice(updatedDataPoints, (dp: DataPoint) => dayCmp(dp, updatedDataPoint.date))[1];
                updatedDataPoints.splice(insertIndex, 0, updatedDataPoint);
              }
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
      version: version,
      partialize: partialize,
      migrate: migrate,
    }
  ));


export default useStore; 