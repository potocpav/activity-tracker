import { PermissionsAndroid, Platform } from "react-native";
import { base64 } from "./base64";
import * as ExpoDevice from "expo-device";

import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

const DATA_SERVICE_UUID = "7e4e1701-1ea6-40c9-9dcc-13d34ffead57";
const CONTROL_CHARACTERISTIC_UUID = "7e4e1703-1ea6-40c9-9dcc-13d34ffead57";
const DATA_CHARACTERISTIC_UUID = "7e4e1702-1ea6-40c9-9dcc-13d34ffead57";

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

const connectToDevice = async (device: Device) => {
  try {
    const deviceConnection = await bleManager.connectToDevice(device.id);
    await deviceConnection.discoverAllServicesAndCharacteristics();
    bleManager.stopDeviceScan();
    return deviceConnection;
  } catch (e) {
    console.log("FAILED TO CONNECT", e);
    throw e;
  }
};

const disconnectDevice = async (device: Device) => {
  await device.cancelConnection();
  const isConnected = await device.isConnected();
  if (isConnected) {
    console.log("Device is still connected.");
  } else {
    console.log("Device is disconnected.");
  }
};

const scanForPeripherals = (onDeviceFound: (device: Device) => void) => {
  bleManager.startDeviceScan(null, null, (error, device) => {
    if (error) {
      console.log(error);
    }

    if (
      device &&
      device.localName?.startsWith("Progressor")
    ) {
      onDeviceFound(device);
    }
  });
};

const stopDeviceScan = () => {
  bleManager.stopDeviceScan();
};

/**
 * Extracts data from Tindeq Progressor data packet
 */
const extractData = (
  error: BleError | null,
  characteristic: Characteristic | null
): { w: number, t: number }[] | null => {
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
    const dataPoints: { w: number, t: number }[] = [];

    for (let i = 0; i < length / 8; i++) {
      const weight = Math.abs(view.getFloat32(2 + i * 8, true));
      const time = view.getInt32(2 + i * 8 + 4, true) / 1e6;
      dataPoints.push({ w: weight, t: time });
    }
    return dataPoints;
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
  connectToDevice,
  disconnectDevice,
  scanForPeripherals,
  stopDeviceScan,
  extractData,
  tareScale,
  startMeasurement,
  stopMeasurement,
  shutdown,
  sampleBatteryVoltage,
  startStreamingData
}; 