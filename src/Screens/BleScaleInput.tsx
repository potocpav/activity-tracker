import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  Platform,
  View,
  TouchableOpacity,
} from "react-native";
import useStore from "../Model/Store";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTheme, getThemePalette, getThemeVariant } from "../Model/Theme";
import { ActivityType, DataPoint, dateToDateList, timeToDateList } from "../Model/StoreTypes";
import { Button } from "react-native-paper";
import { CartesianChart, getTransformComponents, Line, setScale, setTranslate, useChartTransformState } from "victory-native";
import { matchFont, Points, vec } from "@shopify/react-native-skia";
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { renderLongFormValue, renderShortFormValue } from "../Model/Unit";
import TagSelector from "../Components/TagSelector";

const fontFamily = Platform.select({ default: "sans-serif" });
const font = matchFont({ fontFamily: fontFamily });

type BleScaleInputProps = {
  navigation: any;
  route: any;
};


type ScaleInput = {
  dataPoints: { w: number, t: number }[],
  currentPull: CurrentPull,
  pastPulls: PastPull[],
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

  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;

  const [scaleInput, setScaleInput] = useState<ScaleInput>({
    dataPoints: [],
    currentPull: { t0: 0, wSum: 0, wCount: 0, wMax: 0, wMin: 0, active: false },
    pastPulls: [],
  });
  const [newDataPoint, setNewDataPoint] = useState<DataPoint | null>(null);

  const [inputTags, setInputTags] = useState<string[]>([]);

  const toggleInputTag = (tag: string) => {
    setInputTags(inputTags.includes(tag) ? inputTags.filter((t: string) => t !== tag) : [...inputTags, tag]);
  }


  const minChartRange = 1;
  const minPullWeight = 10;
  const minPullDuration = 3.0;
  const showAfterPullWeight = 0.5;
  const showAfterDuration = 0.1;
  const thresholdWeight = 0.6;

  const chartRange = Math.max(minChartRange, scaleInput.dataPoints.reduce((max, dp) => Math.max(max, dp.w), 0));

  const {pullWeight, pullT0, pullTime} = (() => {
    if (scaleInput.currentPull.active) {
      const w = scaleInput.currentPull.wSum / scaleInput.currentPull.wCount;
      const t = scaleInput.dataPoints[scaleInput.dataPoints.length - 1].t - scaleInput.currentPull.t0;
      if (w > showAfterPullWeight && t > showAfterDuration) {
        return { pullWeight: w, pullT0: scaleInput.currentPull.t0, pullTime: t };
      } else {
        return { pullWeight: 0, pullT0: 0, pullTime: 0 };
      }
    } else {
      return { pullWeight: 0, pullT0: 0, pullTime: 0 };
    }
  })();

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
    setScaleInput((state) => {
      let pulls = [...state.pastPulls];
      let pull: CurrentPull = state.currentPull;
      
      const wSum = dataPoints.reduce((sum, dp) => sum + dp.w, 0);
      const wCount = dataPoints.length;
      const wMin = Math.min(...dataPoints.map((dp) => dp.w));
      const wMax = Math.max(...dataPoints.map((dp) => dp.w));

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
        for (let i = 0; i < dataPoints.length; i++) {
          if (dataPoints[i].w < pull.wMax * thresholdWeight) {
            t1 = dataPoints[i].t;
            break;
          }
        }
        const newPull = {
          t0: pull.t0,
          t1: t1,
          wAvg: pull.wSum / pull.wCount,
        };
        if (newPull.wAvg > minPullWeight && newPull.t1 - newPull.t0 > minPullDuration) {
          // publish the pull
          pulls.push(newPull);
          setNewDataPoint({
            date: today,
            value: { 
              Weight: Math.round(newPull.wAvg * 100) / 100, 
              Time: Math.round((newPull.t1 - newPull.t0) * 100) / 100 
            },
          });
        }
        pull = { t0: dataPoints[0].t, wSum: 0, wCount: 0, wMax: 0, wMin: 0, active: false };
      }

      pull.wSum += wSum;
      pull.wCount += wCount;
      pull.wMax = Math.max(pull.wMax, wMax);
      pull.wMin = Math.min(pull.wMin, wMin);

      // TODO: fix how cutting off data points messes up the current pull
      return { 
        currentPull: pull, 
        pastPulls: pulls, 
        dataPoints: [...state.dataPoints, ...dataPoints].slice(-800),
      };
    });
  };

  const kx = useSharedValue(1);
  const ky = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // enforce limits when panning
  useAnimatedReaction(
    () => {
      return transformState.panActive.value || transformState.zoomActive.value;
    },
    (cv, pv) => {
      if (!cv && pv) {
        const vals = getTransformComponents(transformState.matrix.value);
        kx.value = vals.scaleX;
        tx.value = vals.translateX;

        if (tx.value < 0) {
          tx.value = withTiming(0);
        }
      }
    },
  );


  useAnimatedReaction(
    () => {
      return { kx: kx.value, ky: ky.value, tx: tx.value, ty: ty.value };
    },
    ({ kx, ky, tx, ty }) => {
      const m = setTranslate(transformState.matrix.value, tx, ty);
      transformState.matrix.value = setScale(m, kx, ky);
    },
  );

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
            mode="contained"
            dark={themeVariant == 'light'}
            labelStyle={{ paddingHorizontal: 8 }}
          >
            <Text>{isConnected ? 'Disconnect' : 'Connect'}</Text>
          </Button>
        </>
      ),
    });
  }, [activityName, navigation, theme, activity, isConnected]);

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right", "bottom"]}>
      {isConnected || true ? (
        <>
          {/* Control Buttons Section */}
          <View style={styles.controlSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={() => {
                setScaleInput({
                  dataPoints: [],
                  currentPull: { t0: 0, wSum: 0, wCount: 0, wMin: 0, wMax: 0, active: false },
                  pastPulls: [],
                });
                startMeasurement(onDataUpdate);
              }} style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.controlButtonText, { color: theme.colors.onPrimary }]}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopMeasurement} style={[styles.controlButton, { backgroundColor: theme.colors.secondary }]}>
                <Text style={[styles.controlButtonText, { color: theme.colors.onSecondary }]}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={tareScale} style={[styles.controlButton, { backgroundColor: theme.colors.tertiary }]}>
                <Text style={[styles.controlButtonText, { color: theme.colors.onTertiary }]}>Tare</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{paddingHorizontal: 10 }}>
          <TagSelector
            activity={activity}
            inputTags={inputTags}
            toggleInputTag={toggleInputTag}
            palette={palette}
            theme={theme}
          />
          </View>

          {/* Weight and Time Display Section */}
          <View style={[styles.weightSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface }]}>Weight:</Text>
                <Text
                  style={[styles.measurementValue, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {isFinite(pullWeight) ? renderLongFormValue(pullWeight, weightUnit) : '-'}
                </Text>
              </View>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface }]}>Time:</Text>
                <Text
                  style={[styles.measurementValue, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {isFinite(pullTime) ? renderShortFormValue(pullTime, timeUnit) : '-'}
                </Text>
              </View>
            </View>

            {/* <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface }]}>Max Weight:</Text>
                <Text style={[styles.measurementValue, { color: theme.colors.onSurface }]}>{maxWeight ? maxWeight.toFixed(1) : '-'}</Text>
              </View>              
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface }]}>Pull Start:</Text>
                <Text style={[styles.measurementValue, { color: theme.colors.onSurface }]}>{pullStart ? pullStart.toFixed(1) : '-'}</Text>
              </View>
            </View> */}

            <View style={{ width: '100%', flex: 1 }}>
              <CartesianChart
                data={scaleInput.dataPoints}
                xKey="t"
                yKeys={["w"]}
                transformState={transformState}
                frame={{
                  lineWidth: 1,
                  lineColor: theme.colors.outline,
                }}
                xAxis={{
                  font: font,
                  labelColor: theme.colors.outline,
                  lineColor: theme.colors.outline,
                }}
                yAxis={[
                  {
                    yKeys: ["w"],
                    font: font,
                    tickCount: 10,
                    labelColor: theme.colors.outline,
                    lineColor: theme.colors.outline,
                    domain: [0, chartRange],
                  },
                ]}
              >
                {({ points, xScale, yScale }) => {
                  const currentPull = pullWeight > 0 ? [
                    vec(pullT0, 0),
                    vec(pullT0, pullWeight),
                    vec(scaleInput.dataPoints[scaleInput.dataPoints.length - 1].t, scaleInput.currentPull.wSum / scaleInput.currentPull.wCount),
                  ] : [];
                  const pastPulls = scaleInput.pastPulls.map((pull) => [
                    vec(pull.t0, 0),
                    vec(pull.t0, pull.wAvg),
                    vec(pull.t1, pull.wAvg),
                    vec(pull.t1, 0),
                  ]);
                  return (
                    <>
                      <Line
                        key="data"
                        points={points.w}
                        color={theme.colors.primary}
                        strokeWidth={1}
                      />
                      {pastPulls.map((pull) => (
                        <Points
                          key={pull[0].x}
                          points={pull.map((point) => vec(xScale(point.x), yScale(point.y)))}
                          mode="polygon"
                          color={ theme.colors.secondary }
                          style="stroke"
                          strokeWidth={2}
                        />
                      ))}
                      <Points
                        key="currentPull"
                        points={currentPull.map((point) => vec(xScale(point.x), yScale(point.y)))}
                        mode="polygon"
                        color={ theme.colors.secondary }
                        style="stroke"
                        strokeWidth={2}
                      />
                    </>
                  );
                }}
              </CartesianChart>

            </View>
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
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  controlButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: '30%',
    borderRadius: 8,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "bold",
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
    flex: 1,
  },
  measurementLabel: {
    fontSize: 24,
    fontWeight: "bold",
  },
  measurementValue: {
    fontSize: 30,
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