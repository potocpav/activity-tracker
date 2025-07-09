/* eslint-disable no-bitwise */
import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { base64 } from "./base64";

import * as ExpoDevice from "expo-device";

// import base64 from "react-native-base64";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";

const DATA_SERVICE_UUID =           "7e4e1701-1ea6-40c9-9dcc-13d34ffead57";
const DATA_CHARACTERISTIC_UUID =    "7e4e1702-1ea6-40c9-9dcc-13d34ffead57";
const CONTROL_CHARACTERISTIC_UUID = "7e4e1703-1ea6-40c9-9dcc-13d34ffead57";

const bleManager = new BleManager();

function useBLE() {
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [weight, setWeight] = useState<number | null>(null);

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
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        const isAndroid31PermissionsGranted =
          await requestAndroid31Permissions();

        return isAndroid31PermissionsGranted;
      }
    } else {
      return true;
    }
  };

  const connectToDevice = async (device: Device) => {
    try {
      const deviceConnection = await bleManager.connectToDevice(device.id);
      setConnectedDevice(deviceConnection);
      await deviceConnection.discoverAllServicesAndCharacteristics();
      bleManager.stopDeviceScan();

      // startStreamingData(deviceConnection);
    } catch (e) {
      console.log("FAILED TO CONNECT", e);
    }
  };

  const disconnectDevice = async () => {
    if (connectedDevice) {
      await connectedDevice.cancelConnection();
      setConnectedDevice(null);
    }
  };

  const isDuplicteDevice = (devices: Device[], nextDevice: Device) =>
    devices.findIndex((device) => nextDevice.id === device.id) > -1;

  const scanForPeripherals = () =>
    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.log(error);
      }

      if (
        device &&
        (device.localName !== null)
      ) {
        setAllDevices((prevState: Device[]) => {
          if (!isDuplicteDevice(prevState, device)) {
            return [...prevState, device];
          }
          return prevState;
        });
      }
    });

  const onDataUpdate = (
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
      const weight = view.getFloat32(length + 2 - 8, true);
      const time = view.getInt32(length + 2 - 4, true);


      console.log("Weight measurement received. Length: " + length + ", Weight: " + weight + ", Time: " + time + ", Bytes: " + bytes.length);
      setWeight(weight);
    } else if (dataType === 0x02) {
      console.log("Low power warning received");
    } else {
      console.log("Unknown data type received:", dataType);
    }
    // console.log("Raw bytes:", bytes);

    // let color = "white";
    // if (colorCode === "B") {
    //   color = "blue";
    // } else if (colorCode === "R") {
    //   color = "red";
    // } else if (colorCode === "G") {
    //   color = "green";
    // }

    // setColor(color);
  };

  const sendCommand = async (device: Device, command: number) => {
    await device.writeCharacteristicWithoutResponseForService(
      DATA_SERVICE_UUID,
      CONTROL_CHARACTERISTIC_UUID,
      base64.stringify([command]),
    );
  }

  const tareScale = async (device: Device) => {
    console.log("Taring scale");
    await sendCommand(device, 0x64);
  };

  const startMeasurement = async (device: Device) => {
    console.log("Starting measurement");
    await sendCommand(device, 0x65);
    startStreamingData(device);
  };

  const stopMeasurement = async (device: Device) => {
    console.log("Stopping measurement");
    await sendCommand(device, 0x66);
    subscription?.remove();
    setSubscription(null);
    setWeight(null);
  };

  const shutdown = async (device: Device) => {
    console.log("Shutting down");
    await sendCommand(device, 0x6e);
    await disconnectDevice();
  };

  const sampleBatteryVoltage = async (device: Device) => {
    console.log("Sampling battery voltage");
    await sendCommand(device, 0x6f);
  };

  const startStreamingData = (device: Device) => {
    if (device) {
      const subscription = device.monitorCharacteristicForService(
        DATA_SERVICE_UUID,
        DATA_CHARACTERISTIC_UUID,
        onDataUpdate
      );
      setSubscription(subscription);
    } else {
      console.log("No Device Connected");
    }
  };

  return {
    connectToDevice,
    disconnectDevice,
    allDevices,
    connectedDevice,
    requestPermissions,
    scanForPeripherals,
    startStreamingData,
    tareScale,
    startMeasurement,
    stopMeasurement,
    shutdown,
    sampleBatteryVoltage,
    weight,
  };
}

export default useBLE;
