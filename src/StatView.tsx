import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useTheme } from 'react-native-paper';
import { ActivityType, Stat } from "./StoreTypes";
import { renderValueSummary } from "./ActivityData";
import { calcStatValue } from "./ActivityUtil";
import { lightPalette, darkPalette } from "./Color";
import useStore from "./Store";


const StatView = ({ stat, activity, onPress }: { stat: Stat, activity: ActivityType, onPress: () => void }) => {
    const theme = useTheme();
    const themeState = useStore((state: any) => state.theme);
    const palette = themeState === "dark" ? darkPalette : lightPalette;
    const activityColor = palette[activity.color];
    const styles = getStyles(theme, activityColor);
    
    const value = calcStatValue(stat, activity);
    const unit = ["n_days", "n_points"].includes(stat.value) ? "" : activity.unit;

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

const getStyles = (theme: any, activityColor: string) => StyleSheet.create({
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
    color: activityColor,
  },
});

export default StatView;