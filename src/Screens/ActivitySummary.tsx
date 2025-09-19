import React, { Fragment, useLayoutEffect } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Divider } from 'react-native-paper';
import useStore from "../Model/Store";
import { ActivityType, CalendarProps, GraphProps, Stat } from "../Model/StoreTypes";
import { renderTags } from "../Components/Tags";
import AntDesign from '@expo/vector-icons/AntDesign';
import ActivityGraph from "../Components/Activity/ActivityGraph";
import ActivityCalendar from "../Components/Activity/ActivityCalendar";
import StatView from "../Components/StatView";
import { getTheme, getThemePalette, useWideDisplay } from "../Model/Theme";
import Animated, { LinearTransition } from "react-native-reanimated";
import Hint from "../Components/Hint";
import { SafeAreaView } from "react-native-safe-area-context";

const ActivitySummary = ({ navigation, activityName }: { navigation: any, activityName: string }) => {
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const addActivityStat = useStore((state: any) => state.addActivityStat);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const theme = getTheme(activity.color);
  const palette = getThemePalette();
  const styles = getStyles(theme);

  // Value to display in dialog

  if (!activity) {
    return <Text>Activity not found</Text>;
  }


  const newStat: Stat = {
    label: "Last Value",
    value: activity.unit.type === "none" ? "n_points" : "mean",
    subUnit: activity.unit.type === "multiple" ? activity.unit.values[0].name : null,
    period: "last_active_day",
    tagFilters: [],
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <SafeAreaView edges={["left", "right", "bottom"]}>
        <Fragment>
          <View style={styles.header}>
            {activity.description && (
              <View key="activity-description" style={styles.activityInfo}>
                <Text style={styles.activityDescription}>{activity.description}</Text>
              </View>
            )}

            {activity.tags.length > 0 && (
              <View key="activity-tags" style={styles.tagsRow}>
                {renderTags(activity.tags, theme, palette)}
              </View>
            )}
          </View>
        </Fragment>

        <Fragment>
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
                  {
                    dismissHint("overview_edit_hint");
                    navigation.navigate("EditStat", {
                      activityName: activityName,
                      statId: index,
                    })
                  }
                } sharedTransitionTag={index == 0 ? "tag" : undefined} />
              ))}
            </Animated.View>
            {activities.length > 2 && activity.dataPoints.length > 10 && activity.stats.length > 0 && 
            <Hint hint="overview_edit_hint" />}
          </View>
          <Divider />
        </Fragment>

        <Fragment>
          {activity.calendars.map((calendar: CalendarProps, index: number) => (
            <Fragment key={`calendar-${index}`}>
              <ActivityCalendar navigation={navigation} activityName={activityName} calendarIndex={index} />
              <Divider />
            </Fragment>
          ))}

          {activity.graphs.map((graph: GraphProps, index: number) => (
            <Fragment key={`graph-${index}`}>
              <ActivityGraph activityName={activityName} graphIndex={index} />
              <Divider />
            </Fragment>
          ))}
        </Fragment>
        </SafeAreaView>
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
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
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