import React, { Fragment } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Divider } from 'react-native-paper';
import useStore from "../Model/Store";
import { ActivityPath, ActivityType, CalendarProps, GraphProps, Stat, State } from "../Model/StoreTypes";
import { RenderTags } from "../Components/Tags";
import ActivityGraph from "../Components/Activity/ActivityGraph";
import ActivityCalendar from "../Components/Activity/ActivityCalendar";
import StatView from "../Components/StatView";
import { useAppTheme, useThemePalette } from "../Model/Theme";
import Animated, { LinearTransition } from "react-native-reanimated";
import Hint from "../Components/Hint";
import { SafeAreaView } from "react-native-safe-area-context";

const ActivitySummary = ({ navigation, activityPath }: { navigation: any, activityPath: ActivityPath }) => {
  const activity: ActivityType = useStore((state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const theme = useAppTheme(activity.color);
  const palette = useThemePalette();
  const styles = getStyles(theme);

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
                <RenderTags tags={activity.tags} theme={theme} palette={palette} />
              </View>
            )}
          </View>
        </Fragment>

        <Fragment>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{paddingLeft: 10}}>
                <Text style={styles.sectionHeader}>Overview</Text>
              </View>
            </View>
            <Animated.View layout={LinearTransition} style={styles.statsContainer}>
              {activity.stats.map((stat: Stat, index: number) => (
                <StatView key={index} stat={stat} activity={activity} onPress={() =>
                  {
                    dismissHint("overview_edit_hint");
                    navigation.navigate("EditStat", {activityPath, statId: index})
                  }
                } sharedTransitionTag={index == 0 ? "tag" : undefined} />
              ))}
            </Animated.View>
            {activity.dataPoints.length > 20 && activity.stats.length > 0 && 
            <Hint hint="overview_edit_hint" />}
          </View>
          <Divider />
        </Fragment>

        <Fragment>
          {activity.calendars.map((_: CalendarProps, index: number) => (
            <Fragment key={`calendar-${index}`}>
              <ActivityCalendar navigation={navigation} activityPath={activityPath} calendarIndex={index} />
              <Divider />
            </Fragment>
          ))}

          {activity.graphs.map((_: GraphProps, index: number) => (
            <Fragment key={`graph-${index}`}>
              <ActivityGraph activityPath={activityPath} graphIndex={index} />
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
    flexWrap: 'wrap',
  },
});

export default ActivitySummary; 