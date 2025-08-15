import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Divider } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType, Stat } from "./StoreTypes";
import { renderTags } from "./ActivityUtil";
import AntDesign from '@expo/vector-icons/AntDesign';
import ActivityGraph from "./ActivityGraph";
import ActivityCalendar from "./ActivityCalendar";
import StatView from "./StatView";
import EditStat from "./EditStat";
import { getTheme, getThemePalette } from "./Theme";

const ActivitySummary = ({ navigation, activityName }: { navigation: any, activityName: string }) => {
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);
  const palette = getThemePalette();

  const styles = getStyles(theme);

  // Dialog state
  const [statDialogVisible, setStatDialogVisible] = React.useState(false);
  const [statDialogStatRowId, setStatDialogStatRowId] = React.useState<number | null>(null);
  const [statDialogStatColId, setStatDialogStatColId] = React.useState<number | null>(null);

  // Value to display in dialog
  const dialogStat = (statDialogStatRowId !== null && statDialogStatColId !== null) ?
    (activity.stats[statDialogStatRowId] ?? [])[statDialogStatColId] ?? null : null;

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  // Helper to open dialog
  const showStatDialog = (statRowId: number | null, statColId: number | null) => {
    setStatDialogVisible(true);
    setStatDialogStatRowId(statRowId);
    setStatDialogStatColId(statColId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {activity.description && (
          <View style={styles.activityInfo}>
            <Text style={styles.activityDescription}>{activity.description}</Text>
          </View>
        )}
        {activity.tags.length > 0 && (
          <>
            <Divider />
            <View style={styles.tagsRow}>
              {renderTags(activity.tags, theme, palette)}
            </View>
          </>
        )}
        <Divider />

        <View>

        <Text style={styles.header}>Overview</Text>

        {activity.stats.map((statRow: Stat[], rowIndex: number) => (
          <View
            key={rowIndex}
            style={styles.statsGroup}
          >
            {statRow.map((stat: Stat, index: number) => (
              <StatView key={index} stat={stat} activity={activity} onPress={() =>
                showStatDialog(rowIndex, index)} />
            ))}

            {/* Add Stat to a row */}
            {statRow.length < 3 && (
              <Pressable
                onPress={() => {
                  showStatDialog(rowIndex, null);
                }}
                style={({ pressed }) => [
                  {
                    padding: 10,
                    flex: 0,
                    // position: 'absolute',
                    // right: -10,
                    // top: 20,
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View style={{}}>
                  <AntDesign name="ellipsis1" size={24} color={theme.colors.onSurfaceVariant} />
                </View>
              </Pressable>
            )}
          </View>
        ))}

        { /* Add Stat into a new row */}
        <View style={styles.addStatRow}>
          <Pressable
            onPress={() => {
              showStatDialog(null, null);
            }}
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.5 : 1,
              },
            ]}
          >
            <AntDesign name="ellipsis1" size={24} color={theme.colors.onSurfaceVariant} />
          </Pressable>
        </View>

        </View>
        <Divider />

        <Text style={styles.header}>Calendar</Text>
        <ActivityCalendar navigation={navigation} activityName={activityName} />

        <Divider />
        <Text style={styles.header}>Graph</Text>
        <ActivityGraph activityName={activityName} />

      </ScrollView>
      <EditStat
        navigation={navigation}
        activityName={activityName}
        statRowId={statDialogStatRowId}
        statColId={statDialogStatColId}
        stat={dialogStat}
        visible={statDialogVisible}
        onDismiss={() => setStatDialogVisible(false)}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  activityInfo: {
    padding: 15,
    backgroundColor: theme.colors.surface,
  },
  activityDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: theme.colors.onSurface,
    textAlign: 'center',
  },
  header: {
    fontSize: 16,
    color: theme.colors.onSurface,
    marginHorizontal: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  tagsRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  statsGroup: {
    flexDirection: 'row',
    marginLeft: 10,
    // justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  addStatRow: {
    position: 'absolute',
    right: 0,
    bottom: -22,
    backgroundColor: theme.colors.surface,
    zIndex: 10,
    padding: 10,
    // margin: 10,
    // flex: 1,
    // flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent: 'flex-end',
  },
});

export default ActivitySummary; 