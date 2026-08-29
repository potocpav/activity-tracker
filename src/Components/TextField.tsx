import React from "react";
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { MD3Theme } from "react-native-paper/lib/typescript/types";
import { useAppTheme } from "../Model/Theme";

// A labeled text input

type TextFieldProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export const TextField = ({ label, containerStyle, style, ...props }: TextFieldProps) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  return (
    <View style={containerStyle}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      <TextInput placeholderTextColor={theme.colors.onSurfaceVariant} style={[styles.input, style]} {...props} />
    </View>
  );
};

const getStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    label: {
      fontSize: 12,
      marginBottom: 4,
      color: theme.colors.onSurfaceVariant,
    },
    input: {
      fontSize: 16,
      color: theme.colors.onSurface,
      borderColor: theme.colors.outline,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
  });

export default TextField;
