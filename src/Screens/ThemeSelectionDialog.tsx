import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useStore from './Store';

const ThemeSelectionDialog: React.FC = () => {
  const navigation = useNavigation();
  const themeState = useStore((state: any) => state.theme);
  const setThemeState = useStore((state: any) => state.setTheme);


  const handleThemeSelect = (value: string) => {
    setThemeState(value);
    navigation.goBack();
  };

  return (
    <RadioButton.Group onValueChange={handleThemeSelect} value={themeState}>
      <View style={styles.radioContainer}>
        <RadioButton.Item label="System" value="system" style={styles.radioButton} />
        <RadioButton.Item label="Light" value="light" style={styles.radioButton} />
        <RadioButton.Item label="Dark" value="dark" style={styles.radioButton} />
      </View>
    </RadioButton.Group>
  );
};

const styles = StyleSheet.create({
  radioContainer: {
    paddingVertical: 8,
  },
  radioButton: {
    marginVertical: 2,
  },
});

export default ThemeSelectionDialog; 