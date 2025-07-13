/* eslint-disable no-bitwise */
import { create } from "zustand";
import { 
  requestPermissions, 
  connectToDevice, 
  disconnectDevice, 
  scanForPeripherals,
  extractData, 
  tareScale, 
  shutdown, 
  stopMeasurement as stopMeasurementCommand, 
  sampleBatteryVoltage, 
  startStreamingData,
  startMeasurement as startMeasurementCommand
} from "./Ble";

import {
  BleError,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import { exampleGoals } from "./ExampleData";

export type Unit = string | SubUnit[];

export type SubUnit = {
    name: string;
    symbol: string;
};

export type Tag = string;

export type DataPoint = {
    time: Date;
    value: any;
    tags: Tag[];
};

export type GoalType = {
  id: string;
  name: string;
  description: string;
  unit: Unit;
  dataPoints: DataPoint[];
};

export type State = {
  allDevices: Device[];
  isConnected: boolean;
  connectedDevice: Device | null;
  subscription: Subscription | null;

  dataPoints: {w: number, t: number}[];

  goals: GoalType[];

  requestPermissions: any;
  connectToDevice: any;
  disconnectDevice: any;
  scanForPeripherals: any;
  onDataUpdate: any;
  withDevice: any;
  tareScale: any;
  startMeasurement: any;
  stopMeasurement: any;
  shutdown: any;
  sampleBatteryVoltage: any;
  startStreamingData: any;
};

const useStore = create<State>((set, get) => {
    return {
      // Bluetooth device related state
      allDevices: [],
      isConnected: false,
      connectedDevice: null,
      subscription: null,
      
      // Measurement related state
      dataPoints: [],

      // Goals related state
      goals: exampleGoals,

      requestPermissions: requestPermissions,

      connectToDevice: async (device: Device) => {
        try {
            const deviceConnection = await connectToDevice(device);
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
            await disconnectDevice(connectedDevice);
            set({isConnected: false});
        }
      },

      scanForPeripherals: () => {
        scanForPeripherals((device) => {
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
        });
      },
    
      onDataUpdate: (
        error: BleError | null,
        characteristic: Characteristic | null
      ) => {
        const data = extractData(error, characteristic);
        if (data) {
          set((state: any) => {
            const newDataPoints = [...state.dataPoints, ...data].slice(-800);
            return {
              dataPoints: newDataPoints
            };
          });
          console.log("Data updated", data);
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
            set({dataPoints: []});
            await startMeasurementCommand(device);
            get().startStreamingData(device);
        });
      },
    
      stopMeasurement: async () => {
        get().withDevice(async (device: Device) => {
            await stopMeasurementCommand(device);
            get().subscription?.remove();
            console.log(get().dataPoints);
            set({subscription: null});
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