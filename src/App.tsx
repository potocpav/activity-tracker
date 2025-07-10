import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MainPage from "./MainPage";
import LiveView from "./LiveView";
import DeviceModal from "./DeviceConnectionModal";
import useBLE from "./useBLE";

type MeasurementOption = {
  id: string;
  title: string;
  description: string;
};

const App = () => {
  const [currentView, setCurrentView] = useState<'main' | 'live-view'>('main');
  const [selectedOption, setSelectedOption] = useState<MeasurementOption | null>(null);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

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
    weight,
  } = useBLE();

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

  const handleSelectOption = (option: MeasurementOption) => {
    setSelectedOption(option);
    if (option.id === 'live-view') {
      setCurrentView('live-view');
    }
  };

  const handleBack = () => {
    setCurrentView('main');
    setSelectedOption(null);
  };

  return (
    <SafeAreaView style={styles.container}>
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

      {currentView === 'live-view' ? (
        <LiveView 
          onBack={handleBack}
          connectedDevice={connectedDevice}
          tareScale={tareScale}
          startMeasurement={startMeasurement}
          stopMeasurement={stopMeasurement}
          weight={weight}
        />
      ) : (
        <MainPage onSelectOption={handleSelectOption} />
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
});

export default App;
