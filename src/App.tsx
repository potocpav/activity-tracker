import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainPage from "./MainPage";
import LiveView from "./LiveView";
import DeviceModal from "./DeviceConnectionModal";
import useBLE from "./useBLE";


const App = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const bleDevice = useBLE();

  const scanForDevices = async () => {
    const isPermissionsEnabled = await bleDevice.requestPermissions();
    if (isPermissionsEnabled) {
      bleDevice.scanForPeripherals();
    }
  };

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  const Stack = createNativeStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
        {/* Status Bar */}
        <View style={styles.statusBar}>
          <View style={styles.statusInfo}>
            <View style={[styles.statusIndicator, { backgroundColor: bleDevice.connectedDevice ? '#4CAF50' : '#FF5722' }]} />
            <Text style={styles.statusText}>
              {bleDevice.connectedDevice ? `Connected: ${bleDevice.connectedDevice.name}` : 'Disconnected'}
            </Text>
          </View>
          <TouchableOpacity 
            onPress={bleDevice.connectedDevice ? bleDevice.disconnectDevice : openModal} 
            style={[styles.statusButton, { backgroundColor: bleDevice.connectedDevice ? '#FF5722' : '#4CAF50' }]}
          >
            <Text style={styles.statusButtonText}>
              {bleDevice.connectedDevice ? 'Disconnect' : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>
      
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Main Page"
              component={MainPage}
              options={{title: "Test Page Main"}}
            />
            <Stack.Screen 
              name="Live View" 
              component={LiveView} 
              options={{title: "Live View"}}
              initialParams={{bleDevice: bleDevice}}
              />
          </Stack.Navigator>
        </NavigationContainer>

        <DeviceModal
          closeModal={hideModal}
          visible={isModalVisible}
          connectToPeripheral={bleDevice.connectToDevice}
          devices={bleDevice.allDevices}
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
