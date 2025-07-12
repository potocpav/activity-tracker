import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import useStore from "./Store";

type StatusBarProps = {
  navigation: any;
};


const StatusBar: React.FC<StatusBarProps> = ({navigation}) => {
    const connectedDevice = useStore((state: any) => state.connectedDevice);
    const isConnected = useStore((state: any) => state.isConnected);
    const allDevices = useStore((state: any) => state.allDevices);
    const requestPermissions = useStore((state: any) => state.requestPermissions);
    const scanForPeripherals = useStore((state: any) => state.scanForPeripherals);
    const disconnectDevice = useStore((state: any) => state.disconnectDevice);

    const scanForDevices = async () => {
        const isPermissionsEnabled = await requestPermissions();
        if (isPermissionsEnabled) {
            scanForPeripherals();
        }
    };
    
    
    const openModal = async () => {
        scanForDevices();
        navigation.navigate('ConnectDevice');
    };

    return (
    <View style={styles.statusBar}>
      <View style={styles.statusInfo}>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? '#4CAF50' : '#FF5722' }]} />
        <Text style={styles.statusText}>
          {isConnected ? `Connected: ${connectedDevice.name}` : 'Disconnected'}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={isConnected ? disconnectDevice : openModal} 
        style={
            [styles.statusButton, 
            { backgroundColor: isConnected ? '#FF5722' : '#4CAF50' }
        ]}
      >
        <Text style={styles.statusButtonText}>
          {isConnected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default StatusBar; 