import React, { Fragment } from 'react';
import { StyleSheet, ScrollView, ToastAndroid, Alert, View, Linking } from 'react-native';
import { List, Divider, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useStore, { partialize } from '../Model/Store';
import { version, migrate } from '../Model/Migrations';
import { File, Paths } from 'expo-file-system/next';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { getTheme, getThemeVariant } from '../Model/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { allHints, ActivityType, DateList, Unit } from '../Model/StoreTypes';
import { cmpDateList, uniqueName } from '../Model/Activity';
import { SystemBars } from 'react-native-edge-to-edge';
import * as SQLite from 'expo-sqlite';
import { defaultGraph, defaultCalendar, defaultStats } from '../Model/DefaultActivity';

const Settings = () => {
  const theme = getTheme();
  const navigation = useNavigation();
  const themeState = useStore((state: any) => state.theme);
  const themeVariant = getThemeVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);
  const setBlackBackground = useStore((state: any) => state.setBlackBackground);
  const weekStart = useStore((state: any) => state.weekStart);
  const setWeekStart = useStore((state: any) => state.setWeekStart);
  const state = useStore((state: any) => state);
  const experimentalFeatures = useStore((state: any) => state.experimentalFeatures);
  const setExperimentalFeatures = useStore((state: any) => state.setExperimentalFeatures);
  const setState = useStore((state: any) => state.setState);
  const setActivities = useStore((state: any) => state.setActivities);
  const activeHints = useStore((state: any) => state.activeHints);
  const showHints = useStore((state: any) => state.showHints);
  const setShowHints = useStore((state: any) => state.setShowHints);
  const activateAllHints = useStore((state: any) => state.activateAllHints);

  const openThemeSelection = () => {
    (navigation as any).navigate('ThemeSelection', { currentTheme: themeState });
  };

  const exportData = async () => {
    const data = JSON.stringify({ ...partialize(state), version: version }, null, 2);
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];


    const file = new File(Paths.cache, `activities-${dateStr}.json`);
    try {
      if (file.exists) {
        file.delete();
      }
      file.create(); // can throw an error if the file already exists or no permission to create it
      file.write(data);

      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Export Activities',
        mimeType: 'application/json',
      });
    } catch (error) {
      console.error(error);
    }
    if (file.exists) {
      file.delete();
    }
  }

  const importData = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      const asset = result.assets[0];

      try {
        const file = new File(asset.uri);
        const contents = file.text()
        const json = JSON.parse(contents);

        if (json.version === undefined) {
          Alert.alert("Import Error", "Version is missing");
          return;
        }
        let migrated = migrate(json, json.version);

        // slight sanity check
        // sort data points by date

        migrated = {
          ...migrated,
          activities: migrated.activities.map((activity: ActivityType) => ({
            ...activity,
            dataPoints: [...activity.dataPoints].sort((a, b) => cmpDateList(a.date, b.date))
          })),
        };

        setState(migrated);
        ToastAndroid.show("Data imported successfully", ToastAndroid.SHORT);
      } catch (error) {
        console.error(error);
        Alert.alert((error as Error).name, (error as Error).message);
        return;
      }

    }
  }

  const importLoopHabitTrackerData = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/zip',
      copyToCacheDirectory: true,
    });
    if (!result.canceled) {
      try {
        const asset = result.assets[0];
        const file = new File(asset.uri);
        const db = SQLite.openDatabaseSync(file.uri);
        const habits = db.getAllSync('SELECT * FROM Habits');
        const repetitions = db.getAllSync('SELECT * FROM Repetitions');

        let activities: ActivityType[] = [];

        for (const habit of habits as any) {
          const isNumeric = habit.type === 1;
          const dataPoints = repetitions
            .filter((r: any) => r.habit === habit.id)
            .filter((r: any) => isNumeric || r.value === 2)
            .map((r: any) => {
              const dateObject = new Date(r.timestamp);
              const date = [dateObject.getFullYear(), dateObject.getMonth() + 1, dateObject.getDate()] as DateList;
              const note = r.notes === "" ? {} : { note: r.notes };
              if (isNumeric) {
                return {
                  date: date,
                  value: r.value / 1000,
                  ...note,
                };
              } else {
                return {
                  date: date,
                  ...note,
                };
              }
            });

          const unit: Unit = isNumeric ? { type: "single", unit: { type: "number", symbol: habit.unit } } : { type: "none" };
          const activity: ActivityType = {
            name: uniqueName((n: string) => activities.find((a: ActivityType) => a.name == n) || state.activities.find((a: ActivityType) => a.name == n), habit.name),
            description: habit.question,
            unit: unit,
            dataPoints: dataPoints,
            tags: [],
            color: habit.color,
            stats: defaultStats(unit),
            calendars: [defaultCalendar(unit)],
            graphs: [defaultGraph(unit, "week")],
            special: null,
          };
          activities.push(activity);
        }
        setActivities([...state.activities, ...activities]);
        ToastAndroid.show("Data imported successfully", ToastAndroid.SHORT);
      } catch (error) {
        console.error(error);
        Alert.alert((error as Error).name, (error as Error).message);
        return;
      }
    }
  }

  return (
    <Fragment>
      <SystemBars style={themeVariant == 'light' ? "dark" : "light"} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <SafeAreaView style={{ }} edges={["left", "right", "bottom"]}>
          <List.Section>
            <List.Subheader>Interface</List.Subheader>
            <List.Item
              title="Theme"
              description={`Current theme: ${themeState === 'system' ? 'System' : themeState === 'light' ? 'Light' : 'Dark'}`}
              onPress={openThemeSelection}
              left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
            <List.Item
              title="Use pure black in dark theme"
              description="Replaces gray backgrounds with pure black in dark theme. Reduces battery usage in phones with AMOLED screens."
              onPress={() => setBlackBackground(!blackBackground)}
              left={(props) => <List.Icon {...props} icon="brightness-6" />}
              right={() => (
                <Switch
                  value={blackBackground}
                  onValueChange={() => setBlackBackground(!blackBackground)}
                />
              )}
            />
            <List.Item
              title="First day of the week"
              description={weekStart == 'sunday' ? 'Sunday' : 'Monday'}
              onPress={() => setWeekStart(weekStart == 'sunday' ? 'monday' : 'sunday')}
              left={(props) => <List.Icon {...props} icon="calendar" />}
            />
            <List.Item
              title="Bluetooth scale support"
              description="This feature is experimental and may not work as expected."
              onPress={() => setExperimentalFeatures(!experimentalFeatures)}
              right={() => (
                <Switch
                  value={experimentalFeatures}
                  onValueChange={() => setExperimentalFeatures(!experimentalFeatures)}
                />
              )}
              left={(props) => <List.Icon {...props} icon="bluetooth" />}
            />
          </List.Section>

          <List.Section>
            <List.Subheader>Data</List.Subheader>
            <List.Item
              title="Data Export"
              description="Generate a backup file that contains all your data. This file can be imported back."
              left={(props) => <List.Icon {...props} icon="upload" />}
              onPress={exportData}
            />
            <List.Item
              title="Data Import"
              description="Import data from a backup file. This will overwrite all existing data."
              left={(props) => <List.Icon {...props} icon="download" />}
              onPress={importData}
            />
            <List.Item
              title="Import from Loop Habit Tracker"
              description="Import habits from a Loop Habit Tracker backup file."
              left={(props) => <List.Icon {...props} icon="refresh" />}
              onPress={importLoopHabitTrackerData}
            />
          </List.Section>

          <List.Section>
            <List.Subheader>Help</List.Subheader>
            <List.Item
              title="Show hints"
              description="Show hints to help you use the app."
              onPress={() => setShowHints(!showHints)}
              left={(props) => <List.Icon {...props} icon="lightbulb" />}
              right={() => (
                <Switch
                  value={showHints}
                  onValueChange={() => setShowHints(!showHints)}
                />
              )}
            />
            <List.Item
              title="Activate all hints"
              description="Re-activate dismissed hints."
              onPress={activateAllHints}
              left={(props) => <List.Icon {...props} icon="lightbulb-group" />}
              right={(props) => (
                activeHints.length === allHints.length ? (
                  <List.Icon {...props} icon="check" />
                ) : null
              )}
            />
          </List.Section>

          <List.Section>
            <List.Subheader>Links</List.Subheader>
            <List.Item
              title="FAQ"
              left={(props) => <List.Icon {...props} icon="help-circle" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('https://potocpav.github.io/activity-tracker/faq')}
            />
            <List.Item
              title="Privacy Policy"
              left={(props) => <List.Icon {...props} icon="shield-lock" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('https://potocpav.github.io/activity-tracker/privacy')}
            />
            <List.Item
              title="Google Play"
              left={(props) => <List.Icon {...props} icon="google-play" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.pavelpotocek.activitytracker')}
            />
            <List.Item
              title="Visit us on GitHub"
              left={(props) => <List.Icon {...props} icon="github" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Linking.openURL('https://github.com/potocpav/activity-tracker')}
            />
          </List.Section>
        </SafeAreaView>
      </ScrollView>
    </Fragment>
  );
};

export default Settings; 