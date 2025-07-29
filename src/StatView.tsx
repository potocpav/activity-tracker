import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useTheme } from 'react-native-paper';
import { GoalType, Stat } from "./StoreTypes";
import { renderValueSummary } from "./GoalData";
import { calcStatValue } from "./GoalUtil";
import { lightPalette, darkPalette } from "./Color";
import useStore from "./Store";


const StatView = ({ stat, goal, onPress }: { stat: Stat, goal: GoalType, onPress: () => void }) => {
    const theme = useTheme();
    const themeState = useStore((state: any) => state.theme);
    const palette = themeState === "dark" ? darkPalette : lightPalette;
    const goalColor = palette[goal.color];
    const styles = getStyles(theme, goalColor);
    
    const value = calcStatValue(stat, goal);
    const unit = ["n_days", "n_points"].includes(stat.value) ? "" : goal.unit;

    return (
      <Pressable 
        onPress={onPress}
        style={({pressed}) => [
          styles.statInnerContainer,
          {
            opacity: pressed ? 0.5 : 1,
          },
        ]}
        >
        <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center' }}>
          <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{renderValueSummary(value, unit)}</Text>
          <Text style={styles.statsLabel} numberOfLines={2} adjustsFontSizeToFit>{stat.label}</Text>
        </View>
      </Pressable>
    );
  };

const getStyles = (theme: any, goalColor: string) => StyleSheet.create({
  statInnerContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 18,
  },
  statsLabel: {
    fontSize: 16,
    color: theme.colors.onSurfaceVariant,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: goalColor,
  },
});

export default StatView;