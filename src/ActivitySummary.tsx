import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { Divider } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType, Stat, TagFilter } from "./StoreTypes";
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
    activity.stats[statDialogStatRowId][statDialogStatColId] : null;

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
            {statRow.length > 0 && (
              <Pressable
                onPress={() => {
                  showStatDialog(rowIndex, null);
                }}
                style={({ pressed }) => [
                  {
                    margin: 8,
                    position: 'absolute',
                    right: -10,
                    top: 20,
                    opacity: pressed ? 0.5 : 1,
                  },
                ]}
              >
                <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
                  <AntDesign name="plus" size={24} color={theme.colors.outlineVariant} />
                </View>
              </Pressable>
            )}
          </View>
        ))}

        { /* Add Stat into a new row */}
        <View style={{ margin: 10, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
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
            <AntDesign name="plus" size={24} color={theme.colors.outlineVariant} />
          </Pressable>
        </View>

        <Divider />

        <ActivityCalendar navigation={navigation} activityName={activityName} />

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
  tagsRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  statsGroup: {
    flexDirection: 'row',
    marginHorizontal: 10,
    // justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface,
  },
});

export default ActivitySummary; 