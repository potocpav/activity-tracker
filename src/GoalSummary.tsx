import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useTheme, FAB, Divider } from 'react-native-paper';
import useStore from "./Store";
import { GoalType, Stat } from "./StoreTypes";
import { lightPalette, darkPalette } from "./Color";
import { renderTags } from "./GoalUtil";
import AntDesign from '@expo/vector-icons/AntDesign';
import GoalGraph from "./GoalGraph";
import GoalCalendar from "./GoalCalendar";
import StatView from "./StatView";
import EditStat from "./EditStat";

const GoalSummary = ({ navigation, goalName }: { navigation: any, goalName: string }) => {
  const theme = useTheme();
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const goalColor = palette[goal.color];

  const styles = getStyles(theme, goalColor);

  // Dialog state
  const [statDialogVisible, setStatDialogVisible] = React.useState(false);
  const [statDialogStatRowId, setStatDialogStatRowId] = React.useState<number | null>(null);
  const [statDialogStatColId, setStatDialogStatColId] = React.useState<number | null>(null);

  // Value to display in dialog
  const dialogStat = (statDialogStatRowId !== null && statDialogStatColId !== null) ?
    goal.stats[statDialogStatRowId][statDialogStatColId] : null;


  if (!goal) {
    return <Text>Goal not found</Text>;
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
        {goal.description && (
          <View style={styles.goalInfo}>
            <Text style={styles.goalDescription}>{goal.description}</Text>
          </View>
        )}
        {goal.tags.length > 0 && (
          <>
            <Divider />
            <View style={styles.tagsRow}>
              {renderTags(goal.tags, theme, palette)}
            </View>
          </>
        )}
        <Divider />

        {goal.stats.map((statRow: Stat[], rowIndex: number) => (
          <View
            key={rowIndex}
            style={styles.statsGroup}
          >
            {statRow.map((stat: Stat, index: number) => (
              <StatView key={index} stat={stat} goal={goal} onPress={() =>
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

        <GoalCalendar navigation={navigation} goalName={goalName} />

        <GoalGraph goalName={goalName} />

        <View style={{ height: 50 }} />

      </ScrollView>
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("EditDataPoint", { goalName, newDataPoint: true })}
        color={theme.colors.surface}
      />
      <EditStat
        navigation={navigation}
        goalName={goalName}
        statRowId={statDialogStatRowId}
        statColId={statDialogStatColId}
        stat={dialogStat}
        visible={statDialogVisible}
        onDismiss={() => setStatDialogVisible(false)}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any, goalColor: string) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  goalInfo: {
    padding: 15,
    backgroundColor: theme.colors.surface,
  },
  goalDescription: {
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: goalColor,
  },
});

export default GoalSummary; 