import React from 'react';
import { StyleSheet, ScrollView, ToastAndroid, View, Linking } from 'react-native';
import { List, Divider, Switch } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useStore, { version, partialize, migrate } from '../Model/Store';
import { File, Paths } from 'expo-file-system/next';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { getTheme } from '../Model/Theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { allHints } from '../Model/StoreTypes';

const Settings = () => {
  const theme = getTheme();
  const navigation = useNavigation();
  const themeState = useStore((state: any) => state.theme);
  const blackBackground = useStore((state: any) => state.blackBackground);
  const setBlackBackground = useStore((state: any) => state.setBlackBackground);
  const weekStart = useStore((state: any) => state.weekStart);
  const setWeekStart = useStore((state: any) => state.setWeekStart);
  const state = useStore((state: any) => state);
  const setState = useStore((state: any) => state.setState);
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
      ToastAndroid.show("Data exported successfully", ToastAndroid.SHORT);
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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["left", "right", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
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
                // <AntDesign name="check" size={24} color={theme.colors.primary} />
              ) : null
            )}
          />
          <List.Item
            title="Visit us on GitHub"
            description="View source code and contribute"
            left={(props) => <List.Icon {...props} icon="github" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => Linking.openURL('https://github.com/potocpav/activity-tracker')}
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