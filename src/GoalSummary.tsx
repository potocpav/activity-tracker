import React from "react";
import { Animated, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { useTheme, FAB, Divider, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import useStore from "./Store";
import { GoalType, Stat, StatPeriod, StatValue, TagFilter, Tag, allStatPeriods, allStatValues } from "./StoreTypes";
import { renderValueSummary, formatDate } from "./GoalData";
import { lightPalette, darkPalette } from "./Color";
import { renderTags, valueToLabel, periodToLabel, calcStatValue } from "./GoalUtil";
import TagMenu from "./TagMenu";
import SubUnitMenu from "./SubUnitMenu";
import DropdownMenu from "./DropdownMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import GoalGraph from "./GoalGraph";
import GoalCalendar from "./GoalCalendar";


const StatView = ({ stat, goal, styles, onPress }: { stat: Stat, goal: GoalType, styles: any, onPress: () => void }) => {
  const value = calcStatValue(stat, goal);
  const unit = ["n_days", "n_points"].includes(stat.value) ? "" : goal.unit;
  return (
    <Pressable 
      // style={styles.statInnerContainer} 
      onPress={onPress}
      style={({pressed}) => [
        styles.statInnerContainer,
        {
          opacity: pressed ? 0.5 : 1,
        },
      ]}
      >
      <View style={{ flex: 1, flexDirection: 'column', alignItems: 'center' }}>
        {/* <Text style={styles.statValue}>{formatNumber(value)}</Text> */}
        <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{renderValueSummary(value, unit)}</Text>
        <Text style={styles.statsLabel} numberOfLines={2} adjustsFontSizeToFit>{stat.label}</Text>
      </View>
    </Pressable>
  );
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

  const styles = getStyles(theme, goalColor);
  const subUnitNames = typeof goal.unit === 'string' ? null : goal.unit.map((u: any) => u.name);

  // Dialog state
  const [statDialogVisible, setStatDialogVisible] = React.useState(false);
  const [statDialogStatRowId, setStatDialogStatRowId] = React.useState<number | null>(null);
  const [statDialogStatColId, setStatDialogStatColId] = React.useState<number | null>(null);

  const [statDialogLabel, setStatDialogLabel] = React.useState<string>(statDialogStatRowId !== null && statDialogStatColId !== null ? goal.stats[statDialogStatRowId][statDialogStatColId].label : "");
  const [statDialogValue, setStatDialogValue] = React.useState<StatValue | null>(statDialogStatRowId !== null && statDialogStatColId !== null ? goal.stats[statDialogStatRowId][statDialogStatColId].value : null);
  const [statDialogSubUnit, setStatDialogSubUnit] = React.useState<string | null>(statDialogStatRowId !== null && statDialogStatColId !== null ? goal.stats[statDialogStatRowId][statDialogStatColId].subUnit : null);
  const [statDialogPeriod, setStatDialogPeriod] = React.useState<StatPeriod | null>(statDialogStatRowId !== null && statDialogStatColId !== null ? goal.stats[statDialogStatRowId][statDialogStatColId].period : null);
  const [statDialogTagFilters, setStatDialogTagFilters] = React.useState<TagFilter[]>(
    statDialogStatRowId !== null && statDialogStatColId !== null ? goal.stats[statDialogStatRowId][statDialogStatColId].tagFilters : []);

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
  const showStatDialog = (statRowId: number | null, statColId: number | null) => {
    setStatDialogVisible(true);
    setStatDialogStatRowId(statRowId);
    setStatDialogStatColId(statColId);
    setStatDialogLabel(statRowId !== null && statColId !== null ? goal.stats[statRowId][statColId].label : "New Stat");
    setStatDialogValue(statRowId !== null && statColId !== null ? goal.stats[statRowId][statColId].value : "mean");
    setStatDialogSubUnit(statRowId !== null && statColId !== null ? goal.stats[statRowId][statColId].subUnit : typeof goal.unit === 'string' ? goal.unit : goal.unit[0].name);
    setStatDialogPeriod(statRowId !== null && statColId !== null ? goal.stats[statRowId][statColId].period : "day");
    setStatDialogTagFilters(statRowId !== null && statColId !== null ? goal.stats[statRowId][statColId].tagFilters : []);
  };

  const dismissStatDialog = () => {
    setStatDialogVisible(false);
    if (dialogStat !== null) {
      if (statDialogStatRowId === null) {
        addGoalStat(goalName, dialogStat, null);
      } else {
        if (statDialogStatColId === null) {
          addGoalStat(goalName, dialogStat, statDialogStatRowId);
        } else {
          setGoalStat(goalName, statDialogStatRowId, statDialogStatColId, dialogStat);
        }
      }
    }
  }

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
                <StatView key={index} stat={stat} goal={goal} styles={styles} onPress={() => 
                  showStatDialog(rowIndex, index)} />
              ))}

            {statRow.length > 0 && (
              <Pressable
                onPress={() => {
                  showStatDialog(rowIndex, null);
              }}
              style={({pressed}) => [
                {
                  margin: 8,
                  position: 'absolute',
                  right: -10,
                  top: 20,
                  opacity: pressed ? 0.5 : 1,
                },
              ]}
            >
              <View style={{position: 'absolute', right: 0, bottom: 0 }}>
                <AntDesign name="plus" size={24} color={theme.colors.outlineVariant} />
              </View>
            </Pressable>
            )}
          </View>
        ))}

        { /* Add Stat */}
        <View style={{margin: 10, flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end'}}>
          <Pressable
            onPress={() => {
              showStatDialog(null, null);
            }}
            style={({pressed}) => [
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
                    deleteGoalStat(goalName, statDialogStatRowId, statDialogStatColId);
                    setStatDialogStatRowId(null);
                    setStatDialogStatColId(null);
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
  statContainer: {
    flex: 1,
    // justifyContent: 'space-around',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statInnerContainer: {
    flex: 1,
    // justifyContent: 'space-around',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingVertical: 18,
  },
  statsLabel: {
    fontSize: 16,
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