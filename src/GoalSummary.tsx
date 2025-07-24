import React from "react";
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme, FAB, Divider, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, DateList, dateToDateList, GoalType, Stat, StatPeriod, StatValue, TagFilter, Tag, allStatPeriods, allStatValues } from "./StoreTypes";
import { renderValueSummary, formatDate } from "./GoalData";
import { lightPalette, darkPalette } from "./Color";
import { renderTags, findZeroSlice, statPeriodCmp, extractValue, formatNumber, valueToLabel, periodToLabel, extractStatValue } from "./GoalUtil";
import TagMenu from "./TagMenu";
import SubUnitMenu from "./SubUnitMenu";
import DropdownMenu from "./DropdownMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import GoalGraph from "./GoalGraph";
import GoalCalendar from "./GoalCalendar";
import { DropProvider, Draggable, Droppable, DropProviderRef } from 'react-native-reanimated-dnd';
import { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const calcStatValue = (stat: Stat, goal: GoalType) => {
  const today = dateToDateList(new Date());
  const lastActive = goal.dataPoints.length > 0 ?
    goal.dataPoints[goal.dataPoints.length - 1].date :
    null;
  const periodSlice = findZeroSlice(
    goal.dataPoints,
    (dp: DataPoint) => statPeriodCmp(dp, stat.period, today, lastActive)
  );
  return extractStatValue(goal.dataPoints.slice(...periodSlice), stat.tagFilters, stat.subUnit, stat.value);
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


const GoalSummary = ({ navigation, goalName }: { navigation: any, goalName: string }) => {
  const theme = useTheme();
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
    {
      label: statDialogLabel,
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
  const dropProviderRef = React.useRef<DropProviderRef>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView onLayout={() => {
        // Trigger update after scroll view layout
        dropProviderRef.current?.requestPositionUpdate();
      }}>
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

        { /* Stats */}
        <DropProvider ref={dropProviderRef}>
          <View style={styles.statsGroup}>
            {goal.stats.map((stat: Stat, index: number) => (
              <View key={`stat-${index}`}>
                <View style={{ flex: 1, width: 100, height: 100}}>
                {/* <Droppable key={`stat-${index}`} droppableId={`stat-${index}`} onDrop={() => { console.log("dropped", index) }}> */}
                  {/* <Draggable 
                    data={{ id: '1', name: 'Task 1' }} 
                    onDragStart={() => {
                      console.log("drag start");
                    }}
                    onDragEnd={() => {
                      console.log("drag end");
                    }}
                    animationFunction={(toValue) => {
                    'worklet';
                    return withSpring(toValue, {
                      damping: 150,
                      stiffness: 1500
                    })
                  }}> */}
                    <StatView key={index} stat={stat} goal={goal} styles={styles} onPress={() => showStatDialog(index)} />
                  {/* </Draggable>
                </Droppable> */}
                {/* </Animated.View> */}
                </View>
              </View>
            ))}
          </View>
        </DropProvider>

        { /* Add Stat */}
        <View style={styles.statsGroup}>
          <Button onPress={() => {
            showStatDialog(null);
          }
          }>
            <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
          </Button>
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
                onChange={(tags) => setStatDialogTagFilters(tags)}
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