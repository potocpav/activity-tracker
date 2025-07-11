import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";

type LiveViewProps = {
  navigation: any;
  route: any;
};

const LiveView: React.FC<LiveViewProps> = ({navigation, route}) => {
  const [maxWeight, setMaxWeight] = useState<number | null>(null);
  const bleDevice = route.params.bleDevice;
  // // Update max weight whenever weight changes
  // React.useEffect(() => {
  //   if (weight !== null) {
  //     setMaxWeight(prevMax => prevMax === null ? weight : Math.max(prevMax, weight));
  //   }
  // }, [weight]);

  const tareScaleWrapper = () => {
    if (bleDevice.connectedDevice) {
      bleDevice.tareScale(bleDevice.connectedDevice);
    }
  }

  const startMeasurementWrapper = () => {
    if (bleDevice.connectedDevice) {
      bleDevice.startMeasurement(bleDevice.connectedDevice);
    }
  }

  const stopMeasurementWrapper = () => {
    if (bleDevice.connectedDevice) {
      bleDevice.stopMeasurement(bleDevice.connectedDevice);
    }
  }

  const resetMaxWeight = () => {
    setMaxWeight(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      {bleDevice.connectedDevice ? (
        <>
          {/* Control Buttons Section */}
          <View style={styles.controlSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={startMeasurementWrapper} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopMeasurementWrapper} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={tareScaleWrapper} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Tare</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Weight and Time Display Section */}
          <View style={styles.weightSection}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={styles.measurementLabel}>Weight</Text>
                <Text style={styles.measurementValue}>
                  {bleDevice.weight !== null ? bleDevice.weight.toFixed(1) : '-'}
                </Text>
                <Text style={styles.measurementUnit}>kg</Text>
              </View>
              <View style={styles.measurementColumn}>
                <Text style={styles.measurementLabel}>Time</Text>
                <Text style={styles.measurementValue}>
                  {bleDevice.time !== null ? bleDevice.time.toFixed(1) : '-'}
                </Text>
                <Text style={styles.measurementUnit}>s</Text>
              </View>
            </View>
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={styles.measurementLabel}>Max Weight</Text>
                <Text style={styles.measurementValue}>
                  {bleDevice.maxWeight !== null ? bleDevice.maxWeight.toFixed(1) : '-'}
                </Text>
                <Text style={styles.measurementUnit}>kg</Text>
                {
                  <TouchableOpacity onPress={resetMaxWeight} style={styles.resetButton}>
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                }
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.disconnectedSection}>
          <Text style={styles.disconnectedText}>
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
    backgroundColor: "#f2f2f2",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#FF6060',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSpacer: {
    width: 60,
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
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    width: '30%',
    borderRadius: 8,
  },
  controlButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  weightSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
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
    color: "#333333",
    marginBottom: 5,
  },
  measurementValue: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#FF6060",
  },
  measurementUnit: {
    fontSize: 20,
    color: "#666666",
    marginTop: 5,
  },
  resetButton: {
    marginTop: 10,
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 40,
    width: '80%',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  disconnectedSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#ffffff',
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
    color: "#FF5722",
    textAlign: "center",
  },
});

export default LiveView; 