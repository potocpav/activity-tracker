import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Platform,
  View,
} from "react-native";
import useStore from "../Model/Store";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme, getThemePalette, getThemeVariant } from "../Model/Theme";
import { ActivityType, DataPoint, dateToDateList } from "../Model/StoreTypes";
import { Button } from "react-native-paper";
import { matchFont, Points, Text as SkiaText, vec, Canvas } from "@shopify/react-native-skia";
import { useSharedValue, useFrameCallback, useDerivedValue } from "react-native-reanimated";
import { renderLongFormValue } from "../Model/Unit";
import TagSelector from "../Components/TagSelector";
import SkiaChart, { xToCanvas, yToCanvas, Viewport } from "../Components/Chart/SkiaChart";

const fontFamily = Platform.select({ default: "sans-serif" });
const largeFont = matchFont({ fontFamily: fontFamily, fontSize: 24 });

type BleScaleInputProps = {
  navigation: any;
  route: any;
};


type ScaleInput = {
  t0: number | null,
  max: number,
  dataPoints: { w: number, t: number }[],
  currentPull: CurrentPull,
};

type ScaleDataPoint = { w: number, t: number };

type CurrentPull = { t0: number, wSum: number, wCount: number, wMax: number, wMin: number, active: boolean };

type PastPull = { t0: number, t1: number, wAvg: number };


const BleScaleInput: React.FC<BleScaleInputProps> = ({ route, navigation }) => {
  const { activityName } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const appendActivityDataPoint = useStore((state: any) => state.appendActivityDataPoint);
  const theme = getTheme(activity.color);
  const themeVariant = getThemeVariant();
  const palette = getThemePalette();
  const today = dateToDateList(new Date());

  const isConnected = useStore((state: any) => state.isConnected);
  const startMeasurement = useStore((state: any) => state.startMeasurement);
  const stopMeasurement = useStore((state: any) => state.stopMeasurement);
  const tareScale = useStore((state: any) => state.tareScale);

  const connectedDevice = useStore((state: any) => state.connectedDevice);
  const requestPermissions = useStore((state: any) => state.requestPermissions);
  const scanForPeripherals = useStore((state: any) => state.scanForPeripherals);
  const disconnectDevice = useStore((state: any) => state.disconnectDevice);

  const weightUnit = activity.unit.values.find((u: any) => u.name === "Weight")?.unit;
  const timeUnit = activity.unit.values.find((u: any) => u.name === "Time")?.unit;

  const [workoutState, setWorkoutState] = useState<"paused" | "playing">("paused");
  const [recordingState, setRecordingState] = useState<"recording" | "stopped">("stopped");

  const [pastPulls, setPastPulls] = useState<PastPull[]>([]);

  const scaleInput = useSharedValue<ScaleInput>({
    t0: null,
    max: 0,
    dataPoints: [],
    currentPull: { t0: 0, wSum: 0, wCount: 0, wMax: 0, wMin: 0, active: false },
  });
  const [newDataPoint, setNewDataPoint] = useState<DataPoint | null>(null);

  const [inputTags, setInputTags] = useState<string[]>([]);

  const toggleInputTag = (tag: string) => {
    setInputTags(inputTags.includes(tag) ? inputTags.filter((t: string) => t !== tag) : [...inputTags, tag]);
  }

  const largeFontBox = largeFont.measureText("00.00 kg");

  const minChartRange = 1;
  const minPullWeight = 2;
  const minPullDuration = 3.0;
  const showAfterPullWeight = 0.5;
  const showAfterDuration = 0.1;
  const thresholdWeight = 0.6;

  const pullIndicators = useDerivedValue(() => {
    const state = scaleInput.get();
    if (state.currentPull.active) {
      const w = state.currentPull.wSum / state.currentPull.wCount;
      const t = state.dataPoints[state.dataPoints.length - 1].t - state.currentPull.t0;
      if (w > showAfterPullWeight && t > showAfterDuration) {
        return { pullWeight: w, pullT0: state.currentPull.t0 + (state.t0 ?? 0), pullTime: t };
      } else {
        return { pullWeight: 0, pullT0: 0, pullTime: 0 };
      }
    } else {
      return { pullWeight: 0, pullT0: 0, pullTime: 0 };
    }
  });

  const openConnectionModal = async () => {
    scanForDevices();
    navigation.navigate("BleConnectionModal");
  };

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const onDataUpdate: (data: ScaleDataPoint[]) => void = (data: ScaleDataPoint[]) => {
    pushDataPoints(data);
  };

  useEffect(() => {
    // indirection is necessary, because we can't set Zustand state in `setScaleInput` directly
    if (newDataPoint) {
      appendActivityDataPoint(activityName, {
        ...newDataPoint,
        ...(inputTags.length > 0 ? { tags: inputTags } : {})
      });
      setNewDataPoint(null);
    }
  }, [newDataPoint]);

  const pushDataPoints = (dataPoints: ScaleDataPoint[]) => {
    scaleInput.set((state) => {
      const dp = dataPoints;

      let pull: CurrentPull = state.currentPull;

      const wSum = dp.reduce((sum, dp) => sum + dp.w, 0);
      const wCount = dp.length;
      const wMin = Math.min(...dp.map((dp) => dp.w));
      const wMax = Math.max(...dp.map((dp) => dp.w));

      if (wMax * thresholdWeight > pull.wMin) {
        // pull forward t0
        pull.wCount = wCount;
        pull.wSum = wSum;
        pull.wMin = wMin;
        pull.wMax = wMax;
        for (let i = state.dataPoints.length - 1; i >= 0 && state.dataPoints[i].t > pull.t0; i--) {
          pull.wCount++;
          pull.wSum += state.dataPoints[i].w;
          pull.wMin = Math.min(pull.wMin, state.dataPoints[i].w);
          pull.wMax = Math.max(pull.wMax, state.dataPoints[i].w);
          if (state.dataPoints[i].w < wMax * thresholdWeight) {
            pull.t0 = state.dataPoints[i].t;
            pull.active = true;
            break;
          }
        }
      } else if (pull.wCount > 0 && pull.active && wMin < pull.wMax * thresholdWeight) {
        // end the pull
        let t1 = NaN;
        for (let i = 0; i < dp.length; i++) {
          if (dp[i].w < pull.wMax * thresholdWeight) {
            t1 = dp[i].t;
            break;
          }
        }
        const duration = t1 - pull.t0;
        const newPull = {
          t0: pull.t0 + (state.t0 ?? 0),
          t1: t1 + (state.t0 ?? 0),
          wAvg: pull.wSum / pull.wCount,
        };
        if (newPull.wAvg > minPullWeight && duration > minPullDuration) {
          // publish the pull
          setPastPulls((pastPulls) => [...pastPulls, newPull]);
          setNewDataPoint({
            date: today,
            value: {
              Weight: Math.round(newPull.wAvg * 100) / 100,
              Time: Math.round((duration) * 100) / 100
            },
          });
        }
        pull = { t0: dp[0].t, wSum: 0, wCount: 0, wMax: 0, wMin: 0, active: false };
      }

      pull.wSum += wSum;
      pull.wCount += wCount;
      pull.wMax = Math.max(pull.wMax, wMax);
      pull.wMin = Math.min(pull.wMin, wMin);

      const newDataPoints = [...state.dataPoints, ...dp].slice(-800);
      const max = newDataPoints.reduce((max, dp) => Math.max(max, dp.w), 0);

      // TODO: fix how cutting off data points messes up the current pull
      return {
        t0: state.t0 ?? tx.value,
        max: max,
        currentPull: pull,
        dataPoints: newDataPoints,
      };
    });
  };

  const tx = useSharedValue(0);
  const viewport = useSharedValue<Viewport>({ left: 0, right: 0, top: 0, bottom: 0 });

  useFrameCallback((frameInfo) => {
    if (workoutState === "playing") {
      tx.set((t) => t + (frameInfo.timeSincePreviousFrame ?? 0) / 1000);
    }
  });

  const isPulling = useDerivedValue(() => {
    return pullIndicators.value.pullWeight > showAfterPullWeight && pullIndicators.value.pullTime > showAfterDuration;
  });

  const view = useDerivedValue(() => {
    return { x: { min: tx.value - 10, max: tx.value }, y: { min: 0, max: Math.max(1, scaleInput.value.max * 1.1) } };
  });

  const linePoints = useDerivedValue(() =>
    scaleInput.value.dataPoints.map((dp) => vec(xToCanvas(view.value, viewport.value, dp.t + (scaleInput.value.t0 ?? 0)), yToCanvas(view.value, viewport.value, dp.w)))
  );

  const pullWeight = useDerivedValue(() =>
    renderLongFormValue(pullIndicators.value.pullWeight, weightUnit)
  );

  const totalTime = useDerivedValue(() =>
    renderLongFormValue(Math.floor(tx.value), timeUnit)
  );

  const timeSinceLastPull = useDerivedValue(() =>
    isPulling.value ?
      renderLongFormValue(Math.floor(pullIndicators.value.pullTime), timeUnit) :
      renderLongFormValue(Math.floor(tx.value - (pastPulls[pastPulls.length - 1]?.t1 ?? 0)), timeUnit)
  );

  const currentPullPoints = useDerivedValue(() => {
    const ret = pullIndicators.value.pullWeight > 0 ? [
      vec(xToCanvas(view.value, viewport.value, pullIndicators.value.pullT0), yToCanvas(view.value, viewport.value, 0)),
      vec(xToCanvas(view.value, viewport.value, pullIndicators.value.pullT0), yToCanvas(view.value, viewport.value, pullIndicators.value.pullWeight)),
      vec(xToCanvas(view.value, viewport.value, tx.value), yToCanvas(view.value, viewport.value, scaleInput.value.currentPull.wSum / scaleInput.value.currentPull.wCount)),
    ] : [];
    return ret;
  });

  const pastPullsPoints = useDerivedValue(() => {
    return pastPulls.map((pull) => [
      vec(xToCanvas(view.value, viewport.value, pull.t0), yToCanvas(view.value, viewport.value, 0)),
      vec(xToCanvas(view.value, viewport.value, pull.t0), yToCanvas(view.value, viewport.value, pull.wAvg)),
      vec(xToCanvas(view.value, viewport.value, pull.t1), yToCanvas(view.value, viewport.value, pull.wAvg)),
      vec(xToCanvas(view.value, viewport.value, pull.t1), yToCanvas(view.value, viewport.value, 0)),
    ]).flat();
  });

  React.useEffect(() => {
    navigation.setOptions({
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => (
        <>
          <Button
            compact={true}
            onPress={isConnected ? disconnectDevice : openConnectionModal}
            style={{ marginLeft: 8 }}
            mode="outlined"
            icon={isConnected ? 'bluetooth-off' : 'bluetooth'}
            dark={themeVariant == 'light'}
            labelStyle={{ paddingHorizontal: 8 }}
          >
            <Text>{isConnected ? 'Disconnect' : 'Connect'}</Text>
          </Button>
        </>
      ),
    });
  }, [theme, activityName, navigation, isConnected]);

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right", "bottom"]}>
      {isConnected || true ? (
        <>
          <View style={{ paddingHorizontal: 10 }}>
            <TagSelector
              activity={activity}
              inputTags={inputTags}
              toggleInputTag={toggleInputTag}
              palette={palette}
              theme={theme}
            />
          </View>

          {/* Control Buttons Section */}
          <View style={styles.controlSection}>
            <View style={styles.buttonRow}>
              <Button
                style={{ flex: 1 }}
                mode="outlined"
                icon="play"
                onPress={() => {
                  setWorkoutState("playing");
                }}>
                <Text>Start</Text>
              </Button>
              <Button
                style={{ flex: 1 }}
                mode="outlined"
                icon="pause"
                onPress={() => {
                  setWorkoutState("paused");
                }}>
                <Text>Pause</Text>
              </Button>
              <Button
                style={{ flex: 1 }}
                mode="outlined"
                icon="refresh"
                onPress={() => {
                  tx.value = 0;
                  setWorkoutState("paused");
                }}>
                <Text>Reset</Text>
              </Button>
            </View>
            <View style={styles.buttonRow}>
              <Button
                style={{ flex: 1 }}
                mode="outlined"
                icon="record"
                onPress={() => {

                  scaleInput.value = {
                    t0: null,
                    max: 0,
                    dataPoints: [],
                    currentPull: { t0: 0, wSum: 0, wCount: 0, wMin: 0, wMax: 0, active: false },
                  };
                  setWorkoutState("playing");
                  setRecordingState("recording");
                  startMeasurement(onDataUpdate);
                }}>
                <Text>Record</Text>
              </Button>
              <Button
                style={{ flex: 1 }}
                mode="outlined"
                icon="stop"
                onPress={() => {
                  stopMeasurement();
                  setRecordingState("stopped");
                }}>
                <Text>Stop</Text>
              </Button>
              <Button
                style={{ flex: 1 }}
                mode="outlined"
                icon="scale-balance"
                onPress={() => {
                  tareScale();
                }}>
                <Text>Tare</Text>
              </Button>
            </View>
          </View>

          {/* Weight and Time Display Section */}
          <View style={[styles.weightSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface, width: largeFontBox.width }]}>Weight</Text>
                <Canvas
                  style={{ width: largeFontBox.width, height: largeFontBox.height }}
                >
                  <SkiaText
                    text={pullWeight}
                    font={largeFont}
                    color={theme.colors.onSurface}
                    x={0}
                    y={-largeFontBox.y}
                  />
                </Canvas>
              </View>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface, width: largeFontBox.width }]}>Time</Text>
                <Canvas
                  style={{ width: largeFontBox.width, height: largeFontBox.height }}
                >
                  <SkiaText
                    text={totalTime}
                    font={largeFont}
                    color={theme.colors.onSurface}
                    x={0}
                    y={-largeFontBox.y}
                  />
                </Canvas>
              </View>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface, width: largeFontBox.width }]}>Rest/Pull</Text>
                <Canvas
                  style={{ width: largeFontBox.width, height: largeFontBox.height }}
                >
                  <SkiaText
                    text={timeSinceLastPull}
                    font={largeFont}
                    color={theme.colors.onSurface}
                    x={0}
                    y={-largeFontBox.y}
                  />
                </Canvas>
              </View>
            </View>
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface, width: largeFontBox.width }]}>Reps</Text>
                <Canvas
                  style={{ width: largeFontBox.width, height: largeFontBox.height }}
                >
                  <SkiaText
                    text={pastPulls.length.toString()}
                    font={largeFont}
                    color={theme.colors.onSurface}
                    x={0}
                    y={-largeFontBox.y}
                  />
                </Canvas>
              </View>
            </View>

            <View style={{ width: '100%', flex: 1 }}>
              <SkiaChart
                gridLineColor={theme.colors.outline}
                view={view}
                viewportShared={viewport}
              >
                <Points
                  mode="polygon"
                  points={linePoints}
                  color={theme.colors.primary}
                  strokeWidth={1}
                />
                <Points
                  mode="polygon"
                  points={currentPullPoints}
                  color={theme.colors.secondary}
                  strokeWidth={2}
                />
                <Points
                  mode="polygon"
                  points={pastPullsPoints}
                  color={theme.colors.secondary}
                  strokeWidth={2}
                />
              </SkiaChart>
            </View>
            <View style={{ height: 50 }} />
          </View>
        </>
      ) : (
        <View style={[styles.disconnectedSection, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.disconnectedText, { color: theme.colors.error }]}>
            Please connect the Tindeq Progressor
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlSection: {
    marginTop: 10,
    padding: 0,
    gap: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 10,
  },
  weightSection: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
  },
  measurementColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 5,
    gap: 10,
  },
  measurementLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  disconnectedSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disconnectedText: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
});

export default BleScaleInput; 