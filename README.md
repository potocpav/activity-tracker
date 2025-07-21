# Workouts App

**This app is work-in-progress, and I don't know how far I'll get before I get bored of it :D**

A React Native mobile application for analyzing force measurements from the Tindeq Progressor device. The app provides real-time data visualization and analysis capabilities for strength training and rehabilitation purposes.


## Features

- **Bluetooth Low Energy (BLE) Connectivity**: Seamlessly connect to Tindeq Progressor devices
- **Real-time Data Visualization**: Live chart display of force measurements over time
- **Measurement Controls**: Start, stop, and tare scale functionality
- **Data Display**: Real-time weight, time, and maximum weight tracking

## ToDo List

In order to make this app a full-featured management app for workout data, the following list of features must be implemented:
  
## Features

* [x] Add measurement comments
* [x] Implement editing composite units (placeholder)
* [x] Add colors to tags
* [x] Event list filtering by tags
* [ ] Implement editing composite units
* [ ] Allow value-less goals
* [ ] Allow adding graphs to Summary page
* [ ] Allow adding values to Summary page
* [ ] Export data as CSV
* [ ] Add week start customization to Settings
* [ ] Add data import to Settings

## Bugs

* [x] Add alert on point duplication
* [x] Allow unit-less measurements
* [x] Make tag editing wait on goal submit
* [ ] Fix direct date input
* [ ] Make bounds on graphs pixel-perfect
* [ ] Fix localization
* [ ] Implement tag reordering

## General Usability

* [x] When editing, show a better point header.
* [x] Improve form validation messages
* [ ] Show measurment comments somewhere
* [ ] Screen orientation
* [ ] Limit graph Panning on the left
* [ ] Prevent future point input
* [ ] Performance testing & enhancements
  * [ ] Many points (10k)
  * [ ] Wide date ranges (100 years)

## Publication

* [ ] Add screenshots
* [ ] Make app store description
* [ ] Improve GitHub README
* [ ] Link to GitHub from Settings
* [ ] Rename GitHub project

## Tindeq analysis

* [ ] Remove Tindeq permissions, if I decide against supporting Tindeq device
* [ ] Auto-analyze and add reps from Tindeq
* [ ] Integrate Tindeq with goal management
* [ ] Improve connection so that we never get stuck
* [ ] Tare with automatic disconnect/connect

## Screenshots

<table>
  <tr>
    <th>Main Screen</th>
    <th>Connection</th>
    <th>Live View</th>
  </tr>
  <tr>
    <td><img src="screenshots/Screenshot_20250712_212750_Tindeq%20Analyzer.jpg" alt="Main Screen""></td>
    <td><img src="screenshots/Screenshot_20250712_212758_Tindeq%20Analyzer.jpg" alt="Device Connection""></td>
    <td><img src="screenshots/Screenshot_20250712_212823_Tindeq%20Analyzer.jpg" alt="Live View""></td>
  </tr>
</table>

## Prerequisites

- Expo CLI
- Optional: Tindeq Progressor device

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
