import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme, FAB, Divider, Portal, Dialog, Button } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, GoalType, Stat } from "./StoreTypes";
import { renderValueSummary, formatDate } from "./GoalData";
import { lightPalette, darkPalette } from "./Color";
import { renderTags } from "./GoalUtil";

const StatView = ({ label, value, styles, onPress }: { label: string, value: string, styles: any, onPress: () => void }) => {
  return (
    <TouchableOpacity style={styles.statContainer} onPress={onPress}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statsLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

type EditStatDialogProps = {
  visible: boolean;
  onDismiss: () => void;
  stat: Stat;
  color: string;
};

const EditStatDialog = ({
  visible,
  onDismiss,
  stat,
  color,
}: EditStatDialogProps) => (
  <Portal>
    <Dialog visible={visible} onDismiss={onDismiss}>
      <Dialog.Title>{stat.label}</Dialog.Title>
      <Dialog.Content>
        <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', color }}>ToDo</Text>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Close</Button>
      </Dialog.Actions>
    </Dialog>
  </Portal>
);

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
  const [dialogStatId, setDialogStatId] = React.useState<number | null>(null);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  // Helper to open dialog
  const showStatDialog = (statId: number) => {
    setDialogVisible(true);
    setDialogStatId(statId);
    console.log("showStatDialog", statId);
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
        {goal.stats.map((stat: Stat, index: number) => (
          <StatView key={index} label={stat.label} value={stat.value} styles={styles} onPress={() => showStatDialog(index)} />
        ))}
      </View>
      <Divider />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("EditDataPoint", { goalName, newDataPoint: true })}
        color={theme.colors.surface}
      />
      {dialogStatId !== null && ( 
        <EditStatDialog
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
          stat={goal.stats[dialogStatId]}
          color={goalColor}
        />
      )}
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