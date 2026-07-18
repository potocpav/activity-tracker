import React, { useState, useEffect, useRef } from "react";
import {StyleSheet, Text, Platform, View, AppState, useWindowDimensions} from "react-native";
import useStore from "../Model/Store";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, useThemePalette, useThemeVariant } from "../Model/Theme";
import { useToday } from "../Model/useToday";
import { ActivityType, BleScaleWorkoutState, DataPoint, dateToDateList, State, Tag, Unit, SubUnit } from "../Model/StoreTypes";
import { MD3Theme, Button as PaperButton } from "react-native-paper";
import { matchFont, Points, Text as SkiaText, vec, Canvas, Color, SkFont } from "@shopify/react-native-skia";
import Animated, { useSharedValue, useFrameCallback, useDerivedValue, LinearTransition, FadeIn, SharedValue } from "react-native-reanimated";
import { renderLongFormValue } from "../Model/Unit";
import TagSelector from "../Components/TagSelector";
import SkiaChart, { xToCanvas, yToCanvas, Viewport } from "../Components/Chart/SkiaChart";
import { SystemBars } from "react-native-edge-to-edge";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "../Components/Element";
import ActionSheet, { ActionSheetRef, FlatList } from "react-native-actions-sheet";
import { DataPointCard, DataPointCardMultiContainer, LabeledValue, TextValue } from "./ActivityData";
import { dayCmp, findZeroSlice } from "../Model/Activity";
import { useFocusEffect } from "@react-navigation/native";
import { RenderTags } from "../Components/Tags";
import * as Crypto from "expo-crypto";


const fontFamily = Platform.select({ default: "sans-serif" });
const largeFont = matchFont({ fontFamily: fontFamily, fontSize: 24, fontWeight: "bold" });

type BleScaleInputProps = {
  navigation: any;
  route: any;
};

// Narrowed shapes the inner component can rely on once the outer wrapper has
// asserted them (see the assertions in BleScaleInput at the bottom of the file).
type BleScaleActivity = Omit<ActivityType, "unit"> & { unit: Extract<Unit, { type: "multiple" }> };
type WeightSubUnit = Extract<SubUnit, { type: "weight" }>;
type TimeSubUnit = Extract<SubUnit, { type: "time" }>;

type BleScaleInputInnerProps = {
  navigation: any;
  route: any;
  activity: BleScaleActivity;
  weightUnit: WeightSubUnit;
  timeUnit: TimeSubUnit;
};


type ScaleInput = {
  t0: number | null,
  tLast: number | null,
  max: number,
  dataPoints: { w: number, t: number }[],
  currentPull: CurrentPull,
};

type ScaleDataPoint = { w: number, t: number };

type CurrentPull = { t0: number, wSum: number, wCount: number, wMax: number, wMin: number, active: boolean };

type PastPull = { t0: number, t1: number, wAvg: number };


const CenteredAnimatedText = ({ longestText, text, font, color }: { longestText: string, text: SharedValue<string> | string, font: SkFont, color: Color }) => {
  const largeTextBox = font.measureText(longestText);
  const padding = 2;

  const textOffsetX = useDerivedValue(() => {
    return (largeTextBox.width - font.measureText(typeof text === "string" ? text : text.value).width) / 2 + padding;
  });

  return (
    <Canvas style={{ width: largeTextBox.width + padding * 2, height: largeTextBox.height + padding * 2 }}>
      <SkiaText
        text={text}
        font={font}
        color={color}
        x={textOffsetX}
        y={-largeTextBox.y + padding}
      />
    </Canvas>
  );
};

const BleScaleInputInner: React.FC<BleScaleInputInnerProps> = ({ route, navigation, activity, weightUnit, timeUnit }) => {
  const { activityPath } = route.params;
  const appendActivityDataPoint = useStore((state: any) => state.appendActivityDataPoint);
  const theme = useAppTheme(activity.color);
  const themeVariant = useThemeVariant();
  const palette = useThemePalette();
  const today = dateToDateList(useToday());

  const styles = getStyles(theme);
  const connectedDevice = useStore((state: any) => state.connectedDevice);
  const connecting = useStore((state: any) => state.connecting);
  const connectionStatus = useStore((state: any) => state.connectionStatus);
  const startMeasurement = useStore((state: any) => state.startMeasurement);
  const stopMeasurement = useStore((state: any) => state.stopMeasurement);
  const tareScale = useStore((state: any) => state.tareScale);
  const dimensions = useWindowDimensions();
  const isPortrait = dimensions.width < dimensions.height;

  const requestPermissions = useStore((state: any) => state.requestPermissions);
  const scanForPeripherals = useStore((state: any) => state.scanForPeripherals);
  const disconnectDevice = useStore((state: any) => state.disconnectDevice);

  const workoutState: BleScaleWorkoutState | null = useStore((state: any) => state.bleScaleWorkoutState);
  const setWorkoutState: (workoutState: BleScaleWorkoutState | null) => void = useStore((state: any) => state.setBleScaleWorkoutState);
  const [recordingState, setRecordingState] = useState<"recording" | "stopped">("stopped");

  const pastPulls = useSharedValue<PastPull[]>([]);

  const insets = useSafeAreaInsets();
  const actionSheetRef = useRef<ActionSheetRef>(null);

  const scaleInput = useSharedValue<ScaleInput>({
    t0: null,
    tLast: null,
    max: 0,
    dataPoints: [],
    currentPull: { t0: 0, wSum: 0, wCount: 0, wMax: 0, wMin: 0, active: false },
  });
  const [newDataPoint, setNewDataPoint] = useState<DataPoint | null>(null);
  let pastDataPoints : { dataPoint: DataPoint | null, index: number }[] = activity.dataPoints
    .map((dp: DataPoint, i: number) => ({ dataPoint: dp, index: i }))
    .slice(...findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, today)))
  pastDataPoints.push({ dataPoint: null, index: NaN });
  pastDataPoints.reverse();
  // pastDataPoints = pastDataPoints.slice(0, 55);


  const [inputTags, setInputTags] = useState<string[]>([]);

  const toggleInputTag = (tag: string) => {
    setInputTags(inputTags.includes(tag) ? inputTags.filter((t: string) => t !== tag) : [...inputTags, tag]);
  }

  const weightInLb = (activity.unit.values[0] as any).unit?.unit === "lb";
  const minPullWeight = activity.special?.minWeight ?? NaN;
  const minPullDuration = 2.5;
  const showAbovePullWeight = minPullWeight;
  const showAfterDuration = 0.1;
  const thresholdWeight = 0.6; // % of peak maximum

  const t = useSharedValue(0);
  const tx = useSharedValue(0);
  const viewport = useSharedValue<Viewport>({ left: 0, right: 0, top: 0, bottom: 0 });

  const pullIndicators = useDerivedValue(() => {
    const state = scaleInput.value;
    if (state.currentPull.active) {
      const w = state.currentPull.wSum / state.currentPull.wCount;
      const t = tx.value - state.currentPull.t0 - (state.t0 ?? 0);
      // const t = state.dataPoints[state.dataPoints.length - 1].t - state.currentPull.t0;
      if (w > showAbovePullWeight && t > showAfterDuration) {
        return { pullActive: true, pullWeight: w, pullT0: state.currentPull.t0 + (state.t0 ?? 0), pullTime: t };
      } else {
        return { pullActive: false, pullWeight: 0, pullT0: 0, pullTime: 0 };
      }
    } else {
      return { pullActive: false, pullWeight: 0, pullT0: 0, pullTime: 0 };
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
      appendActivityDataPoint(activityPath, {
        ...newDataPoint,
        ...(inputTags.length > 0 ? { tags: inputTags } : {})
      });
      setNewDataPoint(null);
    }
  }, [newDataPoint]);

  // Pull rectangles are automatically found by a peak detection algorithm.
  // A peak is a maximal continuous time interval with a maximum weight, where all weight measurements are above 0.6 * max weight. 
  // For visual feedback, it is important to detect potential peaks before they end.
  const pushDataPoints = (dataPoints: ScaleDataPoint[]) => {
    scaleInput.set((state) => {
      const tLast = dataPoints[dataPoints.length - 1].t;
      if (state.tLast && tLast < state.tLast) {
        console.warn("tLast < state.tLast", tLast - state.tLast);
        return state;
      }

      const dp = weightInLb ?
        dataPoints.map((dp) => ({ ...dp, w: dp.w * 2.20462 })) :
        dataPoints;

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
          pastPulls.set((pastPulls) => [...pastPulls, newPull].slice(-3));
          // pullCardVisibility.value = withSpring(1);
          if (workoutState) {
            setWorkoutState({ ...workoutState, t0Rest: newPull.t1 });
          }
          setNewDataPoint({
            uuid: Crypto.randomUUID(),
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
        tLast: tLast,
        max: max,
        currentPull: pull,
        dataPoints: newDataPoints,
      };
    });
  };

  useFrameCallback((frameInfo) => {
    t.set(frameInfo.timestamp / 1000);
    if (workoutState?.state === "playing") {
      tx.set((t) => frameInfo.timestamp / 1000 - workoutState.t0);
    }
  });

  const onPlay = () => {
    setWorkoutState({ state: "playing", t0: t.value, t0Rest: 0, date: today });
  }

  const onReset = () => {
    setWorkoutState(null);
    tx.value = 0;
    pastPulls.value = [];
    scaleInput.value = {
      t0: null,
      tLast: null,
      max: 0,
      dataPoints: [],
      currentPull: { t0: 0, wSum: 0, wCount: 0, wMin: 0, wMax: 0, active: false },
    };
    if (recordingState === "recording") {
      stopMeasurement();
      setRecordingState("stopped");
    }
  }

  const onRecord = () => {
    scaleInput.value = {
      t0: null,
      tLast: null,
      max: 0,
      dataPoints: [],
      currentPull: { t0: 0, wSum: 0, wCount: 0, wMin: 0, wMax: 0, active: false },
    };
    if (workoutState?.state !== "playing") {
      setWorkoutState({ state: "playing", t0: t.value, t0Rest: 0, date: today });
    }
    setRecordingState("recording");
    startMeasurement(onDataUpdate);
  }

  const onPause = () => {
    stopMeasurement();
    setRecordingState("stopped");
  }

  // when the screen is blurred, pause the recording
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        if (recordingState === "recording") {
          onPause();
        }
      };
    }, [recordingState])
  );

  // when the app is sent to the background, pause the recording
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState == "background" || nextAppState == "inactive") {
        if (recordingState === "recording") {
          onPause();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const view = useDerivedValue(() => {
    return {
      x: { min: tx.value - 10, max: tx.value },
      y: { min: 0, max: Math.max(minPullWeight, scaleInput.value.max * 1.1) }
    };
  });

  const linePoints = useDerivedValue(() =>
    scaleInput.value.dataPoints.map((dp) => vec(xToCanvas(view.value, viewport.value, dp.t + (scaleInput.value.t0 ?? 0)), yToCanvas(view.value, viewport.value, dp.w)))
  );

  const currentWeight = useDerivedValue(() => {
    if (scaleInput.value.dataPoints.length > 0 && recordingState === "recording") {
      const w = scaleInput.value.dataPoints[scaleInput.value.dataPoints.length - 1].w;
      return w.toFixed(w >= 100 ? 1 : 2) + " " + weightUnit.unit;
    } else {
      return "-";
    }
  });

  const pullWeight = useDerivedValue(() => {
    if (pullIndicators.value.pullActive) {
      const w = pullIndicators.value.pullWeight;
      return w.toFixed(w >= 100 ? 1 : 2) + " " + weightUnit.unit;
    } else {
      return "-";
    }
  });

  const pullTime = useDerivedValue(() => {
    if (pullIndicators.value.pullActive) {
      return pullIndicators.value.pullTime.toFixed(1) + " s";
    } else {
      return "-";
    }
  });

  const totalTime = useDerivedValue(() =>
    renderLongFormValue(Math.floor(tx.value), timeUnit)
  );

  const restTime = useDerivedValue(() => {
    if (pullIndicators.value.pullActive) {
      return "-";
    } else {
      return renderLongFormValue(Math.max(0, Math.floor(tx.value - Math.max(pastPulls.value[pastPulls.value.length - 1]?.t1 ?? 0, workoutState?.t0Rest ?? 0))), timeUnit)
    }
  });

  const currentPullPoints = useDerivedValue(() => {
    const ret = pullIndicators.value.pullWeight > 0 ? [
      vec(xToCanvas(view.value, viewport.value, pullIndicators.value.pullT0), yToCanvas(view.value, viewport.value, 0)),
      vec(xToCanvas(view.value, viewport.value, pullIndicators.value.pullT0), yToCanvas(view.value, viewport.value, pullIndicators.value.pullWeight)),
      vec(xToCanvas(view.value, viewport.value, tx.value), yToCanvas(view.value, viewport.value, scaleInput.value.currentPull.wSum / scaleInput.value.currentPull.wCount)),
    ] : [];
    return ret;
  });

  const pastPullsPoints = useDerivedValue(() => {
    return pastPulls.value.map((pull) => [
      vec(xToCanvas(view.value, viewport.value, pull.t0), yToCanvas(view.value, viewport.value, 0)),
      vec(xToCanvas(view.value, viewport.value, pull.t0), yToCanvas(view.value, viewport.value, pull.wAvg)),
      vec(xToCanvas(view.value, viewport.value, pull.t1), yToCanvas(view.value, viewport.value, pull.wAvg)),
      vec(xToCanvas(view.value, viewport.value, pull.t1), yToCanvas(view.value, viewport.value, 0)),
    ]).flat();
  });

  React.useEffect(() => {
    actionSheetRef.current?.show();
  }, [isPortrait]);

  React.useEffect(() => {
    navigation.setOptions({
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => {
        switch (connectionStatus()) {
          case "connected":
            return (
              <Button onPress={disconnectDevice} >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "semibold" }}>Disconnect</Text>
                <MaterialCommunityIcons name="bluetooth-off" size={22} color={"white"} />
              </Button>
            );
          case "disconnected":
            return (
              <Button onPress={openConnectionModal} >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "semibold" }}>Connect</Text>
                <MaterialCommunityIcons name="bluetooth" size={22} color={"white"} />
              </Button>
            );
          case "connecting":
            return (
              <Button onPress={() => { disconnectDevice() }} >
                <Text style={{ color: "white", fontSize: 16, fontWeight: "semibold" }}>Connecting...</Text>
                <MaterialCommunityIcons name="bluetooth" size={22} color={"white"} />
              </Button>
            );
        }
      }
    })
  }, [theme, activityPath, navigation, connecting, connectedDevice]);

  const buttonsAndChart = (
    <>
      {/* Control Buttons Section */}
      <View style={styles.buttonRow}>
        {workoutState === null ? (
          <PaperButton
            style={{ flex: 1 }}
            mode="outlined"
            icon="play"
            onPress={onPlay}>
            <Text>Start</Text>
          </PaperButton>
        ) : (
          <PaperButton
            style={{ flex: 1 }}
            mode="outlined"
            icon="refresh"
            onPress={onReset}>
            <Text>Reset</Text>
          </PaperButton>
        )}
        {recordingState === "stopped" ? (
          <PaperButton
            style={{ flex: 1 }}
            mode="outlined"
            icon="record"
            disabled={connectionStatus() !== "connected"}
            onPress={onRecord}>
            <Text>Record</Text>
          </PaperButton>
        ) : (
          <PaperButton
            style={{ flex: 1 }}
            mode="outlined"
            icon="pause"
            disabled={connectionStatus() !== "connected"}
            onPress={onPause}>
            <Text>Pause</Text>
          </PaperButton>
        )}
        <PaperButton
          style={{ flex: 1 }}
          mode="outlined"
          icon="scale-balance"
          disabled={connectionStatus() !== "connected" || recordingState === "recording"}
          onPress={() => {
            tareScale();
          }}>
          <Text>Tare</Text>
        </PaperButton>
      </View>

      <View style={{ paddingTop: 8, paddingBottom: 4 }}>
        <TagSelector
          justifyContent="center"
          activity={activity}
          inputTags={inputTags}
          toggleInputTag={toggleInputTag}
          palette={palette}
          theme={theme}
        />
      </View>

      <View style={{ flex: 1, marginRight: 8 }}>
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
    </>
  );

  const statusDisplay = (
    <View style={styles.measurementRow}>
      <View style={styles.measurementColumn}>
        <Text style={styles.measurementLabel}>Weight</Text>
        <CenteredAnimatedText longestText="000.00 kg" text={currentWeight} font={largeFont} color={theme.colors.primary} />
      </View>
      <View style={styles.measurementColumn}>
        <Text style={styles.measurementLabel}>Time</Text>
        <CenteredAnimatedText longestText="0:00:00" text={totalTime} font={largeFont} color={theme.colors.primary} />
      </View>
      <View style={styles.measurementColumn}>
        <Text style={styles.measurementLabel}>Rest</Text>
        <CenteredAnimatedText longestText="00:00" text={restTime} font={largeFont} color={theme.colors.primary} />
      </View>
    </View>
  );

  const dataPointList = (
    <FlatList
      data={pastDataPoints}
      ListFooterComponent={() => (
        <View style={{ height: Math.max(0, dimensions.height - 100 - 50 * pastDataPoints.length) }} />
      )}
      keyExtractor={(item, _) => (item.dataPoint === null ? "new" : item.dataPoint.uuid)}
      renderItem={({ item, index }) => {
        if (item.dataPoint === null) {
          const tags = activity.tags.filter((t: Tag) => inputTags.includes(t.name));
          return (
            <Animated.View entering={FadeIn}>
              <DataPointCardMultiContainer
                tags={tags.length == 0 ? undefined :
                  <RenderTags
                    key="tags"
                    tags={tags}
                    theme={theme}
                    palette={palette}
                  />
                }
                // tags={undefined}
                note={undefined}
                theme={theme}
                style={{ flex: 1, borderWidth: 1, borderColor: theme.colors.primary }}
                selected={false}
                selectModeActive={false}
              >
                <LabeledValue label="Rep" theme={theme}>
                  <CenteredAnimatedText longestText="000" text={`${pastDataPoints.length - index}`} font={largeFont} color={theme.colors.primary} />
                </LabeledValue>
                <LabeledValue label="Weight" theme={theme}>
                  <CenteredAnimatedText longestText="000.00 kg" text={pullWeight} font={largeFont} color={theme.colors.primary} />
                </LabeledValue>
                <LabeledValue label="Time" theme={theme}>
                  <CenteredAnimatedText longestText="00:00" text={pullTime} font={largeFont} color={theme.colors.primary} />
                </LabeledValue>
              </DataPointCardMultiContainer>
            </Animated.View>
          );
        } else {
          return (
            <Animated.View>
              <DataPointCard
                activity={activity}
                activityPath={activityPath}
                i={item.index}
                repNumber={pastDataPoints.length - index}
                theme={theme}
                palette={palette}
                navigation={navigation}
                selectModeActive={false}
                isSelected={false}
                toggleSelection={() => {}}
              />
            </Animated.View>
          );
        }
      }
      }
    />);

  if (isPortrait) {
    return (
      <>
        <SafeAreaView key="portrait" style={{ marginTop: 8, height: '70%' }} edges={["left", "right", "bottom"]}>
          <SystemBars style={{ statusBar: "light", navigationBar: themeVariant == 'light' ? "dark" : "light" }} />
          {buttonsAndChart}
          {statusDisplay}
        </SafeAreaView>
        <ActionSheet
          ref={actionSheetRef}
          isModal={false}
          backgroundInteractionEnabled
          snapPoints={[30, 100]}
          gestureEnabled
          headerAlwaysVisible
          closable={false}
          useBottomSafeAreaPadding
          disableDragBeyondMinimumSnapPoint
          safeAreaInsets={insets}
          indicatorStyle={{ backgroundColor: theme.colors.outline }}
          containerStyle={{
            backgroundColor: theme.colors.elevation.level1,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
          {dataPointList}
        </ActionSheet>
      </>
    );
  } else {
    return (
      <>
        <SafeAreaView key="landscape" style={{ paddingTop: 8, flexDirection: 'row', height: '100%' }} edges={["left", "right", "bottom"]}>
          <SystemBars style={{ statusBar: "light", navigationBar: themeVariant == 'light' ? "dark" : "light" }} />
          <View style={{ flex: 1, paddingBottom: 4 }}>
            {buttonsAndChart}
          </View>
          <View style={{ flex: 1 }}>
            {statusDisplay}
            {dataPointList}
          </View>
        </SafeAreaView>
      </>
    );
  }
};

const getStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    height: '70%',
    marginTop: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 8,
  },
  weightSection: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    padding: 20,
  },
  measurementRow: {
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 10,
  },
  measurementColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 5,
    gap: 10,
  },
  measurementLabel: {
    textAlign: "center",
    fontSize: 16,
    color: theme.colors.outline,
  },
});

// Thin wrapper holding the invariant assertions. Doing the guards here — in a
// component with only one hook, before the inner's ~25 hooks — keeps them out of
// the middle of a hook list (which breaks the Rules of Hooks / React Compiler).
// These branches should never run in normal usage.
const BleScaleInput: React.FC<BleScaleInputProps> = ({ route, navigation }) => {
  const { activityPath } = route.params;
  const activity: ActivityType = useStore((state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]);

  if (activity.unit.type !== "multiple") {
    console.error("BleScaleInput: Activity unit type is not multiple");
    navigation.goBack();
    return null;
  }

  const weightUnit = activity.unit.values.find((u) => u.name === "Weight")?.unit;
  const timeUnit = activity.unit.values.find((u) => u.name === "Time")?.unit;

  if (weightUnit === undefined || timeUnit === undefined || weightUnit.type !== "weight" || timeUnit.type !== "time") {
    console.error("BleScaleInput: Weight or time unit is wrong");
    navigation.goBack();
    return null;
  }

  return (
    <BleScaleInputInner
      route={route}
      navigation={navigation}
      activity={activity as BleScaleActivity}
      weightUnit={weightUnit}
      timeUnit={timeUnit}
    />
  );
};

export default BleScaleInput; 