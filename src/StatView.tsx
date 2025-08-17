import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { ActivityType, Stat } from "./StoreTypes";
import { renderValueSummary } from "./ActivityData";
import { calcStatValue, getUnitSymbol } from "./ActivityUtil";
import useStore from "./Store";
import { getTheme } from "./Theme";
import Animated, { LinearTransition, FadeIn, FadeOut } from "react-native-reanimated";

const StatView = ({ stat, activity, onPress }: { stat: Stat, activity: ActivityType, onPress: () => void }) => {
    const theme = getTheme(activity);
    const weekStart = useStore((state: any) => state.weekStart);
    const styles = getStyles(theme);
    
    const value = calcStatValue(stat, activity, weekStart);
    const unitSymbol = getUnitSymbol(stat, activity.unit);

    return (
      <Animated.View 
        layout={LinearTransition} 
        style={styles.statInnerContainer}
        entering={FadeIn}
        exiting={FadeOut}
        >
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
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{renderValueSummary(value, unitSymbol)}</Text>
            <Text style={styles.statsLabel} numberOfLines={2} adjustsFontSizeToFit>{stat.label}</Text>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

const getStyles = (theme: any) => StyleSheet.create({
  statInnerContainer: {
    width: 110,
    // flex: 1,
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
    color: theme.colors.primary,
  },
});

export default StatView;