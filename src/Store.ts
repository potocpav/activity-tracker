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
import { 
  CalendarProps, 
  Unit, 
  GraphProps, 
  Stat, 
  TagFilter, 
  ActivityType, 
  Tag, 
  DataPoint, 
  SetTag, 
  TagName, 
  State 
} from "./StoreTypes";
import { areUnitsEqual } from "./Unit";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { findZeroSlice, dayCmp } from "./ActivityUtil";

export const version = 16;

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

      duplicateActivity: (activityName: string) => {
        set((state: any) => {
          const activityIx = state.activities.findIndex((a: ActivityType) => a.name === activityName);
          if (activityIx === -1) {
            console.error("Activity not found");
            return {};
          }
          const nameRoot = state.activities[activityIx].name.replace(/ \(copy(\s*\d*)\)$/, "");
          let newName = (i: number) => i == 1 ? `${nameRoot} (copy)` : `${nameRoot} (copy ${i})`;
          let i = 1;
          while (state.activities.find((a: ActivityType) => a.name === newName(i))) {
            i++;
          }
          const newActivity = { ...state.activities[activityIx], name: newName(i) };
          const activities = [...state.activities.slice(0, activityIx + 1), newActivity, ...state.activities.slice(activityIx + 1)];
          return { activities };
        });
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

      setActivityCalendar: (activityName: string, calendarIndex: number, calendar: CalendarProps) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, calendars: a.calendars.map((c: CalendarProps, i: number) => i === calendarIndex ? calendar : c) } : a);
          return { activities };
        });
      },

      cloneActivityCalendar: (activityName: string, calendarIndex: number) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, calendars: 
            [...a.calendars.slice(0, calendarIndex + 1), a.calendars[calendarIndex], ...a.calendars.slice(calendarIndex + 1)] } : a);
          return { activities };
        });
      },

      deleteActivityCalendar: (activityName: string, calendarIndex: number) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, calendars: [...a.calendars.slice(0, calendarIndex), ...a.calendars.slice(calendarIndex + 1)] } : a);
          return { activities };
        });
      },

      setActivityGraph: (activityName: string, graphIndex: number, graph: GraphProps) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, graphs: a.graphs.map((g: GraphProps, i: number) => i === graphIndex ? graph : g) } : a);
          return { activities };
        });
      },

      cloneActivityGraph: (activityName: string, graphIndex: number) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, graphs: 
            [...a.graphs.slice(0, graphIndex + 1), a.graphs[graphIndex], ...a.graphs.slice(graphIndex + 1)] } : a);
          return { activities };
        });
      },

      deleteActivityGraph: (activityName: string, graphIndex: number) => {
        set((state: any) => {
          const activities = state.activities.map((a: ActivityType) => activityName === a.name ? { ...a, graphs: [...a.graphs.slice(0, graphIndex), ...a.graphs.slice(graphIndex + 1)] } : a);
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

      setUnit: (activityName: string, unit: Unit, unitMap: {oldName: string | null, newName: string}[]) => {
        set((state: any) => {
          const activity = state.activities.find((a: ActivityType) => a.name === activityName);
          if (!activity) {
            console.error("Activity not found");
            return {};
          }
          // don't update unit if it's the same
          if (areUnitsEqual(activity.unit, unit)) {
            return {};
          }

          const setSubUnitName = (oldName: string | null) => {
            switch (unit.type) {
              case "none":
                return null;
              case "single":
                return null;
              case "multiple":
                switch (activity.unit.type) {
                  case "none":
                    return unit.values[0].name;
                  case "single":
                    return unit.values[0].name;
                  case "multiple":
                    return unitMap.find((u: any) => u.oldName === oldName)?.newName ?? unit.values[0].name;
                }
            }
            console.error("Unknown unit type", unit);
            return null;
          }

          const mapDpValue = (value: undefined | number | object) => {
            let newValue;
            switch (unit.type) {
              case "none":
                value = undefined;
                break;
              case "single":
                switch (activity.unit.type) {
                  case "none":
                    newValue = 1;
                    break;
                  case "single":
                    newValue = value;
                    break;
                  case "multiple":
                    newValue = (value as any)[activity.unit.values[0].name];
                    break;
                }
                break;
              case "multiple":
                switch (activity.unit.type) {
                  case "none":
                    // first element is 1, the rest are undefined
                    newValue = Object.fromEntries([[unit.values[0].name, 1]]);
                    break;
                  case "single":
                    // all subunits with oldName == null are value, the rest are undefined
                    newValue = Object.fromEntries(
                      unitMap
                        .filter(u => u.oldName === null)
                        .map(u => [u.newName, value])
                      );
                    break;
                  case "multiple":
                    // all subunits with oldName are set to the appropriate previous value
                    newValue = Object.fromEntries(
                      unitMap
                        .filter(u => typeof u.oldName === 'string')
                        .map(u => [u.newName, (value as any)[u.oldName as string]])
                        .filter(u => u[1] !== undefined)
                      );
                    break;
                }
                break;
            }
            return newValue;
          }

          // update data points
          // FIXME: What if the value is undefined, after converting a data point from Multiple to Single?
          const newDataPoints = activity.dataPoints
            .map((dp: DataPoint) => {
              let {value, ...dpValueless} = dp;
              const newDpValue = mapDpValue(dp.value);
              return {
                ...dpValueless ,
                ...(newDpValue !== undefined ? {value: newDpValue} : {}),
              }
            });

          // update calendars, graphs, and stats

          const newCalendars = activity.calendars.map((calendar: CalendarProps) => {
            let newCalendarValue;
            if (unit.type === "none") {
              newCalendarValue = "n_points";
            } else {
              newCalendarValue = calendar.value;
            }

            return {
              ...calendar,
              value: newCalendarValue,
              subUnit: setSubUnitName(calendar.subUnit)
            };
          });

          const newGraphs = activity.graphs.map((graph: GraphProps) => {
            let newGraphType;
            if (unit.type === "none" && activity.unit.type !== "none") {
              newGraphType = "bar-count";
            } else if (unit.type !== "none" && activity.unit.type === "none") {
              newGraphType = "box";
            } else  {
              newGraphType = graph.graphType;
            }
    
            return {
              ...graph,
              graphType: newGraphType,
              subUnit: setSubUnitName(graph.subUnit)
            };
          });

          const newStats = activity.stats.map((stat: Stat) => ({
            ...stat,
            subUnit: setSubUnitName(stat.subUnit)
          }));

          const newActivity = {
            ...activity,
            unit,
            dataPoints: newDataPoints,
            calendars: newCalendars,
            graphs: newGraphs,
            stats: newStats
          };
          return {activities: state.activities.map((a: ActivityType) => a.name === activityName ? newActivity : a)};
        });
      },

      setTags: (activityName: string, tags: SetTag[]) => {
        const newTagNames = tags.map((t: SetTag) => t.name);
        const oldTagNames = tags.map((t: SetTag) => t.oldTagName).filter((t: TagName | null) => t !== null);
        if (new Set(newTagNames).size !== newTagNames.length) {
          console.error("Tag names must be unique");
          return;
        }
        if (new Set(oldTagNames).size !== oldTagNames.length) {
          console.error("Old tag names must be unique");
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
            stats: activity.stats.map((stat: Stat) => ({
              ...stat,
              tagFilters: updateTagFilters(stat.tagFilters)
            })),
            calendars: activity.calendars.map((calendar: CalendarProps) => ({
              ...calendar,
              tagFilters: updateTagFilters(calendar.tagFilters)
            })),
            graphs: activity.graphs.map((graph: GraphProps) => ({
              ...graph,
              tagFilters: updateTagFilters(graph.tagFilters)
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
            console.error("Tag already exists");
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
            console.error("Device is disconnected asynchronously.");
            set({ isConnected: false });
          });
        } catch (e) {
          console.error("FAILED TO CONNECT", e);
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
          console.error("Data updated", data);
        }
      },

      withDevice: (callback: (device: Device) => void) => {
        const device = get().connectedDevice;
        if (device) {
          callback(device);
        } else {
          console.error("No device connected");
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
          console.error("Sampling battery voltage");
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