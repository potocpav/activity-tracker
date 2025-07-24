import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme, FAB, Divider, Portal, Dialog, Button } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, GoalType } from "./StoreTypes";
import { renderValueSummary, formatDate } from "./GoalData";
import { lightPalette, darkPalette } from "./Color";
import { renderTags } from "./GoalUtil";

const Stat = ({ label, value, styles, onPress }: { label: string, value: string, styles: any, onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.statContainer} onPress={onPress}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const GoalSummary = ({ navigation, route }: { navigation: any, route: any }) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const goalColor = palette[goal.color];

  const styles = getStyles(theme, goalColor);

  // Dialog state
  const [dialogVisible, setDialogVisible] = React.useState(false);
  const [dialogLabel, setDialogLabel] = React.useState("");
  const [dialogValue, setDialogValue] = React.useState("");

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const numDataPoints = goal.dataPoints.length;
  const lastDataPoint = numDataPoints > 0 ? goal.dataPoints[numDataPoints - 1] : null;
  const distinctDayCount = new Set(goal.dataPoints.map((dp: DataPoint) => formatDate(new Date(dp.time)))).size;

  // Helper to open dialog
  const showStatDialog = (label: string, value: string) => {
    setDialogLabel(label);
    setDialogValue(value);
    setDialogVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.goalInfo}>
        <Text style={styles.goalDescription}>{goal.description}</Text>
      </View>
      {goal.tags.length > 0 && (
        <>
          <Divider />
          <View style={styles.tagsRow}>
            {renderTags(goal.tags, theme, palette)}
          </View>
        </>
      )}
      <Divider />
      <View style={styles.statsGroup}>
        <Stat label="Count" value={numDataPoints.toString()} styles={styles} onPress={() => showStatDialog("Count", numDataPoints.toString())} /> 
        <Stat label="Days" value={distinctDayCount.toString()} styles={styles} onPress={() => showStatDialog("Days", distinctDayCount.toString())} />
        <Stat label="Last" value={renderValueSummary(lastDataPoint?.value, goal.unit, [styles.statValue])} styles={styles} onPress={() => showStatDialog("Last", renderValueSummary(lastDataPoint?.value, goal.unit, [styles.statValue]))} />
      </View>
      <Divider />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("EditDataPoint", { goalName, newDataPoint: true })}
        color={theme.colors.surface}
      />
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{dialogLabel}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: goalColor }}>{dialogValue}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  goalUnit: {
    fontSize: 14,
    fontStyle: "italic",
  },
  tagsRow: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  statsGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 18,
    backgroundColor: theme.colors.surface,
  },
  statContainer: {
    flex: 1,
    alignItems: 'center',
    width: 100,
  },
  statsLabel: {
    fontSize: 16,
    marginBottom: 4,
    color: theme.colors.onSurfaceVariant,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: goalColor,
  },
  statValuePlaceholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurfaceVariant,
  },
  statValueContainer: {
    flexDirection: 'column',
    alignItems: 'center',
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