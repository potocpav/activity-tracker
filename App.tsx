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
      <View style={styles.heartRateTitleWrapper}>
        {connectedDevice ? (
          <>
            <Text style={styles.heartRateTitleText}>Connected</Text>
            <Text style={styles.heartRateTitleText}>Device: {connectedDevice?.name}</Text>
            <TouchableOpacity onPress={tareScaleWrapper} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Tare</Text>
            </TouchableOpacity>            
            <TouchableOpacity onPress={startMeasurementWrapper} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Start Measurement</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopMeasurementWrapper} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Stop Measurement</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={shutdownWrapper} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Shutdown</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={sampleBatteryVoltageWrapper} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Sample Battery Voltage</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={disconnectDevice} style={styles.ctaButton}>
              <Text style={styles.ctaButtonText}>Disconnect</Text>
            </TouchableOpacity>
            <Text style={styles.heartRateText}>Weight: {weight !== null ? Math.max(0, weight).toFixed(1) + ' kg' : '-'}</Text>
          </>
        ) : (
          <Text style={styles.heartRateTitleText}>
            Please connect the Tindeq Progressor
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={openModal} style={styles.ctaButton}>
        <Text style={styles.ctaButtonText}>Connect</Text>
      </TouchableOpacity>
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
  heartRateTitleWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heartRateTitleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 20,
    color: "black",
  },
  heartRateText: {
    fontSize: 25,
    marginTop: 15,
  },
  ctaButton: {
    backgroundColor: "#FF6060",
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginHorizontal: 20,
  },
});

export default App;
