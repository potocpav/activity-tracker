import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme, Theme } from "../Model/Theme";

// Material 3 style segmented buttons: one connected row of Pressables, the selected
// segment picked out by a neutral raised fill.
//
// Selection is optional: pass value/onValueChange for a picker, or give each button its
// own onPress to use the row as plain connected actions with nothing ever selected.

type SegmentedButtonsProps = {
  value?: string;
  onValueChange?: (value: string) => void;
  buttons: {
    value: string;
    label: string;
    icon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    onPress?: () => void;
    disabled?: boolean;
  }[];
};

export const SegmentedButtons = ({ value, onValueChange, buttons }: SegmentedButtonsProps) => {
  const theme = useAppTheme();
  const styles = getStyles(theme);

  return (
    <View style={styles.row}>
      {buttons.map((button, index) => {
        const selected = button.value === value;
        const contentColor = button.disabled ? theme.onSurfaceDisabled : theme.onSurface;

        return (
          <Pressable
            key={button.value}
            onPress={() => (button.onPress ? button.onPress() : onValueChange?.(button.value))}
            disabled={button.disabled}
            accessibilityRole="button"
            accessibilityState={{ selected, disabled: button.disabled }}
            android_ripple={{ foreground: true, color: theme.elevation3 }}
            style={[styles.segment, index > 0 && styles.dividedSegment, selected && styles.selectedSegment]}
          >
            {button.icon !== undefined && <MaterialCommunityIcons name={button.icon} size={18} color={contentColor} />}
            <Text style={[styles.label, { color: contentColor }]} numberOfLines={1}>
              {button.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: theme.outline,
      borderRadius: 20,
      overflow: "hidden",
    },
    segment: {
      flex: 1,
      // plus the row's 1px border top and bottom, for the 40dp Material 3 height
      minHeight: 38,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingHorizontal: 8,
    },
    dividedSegment: {
      borderLeftWidth: 1,
      borderLeftColor: theme.outline,
    },
    selectedSegment: {
      backgroundColor: theme.elevation3,
    },
    label: {
      fontSize: 14,
      fontWeight: "500",
    },
  });

export default SegmentedButtons;
