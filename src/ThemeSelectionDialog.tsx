import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, RadioButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import useStore from './Store';

const ThemeSelectionDialog: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedTheme, setSelectedTheme] = useState('light');
  const setThemeState = useStore((state: any) => state.setTheme);

  // Get the current theme from route params or default to 'light'
  useEffect(() => {
    if (route.params && (route.params as any).currentTheme) {
      setSelectedTheme((route.params as any).currentTheme);
    }
  }, [route.params]);

  const handleThemeSelect = (value: string) => {
    setSelectedTheme(value);
    // Set the theme in the store and exit the dialog
    setThemeState(value);
    navigation.goBack();
  };

  return (
    <Portal>
      <Dialog visible={true} onDismiss={() => navigation.goBack()}>
        <Dialog.Title>Select Theme</Dialog.Title>
        <Dialog.Content>
          <RadioButton.Group onValueChange={handleThemeSelect} value={selectedTheme}>
            <View style={styles.radioContainer}>
              <RadioButton.Item label="System" value="system" />
              <RadioButton.Item label="Light" value="light" />
              <RadioButton.Item label="Dark" value="dark" />
            </View>
          </RadioButton.Group>
        </Dialog.Content>
      </Dialog>
    </Portal>
  );
};

const styles = StyleSheet.create({
  radioContainer: {
    paddingVertical: 8,
  },
});

export default ThemeSelectionDialog; 