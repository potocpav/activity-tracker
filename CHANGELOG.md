
# Planned features

- [ ] Multiple acitivity screens
  - [ ] Remove wing tabs when no activities exist
  - [ ] Animate title on tab changes
  - [ ] Navigate to the new tab on Loop Habits import
- [ ] Handle large number of data points
  - [ ] Bulk selection
  - [ ] Bulk editing
  - [ ] Bulk deletion
- [ ] Tag groups to support mutually exclusive tags. 
  - [ ] Drag-drop across multiple tab rows.
  - [ ] Drag-drop the tag rows themeslves.
  - [ ] Merge tag row buttons visually
- [ ] Persistent timers as notifications
  - [ ] Show running timers on activity screen
- [ ] Minor features
  - [ ] Remember last tags for each activity
  - [ ] BLE Input font size debugging
  - [ ] Unit conversions: kg <-> lbs, etc. This could include the ability to input values in different units - useful for climbing grades.
  - [ ] Scroll climbing grade picker to the selected grade more reliably
  - [ ] Keyboard avoidance in Edit Activity and other screens
- [ ] Performance improvements
  - [ ] Debug BLE Input performance
  - [ ] Debug Activity Summary performance
- [ ] Optimize for tablets
- [ ] Add ratings
  - [ ] Easy, Moderate, Hard, Very Hard, Max
  - [ ] 1-5 stars
  - [ ] 1-10 points

# Changelog

### 3.5.0

- Upgrade to Expo SDK 55
- Import Loop Habit Tracker data into a new tab

### 3.4.1

- Remove Tindeq Progressor from experimental features

### 3.4.0

- Add French and Font slash grades
- Multiline data point notes
- Add "This Quarter" time period to statistics
- Fix a bug in "Daily %" calculations 
- Fix a bug with the last month of the year being excluded from statistics

### 3.3.1

- Renaming activity tabs
- Fix a screen navigation bug

### 3.3.0

- Activity tabs
- New data point list design 
- Swipe to delete data points
- Polish Bluetooth integration with Tindeq Progressor
- Allow duplicate activity names

### 3.2.0

- Fix data import (3.1.0 bug)
- Replace Date picker with a native widget
- Add Time picker for hourly time units
- Add chart mode "Points" where every data point is displayed individually
- Improve default graph display

### 3.1.0

- Import data from [Loop Habit Tracker](https://loophabits.org/)
- Add statistics and regression line to selected ranges in graphs
- Experimental [Tindeq Progressor](https://tindeq.com/product/progressor/) support
- New icons, UX tweaks

### 3.0.0

- Improve graph scrolling
- Properly display units in graphs
- Remove line-mean graph type (temporarily?)
- Redesign the data list screen
- Move clone buttons for stats, calendars and graphs into their modals
- Add links to Google Play, FAQ and Privacy Policy in Settings
- Add percentage units

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
