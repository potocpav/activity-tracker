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

import {Device} from "react-native-ble-plx";
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
  State,
  HintType,
  allHints,
  BleScaleWorkoutState,
  ActivityPath,
  ActivityTab,
  StatValue,
  GraphType,
} from "./StoreTypes";
import { areUnitsEqual } from "./Unit";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { findZeroSlice, dayCmp } from "./Activity";
import { version, migrate } from "./Migrations";
import * as Crypto from "expo-crypto";

// Save only the state that is needed to be saved
export const partialize = (state: State) => ({
  bleScaleWorkoutState: state.bleScaleWorkoutState,
  currentTabId: state.currentTabId,
  activities: state.activities,
  theme: state.theme,
  blackBackground: state.blackBackground,
  weekStart: state.weekStart,
  activeHints: state.activeHints,
  showHints: state.showHints,
  experimentalFeatures: state.experimentalFeatures,
});

const mapActivity = (state: State, activityPath: ActivityPath, f: (activity: ActivityType) => ActivityType) : {} | { activities: ActivityTab[] } => {
  const oldTab = state.activities[activityPath.tabId];
  const oldActivity = oldTab?.activities[activityPath.activityId];
  if (!oldActivity) {
    return {};
  }
  const newScreen = oldTab.activities.slice(0);
  newScreen[activityPath.activityId] = f(oldActivity);
  const newActivities = state.activities.slice(0);
  newActivities[activityPath.tabId] = { ...oldTab, activities: newScreen };
  return { activities: newActivities };
};

const trimEmptyTabs = (activities: ActivityTab[], currentTabId: number) : { activities: ActivityTab[], currentTabId: number } => {
  if (activities.length <= 1) {
    return { activities: activities, currentTabId: currentTabId };
  }
  let newActivities = activities.slice(0);
  let newCurrentTabId = currentTabId;
  while (newActivities[0].activities.length === 0 && newActivities.length > 1) {
    newActivities.splice(0, 1);
    newCurrentTabId = Math.max(-1, newCurrentTabId - 1);
  }
  while (newActivities[newActivities.length - 1].activities.length === 0 && newActivities.length > 1) {
    newActivities.splice(newActivities.length - 1, 1);
    newCurrentTabId = Math.min(newActivities.length, newCurrentTabId);
  }
  return { activities: newActivities, currentTabId: newCurrentTabId };
}

const useStore = create<State>()(
  persist(
    (set, get) => ({
      // Bluetooth device related state
      experimentalFeatures: false,
      allDevices: [],
      connecting: false,
      connectedDevice: null,
      subscription: null,
      bleScaleWorkoutState: null,

      // Activities related state
      currentTabId: 0,
      activities: [{ tabName: "Activities", activities: [] }],
      theme: "system",
      blackBackground: false,
      weekStart: "monday",
      activeHints: allHints,
      showHints: true,

      setExperimentalFeatures: (experimentalFeatures: boolean) => {
        set({ experimentalFeatures: experimentalFeatures });
      },

      dismissHint: (hint: HintType) => {
        set((state: any) => {
          const activeHints = state.activeHints.filter((h: HintType) => h !== hint);
          return { activeHints };
        });
      },

      activateAllHints: () => {
        set((state: any) => {
          return { activeHints: allHints };
        });
      },

      setShowHints: (showHints: boolean) => {
        set({ showHints: showHints });
      },

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

      setCurrentTabId: (currentTabId: number) => {
        set({ currentTabId: currentTabId });
      },

      setActivityTabName: (tabId: number, tabName: string) => {
        set((state: any) => ({
          activities: state.activities.map(
            (tab: ActivityTab, i: number) => i === tabId ? { ...tab, tabName } : tab
          )
        }));
      },

      setActivities: (tabId: number, activities: ActivityType[]) => {
        set((state: any) => ({ 
          activities: state.activities.map(
            (tab: ActivityTab, i: number) => i === tabId ? { ...tab, activities } : tab
          ) 
        }));
      },

      addActivityTab: (tabName: string, activities: ActivityType[]) => {
        set((state: any) => ({
          activities: [...state.activities, { tabName, activities: activities }],
        }));
      },

      duplicateActivity: (activityPath: ActivityPath) => {
        set((state: any) => {
          const oldScreenActivities = state.activities[activityPath.tabId].activities;
          const newScreenActivities = [
            ...oldScreenActivities.slice(0, activityPath.activityId + 1), 
            {...oldScreenActivities[activityPath.activityId], uuid: Crypto.randomUUID()}, 
            ...oldScreenActivities.slice(activityPath.activityId + 1)
          ];

          const newActivities = state.activities.slice(0);
          const oldTab = newActivities[activityPath.tabId];
          newActivities[activityPath.tabId] = { ...oldTab, activities: newScreenActivities };
          return { activities: newActivities };
        });
      },

      deleteActivity: (activityPath: ActivityPath) => {
        set((state: any) => {
          const newActivities = state.activities.slice(0);
          const oldTab = newActivities[activityPath.tabId];
          const newScreen = oldTab.activities.slice(0);
          newScreen.splice(activityPath.activityId, 1);
          newActivities[activityPath.tabId] = { ...oldTab, activities: newScreen };
          return trimEmptyTabs(newActivities, state.currentTabId);
        });
      },

      createActivity: (tabId: number, activity: ActivityType) => {
        let newActivityPath: ActivityPath;
        let activityId: number;
        set((state: any) => {
          let newActivities;
          // add a tab if necessary.
          if (tabId < 0) {
            newActivities = [{ tabName: "Activities", activities: [activity] }, ...state.activities];
            tabId = 0;
          } else if (tabId >= state.activities.length) {
            newActivities = [...state.activities, { tabName: "Activities", activities: [activity] }];
            tabId = state.activities.length;
          } else {
            newActivities = state.activities.slice(0);
            const oldTab = newActivities[tabId];
            newActivities[tabId] = { ...oldTab, activities: [...oldTab.activities, activity] };
          }
          const {activities, currentTabId} = trimEmptyTabs(newActivities, tabId);
          tabId = currentTabId;
          activityId = activities[tabId].activities.length - 1;
          return { activities, currentTabId, activityId };
        });
        return { tabId, activityId: activityId! };
      },

      moveActivitiesToTab: (tabId: number, activityIds: number[], toTabId: number) => {
        set((state: any) => {
          let newActivities;
          // add a new tab if necessary
          if (toTabId < 0) {
            newActivities = [{ tabName: "Activities", activities: [] }, ...state.activities];
            toTabId = 0;
            tabId += 1;
          } else if (toTabId >= state.activities.length) {
            newActivities = [...state.activities, { tabName: "Activities", activities: [] }];
            toTabId = newActivities.length - 1;
          } else {
            newActivities = state.activities.slice(0);
          }
          const fromTab = newActivities[tabId];
          const selectedActivities = fromTab.activities.filter((activity: ActivityType, index: number) => activityIds.includes(index));
          const unselectedActivities = fromTab.activities.filter((activity: ActivityType, index: number) => !activityIds.includes(index));
          newActivities[tabId] = { ...fromTab, activities: unselectedActivities };
          const toTab = newActivities[toTabId];
          newActivities[toTabId] = { ...toTab, activities: [...toTab.activities, ...selectedActivities] };
          return trimEmptyTabs(newActivities, tabId);
        });
      },

      updateActivity: (activityPath: ActivityPath, activity: ActivityType) => {
        set((state: any) => {
            return mapActivity(state, activityPath, (_: ActivityType) =>  activity);
        });
      },

      setActivityCalendar: (activityPath: ActivityPath, calendarIndex: number, calendar: CalendarProps) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, calendars: activity.calendars.map((c: CalendarProps, i: number) => i === calendarIndex ? calendar : c) };
          })
        );
      },

      cloneActivityCalendar: (activityPath: ActivityPath, calendarIndex: number) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, calendars: [...activity.calendars.slice(0, calendarIndex + 1), activity.calendars[calendarIndex], ...activity.calendars.slice(calendarIndex + 1)] };
          })
        );
      },

      deleteActivityCalendar: (activityPath: ActivityPath, calendarIndex: number) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, calendars: [...activity.calendars.slice(0, calendarIndex), ...activity.calendars.slice(calendarIndex + 1)] };
          })
        );
      },

      setActivityGraph: (activityPath: ActivityPath, graphIndex: number, graph: GraphProps) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, graphs: activity.graphs.map((g: GraphProps, i: number) => i === graphIndex ? graph : g) };
          })
        );
      },

      cloneActivityGraph: (activityPath: ActivityPath, graphIndex: number) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, graphs: [...activity.graphs.slice(0, graphIndex + 1), activity.graphs[graphIndex], ...activity.graphs.slice(graphIndex + 1)] };
          })
        );
      },

      deleteActivityGraph: (activityPath: ActivityPath, graphIndex: number) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, graphs: [...activity.graphs.slice(0, graphIndex), ...activity.graphs.slice(graphIndex + 1)] };
          })
        );
      },

      setActivityStat: (activityPath: ActivityPath, statId: number, stat: Stat) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, stats: activity.stats.map((s: Stat, i: number) => i === statId ? stat : s) };
          })
        );
      },

      cloneActivityStat: (activityPath: ActivityPath, statId: number) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, stats: [...activity.stats.slice(0, statId + 1), activity.stats[statId], ...activity.stats.slice(statId + 1)] };
          })
        );
      },

      deleteActivityStat: (activityPath: ActivityPath, statId: number) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, stats: activity.stats.filter((s: Stat, i: number) => i !== statId) };
          })
        );
      },

      setUnit: (activityPath: ActivityPath, unit: Unit, unitMap: { oldName: string | null, newName: string }[]) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            // don't update unit if it's the same
            if (areUnitsEqual(activity.unit, unit)) {
              return activity;
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

        
          // update points
          // FIXME: What if the value is undefined, after converting a data point from Multiple to Single?
          const newDataPoints = activity.dataPoints
            .map((dp: DataPoint) => {
              let { value, ...dpValueless } = dp;
              const newDpValue = mapDpValue(dp.value);
              return {
                ...dpValueless,
                ...(newDpValue !== undefined ? { value: newDpValue } : {}),
              }
            });

          // update calendars, graphs, and stats

          const newCalendars = activity.calendars.map((calendar: CalendarProps) => {
            let newCalendarValue: StatValue;
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
            let newGraphType: GraphType;
            let newBinSize = graph.binSize;
            if (unit.type === "none" && activity.unit.type !== "none") {
              newGraphType = "bar-count";
              if (graph.binSize === "point") {
                newBinSize = "day";
              }
            } else if (unit.type !== "none" && activity.unit.type === "none") {
              newGraphType = "bar-count";
            } else {
              newGraphType = graph.graphType;
            }

            return {
              ...graph,
              graphType: newGraphType,
              binSize: newBinSize,
              subUnit: setSubUnitName(graph.subUnit)
            };
          });

          const newStats = activity.stats.map((stat: Stat) => ({
            ...stat,
            subUnit: setSubUnitName(stat.subUnit)
          }));

          const newActivity: ActivityType = {
            ...activity,
            unit,
            dataPoints: newDataPoints,
            calendars: newCalendars,
            graphs: newGraphs,
            stats: newStats
          };
          return newActivity;
          })
        );
      },

      setTags: (activityPath: ActivityPath, tags: SetTag[]) => {
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
        const updateTagFilters = (tagFilters: TagFilter[]) : TagFilter[] =>
          tagFilters.map((tf: TagFilter) => ({
            ...tf,
            name: updateTag(tf.name)
          })).filter((tf: any) => tf.name !== null) as TagFilter[];

        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            const newActivity: ActivityType = {
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
            };
            return newActivity;
          })
        );
      },

      findTag: (activityPath: ActivityPath, tagName: string) => {
        return get().activities[activityPath.tabId].activities[activityPath.activityId].tags.find((t: Tag) => t.name === tagName);
      },

      addTag: (activityPath: ActivityPath, tag: Tag) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => ({ 
            ...activity, 
            tags: [...activity.tags, tag] 
          }))
        );
      },

      deleteTag: (activityPath: ActivityPath, tagName: string) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
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
            const newActivity: ActivityType =
              {
                ...activity,
                tags: updateTags(activity.tags),
                dataPoints: updateDataPoints(activity.dataPoints)
              };
            return newActivity;
          })
        );
      },

      renameTag: (activityPath: ActivityPath, tagName: string, newTagName: string) => {
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
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
          const newActivity: ActivityType = {
            ...activity,
            tags: updateTags(activity.tags, tagName, newTagName),
            dataPoints: updateDataPoints(activity.dataPoints, tagName, newTagName)
          };
          return newActivity;
          })
        );
      },  

      updateActivityDataPoint: (activityPath: ActivityPath, dataPointIndex: number | undefined, updatedDataPoint: DataPoint) => {
        var insertIndex: number = NaN;
        set((state: any) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            if (updatedDataPoint.tags?.length === 0) {
              delete updatedDataPoint.tags;
            }
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
          })
        );
        return insertIndex;
      },

      // users need to make sure that the date is monotonic
      // TODO: double check it
      appendActivityDataPoint: (activityPath: ActivityPath, dataPoint: DataPoint) => {
        set((state: State) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            return { ...activity, dataPoints: [...activity.dataPoints, dataPoint] };
          })
        );
      },

      deleteActivityDataPoint: (activityPath: ActivityPath, dataPointIndex: number) => {
        set((state: State) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            const updatedDataPoints = [...activity.dataPoints];
            updatedDataPoints.splice(dataPointIndex, 1);
            return { ...activity, dataPoints: updatedDataPoints };
          })
        );
      },

      deleteActivityDataPoints: (activityPath: ActivityPath, dpIndices: number[]) => {
        set((state: State) => 
          mapActivity(state, activityPath, (activity: ActivityType) => {
            const updatedDataPoints = activity.dataPoints.filter((_, index) => !dpIndices.includes(index));
            return { ...activity, dataPoints: updatedDataPoints };
          })
        );
      },

      requestPermissions: requestPermissions,

      connectionStatus: () : "connected" | "disconnected" | "connecting" => {
        if (get().connecting) {
          return "connecting";
        } else if (get().connectedDevice !== null) {
          return "connected";
        } else {
          return "disconnected";
        }
      },

      connectToDevice: async (device: Device) => {
        try {
          set({ connecting: true });
          const deviceConnection = await connectToDevice(device);
          set({ connectedDevice: deviceConnection, connecting: false });
          deviceConnection.onDisconnected(async () => {
            console.warn("Device is disconnected asynchronously.");
            set({ connectedDevice: null, connecting: false });
          });
        } catch (e) {
          console.warn("FAILED TO CONNECT", e);
          set({ connecting: false, connectedDevice: null });
        }
      },

      disconnectDevice: async () => {
        const connectedDevice: any = get().connectedDevice;
        if (connectedDevice) {
          await disconnectDevice(connectedDevice);
        }
        set({ connectedDevice: null, connecting: false });
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

      startMeasurement: async (onDataUpdate: (data: { w: number, t: number }[]) => void) => {
        get().withDevice(async (device: Device) => {
          await startMeasurementCommand(device);
          get().startStreamingData(onDataUpdate);
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

      startStreamingData: (onDataUpdate: (data: { w: number, t: number }[]) => void) => {
        get().withDevice((device: Device) => {
          const subscription = startStreamingData(device, (error, characteristic) => {
            const data = extractData(error, characteristic);
            if (data) {
              onDataUpdate(data);
            }
          });
          set({ subscription: subscription });
        });
      },

      setBleScaleWorkoutState: (bleScaleWorkoutState: BleScaleWorkoutState | null) => {
        set({ bleScaleWorkoutState: bleScaleWorkoutState });
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