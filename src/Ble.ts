import { PermissionsAndroid, Platform } from "react-native";
import { base64 } from "./base64";
import * as ExpoDevice from "expo-device";

import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

const DATA_SERVICE_UUID =           "7e4e1701-1ea6-40c9-9dcc-13d34ffead57";
const CONTROL_CHARACTERISTIC_UUID = "7e4e1703-1ea6-40c9-9dcc-13d34ffead57";
const DATA_CHARACTERISTIC_UUID =    "7e4e1702-1ea6-40c9-9dcc-13d34ffead57";

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

/**
 * Extracts data from Tindeq Progressor data packet
 */
const extractData = (
  error: BleError | null,
  characteristic: Characteristic | null
) : {weight: number, time: number} | null => {
  if (error) {
    console.log(error);
    return null;
  } else if (!characteristic?.value) {
    console.log("No Data was received");
    return null;
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
  
    return {weight: weight, time: time};
  } else if (dataType === 0x02) {
    console.log("Low power warning received");
  } else {
    console.log("Unknown data type received:", dataType);
  }
  return null;
};

const tareScale = async (device: Device) => {
  await sendCommand(device, 0x64);
};

const startMeasurement = async (device: Device) => {
  await sendCommand(device, 0x65);
};

const stopMeasurement = async (device: Device) => {
  await sendCommand(device, 0x66);
};

const shutdown = async (device: Device) => {
  await sendCommand(device, 0x6e);
};

const sampleBatteryVoltage = async (device: Device) => {
  await sendCommand(device, 0x6f);
};

const startStreamingData = 
  (device: Device, onDataUpdate: 
    (error: BleError | null, 
      characteristic: Characteristic | null) => void) => {
  const subscription = device.monitorCharacteristicForService(
    DATA_SERVICE_UUID,
    DATA_CHARACTERISTIC_UUID,
    onDataUpdate
  );
  return subscription;
};

export { 
  requestAndroid31Permissions, 
  requestPermissions, 
  sendCommand,
  extractData,
  tareScale,
  startMeasurement,
  stopMeasurement,
  shutdown,
  sampleBatteryVoltage,
  startStreamingData
}; 