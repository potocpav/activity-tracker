import React, { Fragment } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import useStore from '../Model/Store';
import { SystemBars } from 'react-native-edge-to-edge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeVariant } from '../Model/Theme';


const ThemeSelectionDialog: React.FC = () => {
  const navigation = useNavigation();
  const themeState = useStore((state: any) => state.theme);
  const setThemeState = useStore((state: any) => state.setTheme);
  const themeVariant = useThemeVariant();


  const handleThemeSelect = (value: string) => {
    setThemeState(value);
    navigation.goBack();
  };

  return (
    <Fragment>
      <SystemBars style={themeVariant == 'light' ? "dark" : "light"} />
      <ScrollView>
      <SafeAreaView edges={["left", "right", "bottom"]}>
    <RadioButton.Group onValueChange={handleThemeSelect} value={themeState}>
      <View style={styles.radioContainer}>
        <RadioButton.Item label="System" value="system" style={styles.radioButton} />
        <RadioButton.Item label="Light" value="light" style={styles.radioButton} />
        <RadioButton.Item label="Dark" value="dark" style={styles.radioButton} />
      </View>
    </RadioButton.Group>
    </SafeAreaView>
    </ScrollView>
    </Fragment>
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