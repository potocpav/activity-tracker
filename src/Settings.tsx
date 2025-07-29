import React from 'react';
import { StyleSheet, ScrollView, ToastAndroid } from 'react-native';
import { List, Divider, Switch, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore, { version, partialize, migrate } from './Store';
import { File, Paths } from 'expo-file-system/next';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';


const Settings = () => {
  const theme = useTheme();
  const themeState = useStore((state: any) => state.theme);
  const setThemeState = useStore((state: any) => state.setTheme);
  const blackBackground = useStore((state: any) => state.blackBackground);
  const setBlackBackground = useStore((state: any) => state.setBlackBackground);
  const weekStart = useStore((state: any) => state.weekStart);
  const setWeekStart = useStore((state: any) => state.setWeekStart);
  const state = useStore((state: any) => state);
  const setState = useStore((state: any) => state.setState);

  const exportData = async () => {
    const data = JSON.stringify({ ...partialize(state), version: version }, null, 2);
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];


    const file = new File(Paths.cache, `workouts-${dateStr}.json`);
    try {
      if (file.exists) {
        file.delete();
      }
      file.create(); // can throw an error if the file already exists or no permission to create it
      file.write(data);

      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Export Workouts',
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
      const file = new File(asset.uri);
      const contents = file.text()
      const json = JSON.parse(contents);
      const migrated = migrate(json, json.version);
      setState(migrated);
      ToastAndroid.show("Data imported successfully", ToastAndroid.SHORT);
      // TODO: sanity check and import the file
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <List.Section>
          <List.Subheader>Interface</List.Subheader>
          <List.Item
            title="Dark Theme"
            description="Use dark theme throughout the app"
            onPress={() => setThemeState(themeState == 'dark' ? 'light' : 'dark')}
            left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
            right={() => (
              <Switch
                value={themeState == 'dark'}
                onValueChange={() => setThemeState(themeState == 'dark' ? 'light' : 'dark')}
              />
            )}
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
        </List.Section>

        <List.Section>
          <List.Subheader>Data</List.Subheader>
          <List.Item
            title="Data Export"
            description="Generate a backup file that contains all your data. This file can be imported back."
            left={(props) => <List.Icon {...props} icon="upload" />}
            onPress={exportData}
          />
          <Divider />
          <List.Item
            title="Data Import"
            description="Import data from a backup file."
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={importData}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Support</List.Subheader>
          <List.Item
            title="Help & FAQ"
            description="Get help and find answers"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => { }}
          />
          <Divider />
          <List.Item
            title="Contact Support"
            description="Get in touch with our support team"
            left={(props) => <List.Icon {...props} icon="message" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => { }}
          />
          <Divider />
          <List.Item
            title="About"
            description="App version and information"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => { }}
          />
        </List.Section>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Settings; 