[![Activity Tracker Title](google-play/feature-graphic.png)](google-play/feature-graphic.png)


<h1 align="center">Activity Tracker</h1>

<p align="center">
<a href="https://play.google.com/store/apps/details?id=com.pavelpotocek.activitytracker"><img src="https://play.google.com/intl/en_us/badges/images/generic/en-play-badge.png" alt="Get it on Google Play" height="80"></a>
</p>

<!-- This description is formatted with HTML to be copy-pasteable into Google Play description -->

Track your performance metrics and their progress over time. With custom statistics, charts and graphs, you can track anything, from body weight to Bowling scores. The app is ad-free, open-source, and gives you complete ownership of your data.

<b>Simplicity</b>: Minimalistic interface focused on quick data entry and easy analysis. No notifications, no ads, no distractions. Just data.

<b>Flexibility</b>: Tag your data points, add notes, use any measurement units, generate custom statistics and graphs. Everything can be tracked in one app. You can track your daily, monthly or yearly progress.

<b>Data Visualization</b>: Analyze your progress with interactive charts, calendars, box plots, line graphs, and histograms.

<b>Data Ownership</b>: Your data is stored locally on your device. You can export or back up your data into simple JSON or CSV files. You can open these files with your favourite spreadsheet editor or data analysis tools.

## Links

- [Privacy Policy](https://potocpav.github.io/activity-tracker/privacy)
- [FAQ](https://potocpav.github.io/activity-tracker/faq)
- [APK Downloads](https://github.com/potocpav/activity-tracker/releases)

## Screenshots


[![Screenshot 1](screenshots/sshot-1.thumb.jpg)](screenshots/sshot-1.jpg)
[![Screenshot 2](screenshots/sshot-2.thumb.jpg)](screenshots/sshot-2.jpg)
[![Screenshot 3](screenshots/sshot-3.thumb.jpg)](screenshots/sshot-3.jpg)
[![Screenshot 4](screenshots/sshot-4.thumb.jpg)](screenshots/sshot-4.jpg)
[![Screenshot 5](screenshots/sshot-5.thumb.jpg)](screenshots/sshot-5.jpg)
[![Screenshot 6](screenshots/sshot-6.thumb.jpg)](screenshots/sshot-6.jpg)

## Planned features

- [x] Redesign the data list screen
- [x] Reimplement graphs to use FlatList instead of VictoryNative
  - [ ] Regression computation in graphs based on multi-touch range selection
- [ ] Bluetooth integration with Tindeq Progressor and other scales
- [ ] Activity archive to hide old activities without deleting them
- [ ] Unit conversions
- [ ] Tag groups

#### Minor improvements

- [ ] Animations for adding and removing calendars and graphs
- [ ] Scroll climbing grade picker to have the selected grade in the middle of the screen (not the top)

## Changelog

### 3.0.0

- Improve graph scrolling and label display
- Remove line-mean graph type (temporarily?)
- Redesign the data list screen

### 2.4.0

- Redesign unit selection dialog
- Add YDS, French and Font climbing grade systems
- Introduce new weight and distance units

### 2.3.1

- Fix crash when adding a third measurement unit
- Prevent content from being cut off by the system bars
- Various improvements and fixes based on user feedback

### 2.2.1

- General improvments based on user feedback
- JSON import validation & data point sorting

### 2.2.0

- Introduce beginner hints
- Forms now indicate which fields are filled incorrectly
- Introduce distance units

### 2.1.0

- Improve beginner user experience
- Climbing grade unit picker
- Stopwatch for time measurements

### 2.0.0

- Multiple calendars and graphs per activity
- Introduce rich units and specialized value input
  - New unit types: counter, time units, weight, climbing grades

### 1.0.0

- Activity management
- Data point management
- Tags, filtering
- Summary values, calendars and graphs
- Settings
- Data import and export

## Development

Prerequisites:

- Expo CLI
- EAS CLI

This app can not be run in Expo Go. To run the app, compile a development APK with EAS:

```bash
eas build --platform android --profile development --local
```

Install the APK on your device with ADB. Then, run the Expo app and scan the QR code on your device:

```bash
npx expo start --tunnel
```

### Preview build

Development build is not suitable for daily use. You can compile a preview build with EAS to use the app:

```bash
eas build --platform android --profile preview --local
```

Install the APK on your device, and use the app normally.

### Data sharing

You can transfer data among different app builds with the import & export feature. Data should never be imported from a newer app version into an older one - that way, data migrations would not work.