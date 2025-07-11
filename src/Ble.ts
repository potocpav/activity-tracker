/* eslint-disable no-bitwise */
import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { base64 } from "./base64";
import { create } from "zustand";


import * as ExpoDevice from "expo-device";

// import base64 from "react-native-base64";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

const DATA_SERVICE_UUID =           "7e4e1701-1ea6-40c9-9dcc-13d34ffead57";
const DATA_CHARACTERISTIC_UUID =    "7e4e1702-1ea6-40c9-9dcc-13d34ffead57";
const CONTROL_CHARACTERISTIC_UUID = "7e4e1703-1ea6-40c9-9dcc-13d34ffead57";

const bleManager = new BleManager();

const requestAndroid31Permissions = async () => {
    const bluetoothScanPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    const bluetoothConnectPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );
    const fineLocationPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: "Location Permission",
        message: "Bluetooth Low Energy requires Location",
        buttonPositive: "OK",
      }
    );

    return (
        bluetoothScanPermission === "granted" &&
        bluetoothConnectPermission === "granted" &&
        fineLocationPermission === "granted"
    );
};

const requestPermissions = async () => {
    if (Platform.OS === "android") {
        if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission",
                    message: "Bluetooth Low Energy requires Location",
                    buttonPositive: "OK",
                }
            )
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            const isAndroid31PermissionsGranted =
                await requestAndroid31Permissions();

            return isAndroid31PermissionsGranted;
        }
    } else {
        return true;
    }
  }

  const sendCommand = async (device: Device, command: number) => {
    await device.writeCharacteristicWithoutResponseForService(
      DATA_SERVICE_UUID,
      CONTROL_CHARACTERISTIC_UUID,
      base64.stringify([command]),
    );
  };

const useBle = create<any>((set, get) => {
    return {
      allDevices: [],
      connectedDevice: null,
      subscription: null,
      weight: null,
      time: null,

      requestPermissions: requestPermissions,

      connectToDevice: async (device: Device) => {
        try {
            const deviceConnection = await bleManager.connectToDevice(device.id);
            set({connectedDevice: deviceConnection});
            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
        } catch (e) {
            console.log("FAILED TO CONNECT", e);
        }
      },

      disconnectDevice: async () => {
        const connectedDevice: any = get().connectedDevice;
        if (connectedDevice) {
            await connectedDevice.cancelConnection();
            const isConnected = await connectedDevice.isConnected();
            if (isConnected) {
                console.log("Device is still connected.");
            } else {
                set({connectedDevice: null});
            }
            
        }
      },

      scanForPeripherals: () => {
        bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.log(error);
          }
    
          if (
            device &&
            device.localName?.startsWith("Progressor")
          ) {
            const isDuplicteDevice = (devices: Device[], nextDevice: Device) => {
                return devices.findIndex((device) => nextDevice.id === device.id) > -1;
              };
            set((state: any) => {
                if (!isDuplicteDevice(state.allDevices, device)) {
                    return {allDevices: [...state.allDevices, device]};
                } else {
                    return {};
                }
            });
          }
        });
      },
    
      onDataUpdate: (
        error: BleError | null,
        characteristic: Characteristic | null
      ) => {
        if (error) {
          console.log(error);
          return;
        } else if (!characteristic?.value) {
          console.log("No Data was received");
          return;
        }
        // Convert base64 to byte array
        const bytes = base64.parse(characteristic.value);
        const dataType = bytes[0];
    
        if (dataType === 0x00) {
          console.log("Battery voltage response received");
        } else if (dataType === 0x01) {
          const length = bytes[1];
    
          const view = new DataView(bytes.buffer);
          const weight = Math.abs(view.getFloat32(length + 2 - 8, true));
          const time = view.getInt32(length + 2 - 4, true) / 1e6;
        
          set({weight: weight, time: time});
        } else if (dataType === 0x02) {
          console.log("Low power warning received");
        } else {
          console.log("Unknown data type received:", dataType);
        }
      },
    
      tareScale: async (device: Device) => {
        await sendCommand(device, 0x64);
      },
    
      startMeasurement: async () => {
        const device = get().connectedDevice;
        if (device) {
            await sendCommand(device, 0x65);
            get().startStreamingData(device);
        } else {
            console.log("No device connected");
        }
      },
    
      stopMeasurement: async () => {
        const device = get().connectedDevice;
        if (device) {
            await sendCommand(device, 0x66);
            get().subscription?.remove();
            set({subscription: null, weight: null, time: null});
        } else {
            console.log("No device connected");
        }
      },
    
      shutdown: async () => {
        const device = get().connectedDevice;
        if (device) {
            await sendCommand(device, 0x6e);
            await get().disconnectDevice();
        } else {
            console.log("No device connected");
        }
      },
    
      sampleBatteryVoltage: async () => {
        const device = get().connectedDevice;
        if (device) {
            console.log("Sampling battery voltage");
            await sendCommand(device, 0x6f);
        } else {
            console.log("No device connected");
        }
      },
    
      startStreamingData: () => {
        const device = get().connectedDevice;
        if (device) {
          const subscription = device.monitorCharacteristicForService(
            DATA_SERVICE_UUID,
            DATA_CHARACTERISTIC_UUID,
            get().onDataUpdate
          );
          set({subscription: subscription});
        } else {
          console.log("No Device Connected");
        }
      },

    };
});

export default useBle;
