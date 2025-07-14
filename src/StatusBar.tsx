import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from 'react-native-paper';
import useStore from "./Store";

type StatusBarProps = {
  navigation: any;
};


const StatusBar: React.FC<StatusBarProps> = ({navigation}) => {
    const theme = useTheme();
    const connectedDevice = useStore((state: any) => state.connectedDevice);
    const isConnected = useStore((state: any) => state.isConnected);
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
    <View style={[styles.statusBar, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
      <View style={styles.statusInfo}>
        <View style={[styles.statusIndicator, { backgroundColor: isConnected ? theme.colors.primary : theme.colors.error }]} />
        <Text style={[styles.statusText, { color: theme.colors.onSurface }]}>
          {isConnected ? `Connected: ${connectedDevice.name}` : 'Disconnected'}
        </Text>
      </View>
      <TouchableOpacity 
        onPress={isConnected ? disconnectDevice : openModal} 
        style={
            [styles.statusButton, 
            { backgroundColor: isConnected ? theme.colors.error : theme.colors.primary }
        ]}
      >
        <Text style={[styles.statusButtonText, { color: isConnected ? theme.colors.onError : theme.colors.onPrimary }]}>
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
    borderBottomWidth: 1,
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
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default StatusBar; 