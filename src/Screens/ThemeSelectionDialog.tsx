import React, { Fragment } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useStore from "../Model/Store";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppTheme } from "../Model/Theme";
import { RadioButton } from "../Components/Element";

const themeOptions = [
  { label: "System", value: "system" },
  { label: "Light", value: "light" },
  { label: "Dark", value: "dark" },
];

const ThemeSelectionDialog: React.FC = () => {
  const navigation = useNavigation();
  const themeState = useStore((state: any) => state.theme);
  const setThemeState = useStore((state: any) => state.setTheme);
  const themeVariant = useAppTheme().variant;

  const handleThemeSelect = (value: string) => {
    setThemeState(value);
    navigation.goBack();
  };

  return (
    <Fragment>
      <SystemBars style={themeVariant == "light" ? "dark" : "light"} />
      <ScrollView>
        <SafeAreaView edges={["left", "right", "bottom"]}>
          <View style={styles.radioContainer}>
            {themeOptions.map(({ label, value }) => (
              <RadioButton
                key={value}
                label={label}
                selected={themeState === value}
                onPress={() => handleThemeSelect(value)}
                style={styles.radioButton}
              />
            ))}
          </View>
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
