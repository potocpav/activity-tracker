# Tindeq Analyzer

A React Native mobile application for analyzing force measurements from the Tindeq Progressor device. The app provides real-time data visualization and analysis capabilities for strength training and rehabilitation purposes.

This app is work-in-progress, and I don't know how far I'll get before I get bored of it :D

## Features

- **Bluetooth Low Energy (BLE) Connectivity**: Seamlessly connect to Tindeq Progressor devices
- **Real-time Data Visualization**: Live chart display of force measurements over time
- **Measurement Controls**: Start, stop, and tare scale functionality
- **Data Display**: Real-time weight, time, and maximum weight tracking

## Screenshots

| Main Screen | Device Connection | Live View |
|-------------|------------------|-----------|
| ![Main Screen](screenshots/Screenshot_20250712_212750_Tindeq%20Analyzer.jpg) | ![Device Connection](screenshots/Screenshot_20250712_212758_Tindeq%20Analyzer.jpg) | ![Live View](screenshots/Screenshot_20250712_212823_Tindeq%20Analyzer.jpg) |

## Prerequisites

- Expo CLI
- Tindeq Progressor device

## Running the App

1. **Start the development server**
   ```bash
   npx expo start --tunnel
   ```

2. **Connect your device**
   - Scan the QR code with Expo Go (Android)
   - Scan the QR code with Camera app (iOS)

3. **Grant permissions**
   - Allow Bluetooth permissions when prompted
   - Allow location permissions (required for BLE scanning)

## Usage

### Connecting to a Device

1. **Open the app** and navigate to the main screen
2. **Tap "Connect"** in the status bar
3. **Ensure your Tindeq Progressor** has a blinking green light
   - If not blinking, press the button on the device
4. **Select your device** from the list of available Progressor devices
5. **Wait for connection** - the status indicator will turn green when connected

### Taking Measurements

1. **Navigate to "Live View"** from the main screen
2. **Tare the scale** (optional) by pressing the "Tare" button
3. **Start measurement** by pressing the "Start" button
4. **Perform your exercise** - the app will display real-time data
5. **Stop measurement** by pressing the "Stop" button

## Technical Details

### Architecture

- **State Management**: Zustand for global state
- **Bluetooth**: react-native-ble-plx for BLE communication
- **Charts**: Victory Native for data visualization
- **UI Framework**: React Native with custom styling

## License

This project is licensed under the MIT License
