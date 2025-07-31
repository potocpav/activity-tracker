import React from "react";
import { Animated, FlatList, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from "react-native";
import { useTheme, FAB, Divider, Portal, Dialog, Button, TextInput } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType, Stat, StatPeriod, StatValue, TagFilter, Tag, allStatPeriods, allStatValues } from "./StoreTypes";
import { renderValueSummary, formatDate } from "./ActivityData";
import { lightPalette, darkPalette } from "./Color";
import { renderTags, valueToLabel, periodToLabel, calcStatValue } from "./ActivityUtil";
import TagMenu from "./TagMenu";
import SubUnitMenu from "./SubUnitMenu";
import DropdownMenu from "./DropdownMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import StatView from "./StatView";


export const EditStat = ({ navigation, activityName, statRowId, statColId, stat, visible, onDismiss }: { navigation: any, activityName: string, statRowId: number | null, statColId: number | null, stat: Stat | null, visible: boolean, onDismiss: () => void }) => {
  const theme = useTheme();
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const activityColor = palette[activity.color];
  const addActivityStat = useStore((state: any) => state.addActivityStat);
  const setActivityStat = useStore((state: any) => state.setActivityStat);
  const deleteActivityStat = useStore((state: any) => state.deleteActivityStat);

  const styles = getStyles(theme, activityColor);
  const subUnitNames = Array.isArray(activity.unit) ? activity.unit.map((u: any) => u.name) : null;

  // Initialize state based on the provided stat or defaults
  const [inputLabel, setInputLabel] = React.useState<string>(stat?.label || "New Stat");
  const [inputValue, setInputValue] = React.useState<StatValue | null>(stat?.value || "mean");
  const [inputSubUnit, setInputSubUnit] = React.useState<string | null>(stat?.subUnit || (Array.isArray(activity.unit) ? activity.unit[0].name : null));
  const [inputPeriod, setInputPeriod] = React.useState<StatPeriod | null>(stat?.period || "today");
  const [inputTagFilters, setInputTagFilters] = React.useState<TagFilter[]>(stat?.tagFilters || []);

  const [subUnitMenuVisible, setSubUnitMenuVisible] = React.useState(false);
  const [tagsMenuVisible, setTagsMenuVisible] = React.useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = React.useState(false);
  const [valueMenuVisible, setValueMenuVisible] = React.useState(false);

  // Update state when stat prop changes
  React.useEffect(() => {
    if (stat) {
      setInputLabel(stat.label);
      setInputValue(stat.value);
      setInputSubUnit(stat.subUnit);
      setInputPeriod(stat.period);
      setInputTagFilters(stat.tagFilters);
    } else {
      setInputLabel("New Stat");
      setInputValue("mean");
      setInputSubUnit(Array.isArray(activity.unit) ? activity.unit[0].name : null);
      setInputPeriod("today");
      setInputTagFilters([]);
    }
  }, [stat, activity.unit]);

  // Value to display in dialog
  const dialogStat = (inputValue !== null) && (inputPeriod !== null) ?
    {
      label: inputLabel,
      value: inputValue,
      subUnit: inputSubUnit,
      period: inputPeriod,
      tagFilters: inputTagFilters
    } : null;

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  const handleDismiss = () => {
    if (dialogStat !== null) {
      if (statRowId === null) {
        addActivityStat(activityName, dialogStat, null);
      } else {
        if (statColId === null) {
          addActivityStat(activityName, dialogStat, statRowId);
        } else {
          setActivityStat(activityName, statRowId, statColId, dialogStat);
        }
      }
    }
    onDismiss();
  };

  const handleDelete = () => {
    if (statRowId !== null && statColId !== null) {
      deleteActivityStat(activityName, statRowId, statColId);
    }
    onDismiss();
  };

  return (
    <Dialog
      visible={visible}
      style={{
        backgroundColor: theme.colors.background,
      }}
      onDismiss={handleDismiss}
    >
      <Dialog.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
          <TextInput
            label="Label"
            mode="outlined"
            value={inputLabel}
            onChangeText={setInputLabel}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <Button
            compact={true}
            onPress={handleDelete}
            style={{ marginLeft: 8 }}
          >
            <AntDesign name="delete" size={22} color={theme.colors.onSurface} />
          </Button>
        </View>

        <View key="menusRow" style={styles.menusRow}>
          <SubUnitMenu
            subUnitNames={subUnitNames}
            subUnitName={inputSubUnit}
            setSubUnitName={setInputSubUnit}
            menuVisible={subUnitMenuVisible}
            setMenuVisible={setSubUnitMenuVisible}
            themeColors={theme.colors}
          />
        </View>


        {/* Period */}
        <DropdownMenu
          options={allStatPeriods.map((p: StatPeriod) => ({ key: p, label: periodToLabel(p) }))}
          selectedKey={inputPeriod || ""}
          onSelect={(key: string) => setInputPeriod(key as StatPeriod)}
          visible={periodMenuVisible}
          setVisible={setPeriodMenuVisible}
          label="Period"
          themeColors={theme.colors}
        />

        {/* Value */}
        <DropdownMenu
          options={allStatValues.map((v: StatValue) => ({ key: v, label: valueToLabel(v) }))}
          selectedKey={inputValue || ""}
          onSelect={(key: string) => setInputValue(key as StatValue)}
          visible={valueMenuVisible}
          setVisible={setValueMenuVisible}
          label="Value"
          themeColors={theme.colors}
        />


        {/* Tags */}
        <TagMenu
          tags={inputTagFilters}
          onChange={(tags) => setInputTagFilters(tags)}
          menuVisible={tagsMenuVisible}
          setMenuVisible={setTagsMenuVisible}
          activityTags={activity.tags}
          palette={palette}
          themeColors={theme.colors}
        />

        <View style={{ flexDirection: 'row' }}>
          {dialogStat && (
            <StatView
              stat={dialogStat}
              activity={activity}
              onPress={() => {}}
            />
          )}
        </View>

      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={handleDismiss}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const getStyles = (theme: any, goalColor: string) => StyleSheet.create({
  menusRow: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 5,
  },
});

export default EditStat; 