/* eslint-disable no-bitwise */
import { create } from "zustand";
import { requestPermissions, sendCommand, extractData, tareScale, shutdown, stopMeasurement, sampleBatteryVoltage, startStreamingData } from "./Ble";
import {
  BleError,
  BleManager,
  Characteristic,
  Device,
} from "react-native-ble-plx";

const bleManager = new BleManager();

const useStore = create<any>((set, get) => {
    return {
      allDevices: [],
      isConnected: false,
      connectedDevice: null,
      subscription: null,
      weight: null,
      time: null,

      requestPermissions: requestPermissions,


      connectToDevice: async (device: Device) => {
        try {
            const deviceConnection = await bleManager.connectToDevice(device.id);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            set({connectedDevice: deviceConnection, isConnected: true});
            deviceConnection.onDisconnected(async () => {
                console.log("Device is disconnected asynchronously.");
                set({isConnected: false});
            });
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
                console.log("Device is disconnected.");
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
        const data = extractData(error, characteristic);
        if (data) {
          set({weight: data.weight, time: data.time});
        }
      },

      withDevice: (callback: (device: Device) => void) => {
        const device = get().connectedDevice;
        if (device) {
            callback(device);
        } else {
            console.log("No device connected");
        }
      },

      tareScale: async () => {
        get().withDevice(async (device: Device) => {
            await tareScale(device);
        });
      },

      startMeasurement: async () => {
        get().withDevice(async (device: Device) => {
            await sendCommand(device, 0x65);
            get().startStreamingData(device);
        });
      },
    
      stopMeasurement: async () => {
        get().withDevice(async (device: Device) => {
            await stopMeasurement(device);
            get().subscription?.remove();
            set({subscription: null, weight: null, time: null});
        });
      },
    
      shutdown: async () => {
        get().withDevice(async (device: Device) => {
            await shutdown(device);
            await get().disconnectDevice();
        });
      },
    
      sampleBatteryVoltage: async () => {
        get().withDevice(async (device: Device) => {
            console.log("Sampling battery voltage");
            await sampleBatteryVoltage(device);
        });
      },
    
      startStreamingData: () => {
        get().withDevice((device: Device) => {
          const subscription = startStreamingData(device, get().onDataUpdate);
          set({subscription: subscription});
        });
      },

    };
});

export default useStore; 