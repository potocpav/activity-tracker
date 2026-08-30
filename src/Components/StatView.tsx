import React from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { ActivityType, Stat } from "../Model/StoreTypes";
import { renderStatValue } from "../Model/Activity";
import useStore from "../Model/Store";
import { useAppTheme } from "../Model/Theme";
import Animated, { LinearTransition, FadeIn, FadeOut } from "react-native-reanimated";

const StatView = ({
  stat,
  activity,
  onPress,
  sharedTransitionTag,
}: {
  stat: Stat;
  activity: ActivityType;
  onPress: () => void;
  sharedTransitionTag?: string;
}) => {
  const theme = useAppTheme(activity.color);
  const weekStart = useStore((state: any) => state.weekStart);
  const styles = getStyles(theme);

  return (
    <Animated.View layout={LinearTransition} style={styles.container} entering={FadeIn} exiting={FadeOut}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            flexDirection: "row",
            opacity: pressed ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ flex: 1, flexDirection: "column", alignItems: "center" }}>
          <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {renderStatValue(stat, activity, weekStart)}
          </Text>
          <Text style={styles.label} numberOfLines={2} adjustsFontSizeToFit>
            {stat.label}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      width: 110,
      // flex: 1,
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "flex-start",
      paddingVertical: 18,
    },
    label: {
      fontSize: 16,
      color: theme.onSurfaceVariant,
    },
    value: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.primary,
    },
  });

export default StatView;
