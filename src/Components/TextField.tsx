import React, { useState } from "react";
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from "react-native";
import { useAppTheme, Theme } from "../Model/Theme";

// A labeled text input

type TextFieldProps = TextInputProps & {
  label?: string;
  containerStyle?: StyleProp<ViewStyle>;
  // Tints the focused outline and label with the activity's color.
  activityColor?: number;
};

export const TextField = ({
  label,
  containerStyle,
  style,
  activityColor,
  editable,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) => {
  const theme = useAppTheme(activityColor);
  const styles = getStyles(theme);
  const [focused, setFocused] = useState(false);

  return (
    <View style={containerStyle}>
      {label !== undefined && <Text style={[styles.label, focused && styles.focusedLabel]}>{label}</Text>}
      <TextInput
        editable={editable}
        placeholderTextColor={theme.onSurfaceVariant}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[styles.input, editable === false && styles.readOnlyInput, focused && styles.focusedInput, style]}
        {...props}
      />
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    label: {
      fontSize: 12,
      marginBottom: 4,
      color: theme.onSurfaceVariant,
    },
    focusedLabel: {
      color: theme.primary,
    },
    input: {
      fontSize: 16,
      color: theme.onSurface,
      borderColor: theme.outline,
      borderWidth: 1,
      borderRadius: 5,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    readOnlyInput: {},
    focusedInput: {
      borderColor: theme.primary,
      borderWidth: 2,
      paddingHorizontal: 9,
      paddingVertical: 7,
    },
  });

export default TextField;
