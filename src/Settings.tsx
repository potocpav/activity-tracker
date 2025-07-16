import React from 'react';
import { StyleSheet, ScrollView, Share } from 'react-native';
import { List, Divider, Switch, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import useStore from './Store';

const Settings = () => {
  const theme = useTheme();
  const themeState = useStore((state: any) => state.theme);
  const setThemeState = useStore((state: any) => state.setTheme);
  const blackBackground = useStore((state: any) => state.blackBackground);
  const setBlackBackground = useStore((state: any) => state.setBlackBackground);
  const goals = useStore((state: any) => state.goals);

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
        </List.Section>

        <List.Section>
          <List.Subheader>Data</List.Subheader>
          <List.Item
            title="Data Export"
            description="Generate a backup file that contains all your data. This file can be imported back."
            left={(props) => <List.Icon {...props} icon="upload" />}
            onPress={() => {
              const date = new Date();
              const dateStr = date.toISOString().split('T')[0];
              Share.share({
                message: JSON.stringify(goals, null, 2), 
                title: `backup_${dateStr}.json`
              });
            }}
          />
          <Divider />
          <List.Item
            title="Data Import"
            description="Import data from a backup file."
            left={(props) => <List.Icon {...props} icon="download" />}
            onPress={() => {}}
          />
        </List.Section>

        <List.Section>
          <List.Subheader>Support</List.Subheader>
          <List.Item
            title="Help & FAQ"
            description="Get help and find answers"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="Contact Support"
            description="Get in touch with our support team"
            left={(props) => <List.Icon {...props} icon="message" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
          />
          <Divider />
          <List.Item
            title="About"
            description="App version and information"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {}}
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