import React from "react";
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme, FAB, Divider, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, DateList, dateToDateList, GoalType, Stat, StatPeriod, StatValue, TagFilter, Tag, allStatPeriods, allStatValues } from "./StoreTypes";
import { renderValueSummary, formatDate } from "./GoalData";
import { lightPalette, darkPalette } from "./Color";
import { renderTags, findZeroSlice, statPeriodCmp, extractValue, formatNumber } from "./GoalUtil";
import TagMenu from "./TagMenu";
import SubUnitMenu from "./SubUnitMenu";
import DropdownMenu from "./DropdownMenu";
import AntDesign from '@expo/vector-icons/AntDesign';

const calcStatValue = (stat: Stat, goal: GoalType) => {
  const today = dateToDateList(new Date());
  const lastActive = goal.dataPoints.length > 0 ?
    goal.dataPoints[goal.dataPoints.length - 1].date :
    null;
  const periodSlice = findZeroSlice(
    goal.dataPoints,
    (dp: DataPoint) => statPeriodCmp(dp, stat.period, today, lastActive)
  );
  const periodDatedValues = goal
    .dataPoints
    .slice(...periodSlice)
    .map((dp: DataPoint) => [dp.date, extractValue(dp, stat.tagFilters, stat.subUnit)])
    .filter((v: any) => v[1] !== null);

  const periodValues = periodDatedValues.map((v: any) => v[1]);
  const periodDates = periodDatedValues.map((v: any) => v[0]);

  let value;
  if (stat.value === "n_days") {
    value = new Set(periodDates.map((d: DateList) => d.join("-"))).size;
  } else if (stat.value === "n_points") {
    value = periodValues.length;
  } else if (stat.value === "sum") {
    value = periodValues.reduce((acc, v) => acc + v, 0);
  } else if (stat.value === "mean") {
    value = periodValues.reduce((acc, v) => acc + v, 0) / periodValues.length;
  } else if (stat.value === "max") {
    value = Math.max(...periodValues);
  } else if (stat.value === "min") {
    value = Math.min(...periodValues);
  } else if (stat.value === "last") {
    value = periodValues[periodValues.length - 1];
  }
  return value;
}

const StatView = ({ stat, goal, styles, onPress }: { stat: Stat, goal: GoalType, styles: any, onPress: () => void }) => {
  const value = calcStatValue(stat, goal);
  const unit = ["n_days", "n_points"].includes(stat.value) ? "" : goal.unit;
  return (
    <Button onPress={onPress}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        {/* <Text style={styles.statValue}>{formatNumber(value)}</Text> */}
        <Text style={styles.statValue}>{renderValueSummary(value, unit)}</Text>
        <Text style={styles.statsLabel}>{stat.label}</Text>
      {/* </TouchableOpacity> */}
      </View>
    </Button>
  );
};

type EditStatDialogProps = {
  visible: boolean;
  onDismiss: () => void;
  stat: Stat;
  goal: GoalType;
  color: string;
};

const periodToLabel = (period: StatPeriod): string => {
  switch (period) {
    case "today":
      return "Today";
    case "this_week":
      return "This Week";
    case "this_month":
      return "This Month";
    case "this_year":
      return "This Year";
    case "last_7_days":
      return "Last 7 Days";
    case "last_30_days":
      return "Last 30 Days";
    case "last_365_days":
      return "Last 365 Days";
    case "last_active_day":
      return "Last Active Day";
    case "all_time":
      return "All Time";
  }
}

const valueToLabel = (value: StatValue): string => {
  switch (value) {
    case "n_days":
      return "# Days";
    case "n_points":
      return "# Points";
    case "sum":
      return "Sum";
    case "mean":
      return "Mean";
    case "max":
      return "Max";
    case "min":
      return "Min";
    case "last":
      return "Last";
  }
}

const GoalSummary = ({ navigation, route }: { navigation: any, route: any }) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const goalColor = palette[goal.color];
  const addGoalStat = useStore((state: any) => state.addGoalStat);
  const setGoalStat = useStore((state: any) => state.setGoalStat);
  const deleteGoalStat = useStore((state: any) => state.deleteGoalStat);
  const setGoalStats = useStore((state: any) => state.setGoalStats);

  const styles = getStyles(theme, goalColor);
  const subUnitNames = typeof goal.unit === 'string' ? null : goal.unit.map((u: any) => u.name);

  // Dialog state
  const [statDialogVisible, setStatDialogVisible] = React.useState(false);
  const [statDialogStatId, setStatDialogStatId] = React.useState<number | null>(null);

  const [statDialogLabel, setStatDialogLabel] = React.useState<string>(statDialogStatId !== null ? goal.stats[statDialogStatId].label : "");
  const [statDialogValue, setStatDialogValue] = React.useState<StatValue | null>(statDialogStatId !== null ? goal.stats[statDialogStatId].value : null);
  const [statDialogSubUnit, setStatDialogSubUnit] = React.useState<string | null>(statDialogStatId !== null ? goal.stats[statDialogStatId].subUnit : null);
  const [statDialogPeriod, setStatDialogPeriod] = React.useState<StatPeriod | null>(statDialogStatId !== null ? goal.stats[statDialogStatId].period : null);
  const [statDialogTagFilters, setStatDialogTagFilters] = React.useState<TagFilter[]>(
    statDialogStatId !== null ? goal.stats[statDialogStatId].tagFilters : []);

  const [statDialogSubUnitMenuVisible, setStatDialogSubUnitMenuVisible] = React.useState(false);
  const [statDialogTagsMenuVisible, setStatDialogTagsMenuVisible] = React.useState(false);
  const [statDialogPeriodMenuVisible, setStatDialogPeriodMenuVisible] = React.useState(false);
  const [statDialogValueMenuVisible, setStatDialogValueMenuVisible] = React.useState(false);

  // Value to display in dialog
  const dialogStat = (statDialogValue !== null) && (statDialogPeriod !== null) ? 
    { label: statDialogLabel,
      value: statDialogValue,
      subUnit: statDialogSubUnit,
      period: statDialogPeriod,
      tagFilters: statDialogTagFilters
    } : null;



  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  // Helper to open dialog
  const showStatDialog = (statId: number | null) => {
      setStatDialogVisible(true);
      setStatDialogStatId(statId);
      setStatDialogLabel(statId !== null ? goal.stats[statId].label : "New Stat");
      setStatDialogValue(statId !== null ? goal.stats[statId].value : "mean");
      setStatDialogSubUnit(statId !== null ? goal.stats[statId].subUnit : typeof goal.unit === 'string' ? goal.unit : goal.unit[0].name);
      setStatDialogPeriod(statId !== null ? goal.stats[statId].period : "day");
      setStatDialogTagFilters(statId !== null ? goal.stats[statId].tagFilters : []);
  };

  const dismissStatDialog = () => {
    setStatDialogVisible(false);
    if (dialogStat !== null) {
      if (statDialogStatId === null) { 
        addGoalStat(goalName, dialogStat);
      } else {
        setGoalStat(goalName, statDialogStatId, dialogStat);
      }
    }
  }

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
          <StatView key={index} stat={stat} goal={goal} styles={styles} onPress={() => showStatDialog(index)} />
        ))}
      </View>
      <View style={styles.statsGroup}>
        <Button onPress={() => {
          showStatDialog(null);
        }
        }>
          <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
        </Button>
      </View>
      <Divider />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate("EditDataPoint", { goalName, newDataPoint: true })}
        color={theme.colors.surface}
      />
      {(
        <Portal>
          <Dialog 
            visible={statDialogVisible} 
            style={{ 
              backgroundColor: theme.colors.background, 
            }}
            onDismiss={dismissStatDialog}
          >
            {/* <Dialog.Title>{goal.stats[statDialogStatId].label}</Dialog.Title> */}

            <Dialog.Content>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                <TextInput
                  label="Label"
                  mode="outlined"
                  value={statDialogLabel}
                  onChangeText={setStatDialogLabel}
                  style={{ flex: 1, marginBottom: 0 }}
                />
                <Button
                  compact={true}
                  onPress={() => { 
                    deleteGoalStat(goalName, statDialogStatId);
                    setStatDialogStatId(null);
                    setStatDialogVisible(false);
                  }}
                  style={{ marginLeft: 8 }}
                >
                  <AntDesign name="delete" size={22} color={theme.colors.onSurface} />
                </Button>
              </View>

              <View key="menusRow" style={styles.menusRow}>
                  <SubUnitMenu
                    subUnitNames={subUnitNames}
                    subUnitName={statDialogSubUnit}
                    setSubUnitName={setStatDialogSubUnit}
                    menuVisible={statDialogSubUnitMenuVisible}
                    setMenuVisible={setStatDialogSubUnitMenuVisible}
                    themeColors={theme.colors}
                  />
              </View>

              
                {/* Period */}
                  <DropdownMenu
                    options={allStatPeriods.map((p: StatPeriod) => ({ key: p, label: periodToLabel(p) }))}
                    selectedKey={statDialogPeriod || ""}
                    onSelect={(key: string) => setStatDialogPeriod(key as StatPeriod)}
                    visible={statDialogPeriodMenuVisible}
                    setVisible={setStatDialogPeriodMenuVisible}
                    label="Period"
                    themeColors={theme.colors}
                  />

              {/* Value */}
                  <DropdownMenu
                    options={allStatValues.map((v: StatValue) => ({ key: v, label: valueToLabel(v) }))}
                    selectedKey={statDialogValue || ""}
                    onSelect={(key: string) => setStatDialogValue(key as StatValue)}
                    visible={statDialogValueMenuVisible}
                    setVisible={setStatDialogValueMenuVisible}
                    label="Value"
                    themeColors={theme.colors}
                  />


              {/* Tags */}
                <TagMenu
                  tags={statDialogTagFilters}
                  setTags={setStatDialogTagFilters}
                  menuVisible={statDialogTagsMenuVisible}
                  setMenuVisible={setStatDialogTagsMenuVisible}
                  goalTags={goal.tags}
                  palette={palette}
                  themeColors={theme.colors}
                />

              <View>
                  {dialogStat && (
                    <StatView
                      stat={dialogStat}
                      goal={goal}
                      styles={styles}
                      onPress={() => setStatDialogVisible(false)}
                    />
                  )}
              </View>

            </Dialog.Content>
          </Dialog>
        </Portal>
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
  menusRow: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
  },
});

export default GoalSummary; 