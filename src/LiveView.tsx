import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";
import StatusBar from "./StatusBar";
import useStore from "./Store";
import { CartesianChart, Line } from "victory-native";

type LiveViewProps = {
  navigation: any;
  route: any;
};

const data = Array.from({ length: 31 }, (_, i) => ({
 x: i,
 y: 40 + 30 * Math.random(),
}));

const LiveView: React.FC<LiveViewProps> = ({navigation, route}) => {
  const connectedDevice = useStore((state: any) => state.connectedDevice);
  const isConnected = useStore((state: any) => state.isConnected);
  const weight = useStore((state: any) => state.weight);
  const time = useStore((state: any) => state.time);
  const startMeasurement = useStore((state: any) => state.startMeasurement);
  const stopMeasurement = useStore((state: any) => state.stopMeasurement);
  const tareScale = useStore((state: any) => state.tareScale);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar navigation={navigation}/>

      {isConnected ? (
        <>
          {/* Control Buttons Section */}
          <View style={styles.controlSection}>
            <View style={styles.buttonRow}>
              <TouchableOpacity onPress={startMeasurement} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Start</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={stopMeasurement} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Stop</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={tareScale} style={styles.controlButton}>
                <Text style={styles.controlButtonText}>Tare</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Weight and Time Display Section */}
          <View style={styles.weightSection}>
            <View style={styles.measurementRow}>
              <View style={styles.measurementColumn}>
                <Text style={styles.measurementLabel}>Weight</Text>
                <Text 
                  style={styles.measurementValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {weight !== null ? weight.toFixed(1) : '-'}
                </Text>
              </View>
              <View style={styles.measurementColumn}>
                <Text style={styles.measurementLabel}>Time</Text>
                <Text 
                  style={styles.measurementValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit={true}
                >
                  {time !== null ? time.toFixed(1) : '-'}
                </Text>
              </View>
            </View>
            <View style={{ width: '100%', flex: 1 }}>
              <CartesianChart 
                data={data} 
                xKey="x" 
                yKeys={["y"]}
                >              
                {({ points }) => (
                  //👇 pass a PointsArray to the Line component, as well as options.
                  <Line
                    points={points.y}
                    color="red"
                    strokeWidth={3}
                  />
                )}
              </CartesianChart>
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
    // justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: '#ffffff',
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