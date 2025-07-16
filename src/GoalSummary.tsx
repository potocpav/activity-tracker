import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useTheme, FAB, Divider } from 'react-native-paper';
import useStore, { DataPoint, GoalType, Unit } from "./Store";
import { renderValueSummary, formatDate } from "./GoalData";

const renderUnit = (unit: Unit) => {
  if (typeof unit === "string") {
    return "[" + unit + "]";
  }
  return unit.map((u: any) => u.name + " [" + u.symbol + "]").join(", ");
};

const GoalSummary = ({ navigation, route }: { navigation: any, route: any }) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const numDataPoints = goal.dataPoints.length;
  const lastDataPoint = numDataPoints > 0 ? goal.dataPoints[numDataPoints - 1] : null;
  const distinctDayCount = new Set(goal.dataPoints.map((dp: DataPoint) => formatDate(new Date(dp.time)))).size;


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>    
      <View style={[styles.goalInfo, { backgroundColor: theme.colors.surface }]}>  
        <Text style={[styles.goalDescription, { color: theme.colors.onSurface, textAlign: 'center' }]}>{goal.description}</Text>
      </View>
      <Divider />
      <View style={[styles.statsRow, { backgroundColor: theme.colors.surface }]}>  
        <View style={styles.statsColumn}>
          <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{numDataPoints}</Text>
          <Text style={[styles.statsLabel, { color: theme.colors.onSurfaceVariant }]}>Count</Text>
        </View>
        <View style={styles.statsColumn}>
          <Text style={[styles.statsValue, { color: theme.colors.primary }]}>{distinctDayCount}</Text>
          <Text style={[styles.statsLabel, { color: theme.colors.onSurfaceVariant }]}>Days</Text>
        </View>
        <View style={styles.statsColumn}>
          <View style={[styles.statsValueContainer]}>{lastDataPoint ? 
            renderValueSummary(lastDataPoint.value, goal.unit, [styles.statsValue, { color: theme.colors.primary}]) : 
            <Text style={[styles.statsValue, { color: theme.colors.onSurfaceVariant }]}>-</Text>}</View>
          <Text style={[styles.statsLabel, { color: theme.colors.onSurfaceVariant }]}>Last</Text>
        </View>
      </View>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("EditDataPoint", { goalName, newDataPoint: true })}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  goalInfo: {
    padding: 15,
    borderRadius: 10,
  },
  goalDescription: {
    fontSize: 16,
    lineHeight: 22,
  },
  goalUnit: {
    fontSize: 14,
    fontStyle: "italic",
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 18,
  },
  statsColumn: {
    flex: 1,
    alignItems: 'center',
  },
  statsLabel: {
    fontSize: 16,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsValueContainer: {
    flexDirection: 'column',
    alignItems: 'center'
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GoalSummary; 