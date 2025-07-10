import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DeviceModal from "./DeviceConnectionModal";
import useBLE from "./useBLE";

const App = () => {
  const {
    allDevices,
    connectedDevice,
    connectToDevice,
    requestPermissions,
    scanForPeripherals,
    disconnectDevice,
    tareScale,
    startMeasurement,
    stopMeasurement,
    shutdown,
    sampleBatteryVoltage,
    weight,
  } = useBLE();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  const tareScaleWrapper = () => {
    if (connectedDevice) {
      tareScale(connectedDevice);
    }
  }

  const startMeasurementWrapper = () => {
    if (connectedDevice) {
      startMeasurement(connectedDevice);
    }
  }

  const stopMeasurementWrapper = () => {
    if (connectedDevice) {
      stopMeasurement(connectedDevice);
    }
  }

  const shutdownWrapper = () => {
    if (connectedDevice) {
      shutdown(connectedDevice);
    }
  }

  const sampleBatteryVoltageWrapper = () => {
    if (connectedDevice) {
      sampleBatteryVoltage(connectedDevice);
    }
  }
  
  

  return (
    <SafeAreaView style={[styles.container]}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <View style={styles.statusInfo}>
          <View style={[styles.statusIndicator, { backgroundColor: connectedDevice ? '#4CAF50' : '#FF5722' }]} />
          <Text style={styles.statusText}>
            {connectedDevice ? `Connected: ${connectedDevice.name}` : 'Disconnected'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={connectedDevice ? disconnectDevice : openModal} 
          style={[styles.statusButton, { backgroundColor: connectedDevice ? '#FF5722' : '#4CAF50' }]}
        >
          <Text style={styles.statusButtonText}>
            {connectedDevice ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
      
      {connectedDevice ? (
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
          
          {/* Weight Display Section */}
          <View style={styles.weightSection}>
            <Text style={styles.weightLabel}>Weight</Text>
            <Text style={styles.weightValue}>
              {weight !== null ? Math.max(0, weight).toFixed(1) : '-'}
            </Text>
            <Text style={styles.weightUnit}>kg</Text>
          </View>
        </>
      ) : (
        <View style={styles.disconnectedSection}>
          <Text style={styles.disconnectedText}>
            Please connect the Tindeq Progressor
          </Text>
        </View>
      )}
      
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  weightLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  weightValue: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#FF6060",
  },
  weightUnit: {
    fontSize: 20,
    color: "#666666",
    marginTop: 5,
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

export default App;
