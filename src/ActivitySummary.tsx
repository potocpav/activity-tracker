import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Divider } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType, Stat } from "./StoreTypes";
import { renderTags } from "./ActivityUtil";
import AntDesign from '@expo/vector-icons/AntDesign';
import ActivityGraph from "./ActivityGraph";
import ActivityCalendar from "./ActivityCalendar";
import StatView from "./StatView";
import { getTheme, getThemePalette, useWideDisplay } from "./Theme";
import Animated, { LinearTransition } from "react-native-reanimated";

const ActivitySummary = ({ navigation, activityName }: { navigation: any, activityName: string }) => {
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const addActivityStat = useStore((state: any) => state.addActivityStat);
  const theme = getTheme(activity);
  const palette = getThemePalette();
  const wideDisplay = useWideDisplay();
  const styles = getStyles(theme);

  // Value to display in dialog

  if (!activity) {
    return <Text>Activity not found</Text>;
  }


  const newStat: Stat = {
    label: "Last Value",
    value: activity.unit === null ? "n_points" : "mean",
    subUnit: Array.isArray(activity.unit) ? activity.unit[0].name : null,
    period: "last_active_day",
    tagFilters: [],
  };
  
  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          {activity.description && (
            <View style={styles.activityInfo}>
              <Text style={styles.activityDescription}>{activity.description}</Text>
            </View>
          )}

          {activity.tags.length > 0 && (
            <>
              {/* <Divider /> */}
              <View style={styles.tagsRow}>
                {renderTags(activity.tags, theme, palette)}
              </View>
            </>
          )}
        </View>

        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{}}>
              <Text style={styles.sectionHeader}>Overview</Text>
            </View>
            <View style={styles.addStat}>
              <Pressable
                onPress={() => {
                  addActivityStat(activityName, newStat);
                }}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <AntDesign name="plus" size={24} color={theme.colors.onSurfaceVariant} />
              </Pressable>
            </View>
          </View>
          <Animated.View layout={LinearTransition} style={styles.statsContainer}>
            {activity.stats.map((stat: Stat, index: number) => (
              <StatView key={index} stat={stat} activity={activity} onPress={() =>
                navigation.navigate("EditStat", {
                  activityName: activityName,
                  statId: index,
                })
              } sharedTransitionTag={index == 0 ? "tag" : undefined} />
            ))}
          </Animated.View>
        </View>
        <Divider />

        <Text style={styles.sectionHeader}>Calendar</Text>
        <ActivityCalendar navigation={navigation} activityName={activityName} />

        <Divider />
        <Text style={styles.sectionHeader}>Graph</Text>
        <ActivityGraph activityName={activityName} />

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.elevation.level1,
    elevation: 2,
    marginHorizontal: 4,
  },
  activityInfo: {
    padding: 15,
  },
  activityDescription: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
  tagsRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  sectionHeader: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  addStat: {
    padding: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: theme.colors.surface,
    flexWrap: 'wrap',
  },
});

export default ActivitySummary; 