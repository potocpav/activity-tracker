import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import useStore from "../Model/Store";
import { CartesianChart, Line } from "victory-native";
import { matchFont, Points, vec } from "@shopify/react-native-skia";
import { getTheme, getThemeVariant } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityType, ScaleInput } from "../Model/StoreTypes";
import { Button } from "react-native-paper";
import AntDesign from '@expo/vector-icons/AntDesign';
import { disconnectDevice, requestPermissions, scanForPeripherals } from "../Model/Ble";

const fontFamily = Platform.select({ default: "sans-serif" });
const font = matchFont({ fontFamily: fontFamily });

type BleScaleInputProps = {
  navigation: any;
  route: any;
};



// return (
//   <View style={[styles.statusBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
//     <View style={styles.statusInfo}>
//       <View style={[styles.statusIndicator, { backgroundColor: isConnected ? theme.colors.primary : theme.colors.error }]} />
//       <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
//         {isConnected ? `Connected: ${connectedDevice.name}` : 'Disconnected'}
//       </Text>
//     </View>
//     <TouchableOpacity
//       onPress={isConnected ? disconnectDevice : openModal}
//       style={
//         [styles.statusButton,
//         { backgroundColor: isConnected ? theme.colors.error : theme.colors.primary }
//         ]}
//     >
//       <Text style={[styles.statusButtonText, { color: isConnected ? theme.colors.onError : theme.colors.onPrimary }]}>
//         {isConnected ? 'Disconnect' : 'Connect'}
//       </Text>
//     </TouchableOpacity>
//   </View>
// );


const BleScaleInput: React.FC<BleScaleInputProps> = ({ route, navigation }) => {
  const { activityName } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity.color);
  const themeVariant = getThemeVariant();

  const isConnected = useStore((state: any) => state.isConnected);
  const scaleInput: ScaleInput = useStore((state: any) => state.scaleInput);
  const pushDataPoints = useStore((state: any) => state.pushDataPoints);
  const startMeasurement = useStore((state: any) => state.startMeasurement);
  const stopMeasurement = useStore((state: any) => state.stopMeasurement);
  const tareScale = useStore((state: any) => state.tareScale);

  const connectedDevice = useStore((state: any) => state.connectedDevice);
  const requestPermissions = useStore((state: any) => state.requestPermissions);
  const scanForPeripherals = useStore((state: any) => state.scanForPeripherals);
  const disconnectDevice = useStore((state: any) => state.disconnectDevice);

  const weight = scaleInput.dataPoints[scaleInput.dataPoints.length - 1]?.w;
  const time = scaleInput.dataPoints[scaleInput.dataPoints.length - 1]?.t;

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

  const onDataUpdate: (data: { w: number, t: number }[]) => void = (data: { w: number, t: number }[]) => {
    pushDataPoints(data);
  };

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
              <TouchableOpacity onPress={() => startMeasurement(onDataUpdate)} style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}>
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
                  {weight ? weight.toFixed(1) : '-'}
                </Text>
              </View>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface }]}>Time:</Text>
                <Text
                  style={[styles.measurementValue, { color: theme.colors.onSurface }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {time ? time.toFixed(1) : '-'}
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
                  },
                  // {
                  //   yKeys: ["w"],
                  //   tickValues: [0, Math.round(maxWeight * 10) / 10],
                  //   axisSide: "right",
                  //   font: font,
                  //   tickCount: 10,
                  // }
                ]}
              >
                {({ points, xScale, yScale }) => {
                  const currentPull = scaleInput.currentPull.active ? [
                    vec(scaleInput.currentPull.t0, 0),
                    vec(scaleInput.currentPull.t0, scaleInput.currentPull.wSum / scaleInput.currentPull.wCount),
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
                        points={points.w}
                        color={theme.colors.primary}
                        strokeWidth={2}
                      />
                      {pastPulls.map((pull) => (
                        <Points
                          key={pull[0].x}
                          points={pull.map((point) => vec(xScale(point.x), yScale(point.y)))}
                          mode="polygon"
                          color={ theme.colors.secondary }
                          style="stroke"
                          strokeWidth={4}
                        />
                      ))}
                      <Points
                        points={currentPull.map((point) => vec(xScale(point.x), yScale(point.y)))}
                        mode="polygon"
                        color={ theme.colors.secondary }
                        style="stroke"
                        strokeWidth={4}
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
    marginHorizontal: 20,
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