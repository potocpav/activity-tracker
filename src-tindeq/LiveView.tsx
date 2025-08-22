import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import StatusBar from "./StatusBar";
import useStore from "./Store";
import { CartesianChart, Line } from "victory-native";
import { matchFont } from "@shopify/react-native-skia";
import { getTheme } from "./Theme";

const fontFamily = Platform.select({ default: "sans-serif" });
const font = matchFont({ fontFamily: fontFamily });

type LiveViewProps = {
  navigation: any;
  route: any;
};

const LiveView: React.FC<LiveViewProps> = ({ navigation }) => {
  const theme = getTheme();
  const isConnected = useStore((state: any) => state.isConnected);
  const dataPoints: { w: number, t: number }[] = useStore((state: any) => state.dataPoints);
  const startMeasurement = useStore((state: any) => state.startMeasurement);
  const stopMeasurement = useStore((state: any) => state.stopMeasurement);
  const tareScale = useStore((state: any) => state.tareScale);

  const weight = dataPoints[dataPoints.length - 1]?.w;
  const time = dataPoints[dataPoints.length - 1]?.t;
  const maxWeight = Math.max(...dataPoints.map((point) => point.w));


  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <StatusBar navigation={navigation} />

      {isConnected ? (
        <>
          {/* Control Buttons Section */}
          <View style={styles.controlSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={startMeasurement} style={[styles.controlButton, { backgroundColor: theme.colors.primary }]}>
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
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={[styles.measurementLabel, { color: theme.colors.onSurface }]}>Max Weight:</Text>
                <Text style={[styles.measurementValue, { color: theme.colors.onSurface }]}>{maxWeight ? maxWeight.toFixed(1) : '-'}</Text>
              </View>
              <View style={styles.measurementColumn}>
              </View>
            </View>
            <View style={{ width: '100%', flex: 1 }}>
              <CartesianChart
                data={dataPoints}
                xKey="t"
                yKeys={["w"]}
                frame={{
                  lineWidth: 1,
                }}
                xAxis={{
                  font: font,
                }}
                yAxis={[
                  {
                    yKeys: ["w"],
                    font: font,
                    tickCount: 10,
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
                {({ points }) => (
                  //👇 pass a PointsArray to the Line component, as well as options.
                  <>
                    <Line
                      points={points.w}
                      color={theme.colors.onSurface}
                      strokeWidth={2}
                    />
                  </>
                )}
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
    </View>
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

export default LiveView; 