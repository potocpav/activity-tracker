import React, { Fragment } from "react";
import { ScrollView, Text, ToastAndroid, View } from "react-native";
import { Button, TextInput } from 'react-native-paper';
import useStore from "../Model/Store";
import { ActivityType, Stat, StatPeriod, StatValue, TagFilter, allStatPeriods, unaryStatValues, numericStatValues } from "../Model/StoreTypes";
import { valueToLabel, periodToLabel } from "../Model/Activity";
import TagMenu from "../Components/TagMenu";
import SubUnitMenu from "../Components/SubUnitMenu";
import DropdownMenu from "../Components/DropdownMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import StatView from "../Components/StatView";
import { getTheme, getThemeVariant } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";


export const EditStat = (
  { navigation, route }:
    {
      navigation: any,
      route: any,
    }) => {
  const activities = useStore((state: any) => state.activities);
  const { activityName, statId } = route.params;
  const activity: ActivityType = activities.find((a: ActivityType) => a.name === activityName);
  const stat = activity?.stats[statId];
  const theme = getTheme(activity.color);
  const themeVariant = getThemeVariant();
  const cloneActivityStat = useStore((state: any) => state.cloneActivityStat);
  const setActivityStat = useStore((state: any) => state.setActivityStat);
  const deleteActivityStat = useStore((state: any) => state.deleteActivityStat);

  const subUnitNames = activity.unit.type === "multiple" ? activity.unit.values.map(u => u.name) : null;

  // Initialize state based on the provided stat or defaults
  const [inputLabel, setInputLabel] = React.useState<string>(stat?.label || "New Stat");
  const [inputValue, setInputValue] = React.useState<StatValue | null>(stat?.value || "mean");
  const [inputSubUnit, setInputSubUnit] = React.useState<string | null>(stat?.subUnit || (activity.unit.type === "multiple" ? activity.unit.values[0].name : null));
  const [inputPeriod, setInputPeriod] = React.useState<StatPeriod | null>(stat?.period || "today");
  const [inputTagFilters, setInputTagFilters] = React.useState<TagFilter[]>(stat?.tagFilters || []);

  const [tagsMenuVisible, setTagsMenuVisible] = React.useState(false);
  const [periodMenuVisible, setPeriodMenuVisible] = React.useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = React.useState(false);
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
      setInputSubUnit(activity.unit.type === "multiple" ? activity.unit.values[0].name : null);
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

  const handleApply = () => {
    if (dialogStat !== null) { 
        setActivityStat(activityName, statId, dialogStat);
    }
    navigation.goBack();
  };

  const handleDuplicate = () => {
    if (statId !== null) {
      cloneActivityStat(activityName, statId);
      ToastAndroid.show('Stat cloned', ToastAndroid.SHORT);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (statId !== null) {
      deleteActivityStat(activityName, statId);
      ToastAndroid.show('Stat deleted', ToastAndroid.SHORT);
    }
    navigation.goBack();
  };

  const statValues = (activity.unit.type === "none" ? unaryStatValues : numericStatValues)
    .map((v: StatValue) => ({ key: v, label: valueToLabel(v) }));

  React.useEffect(() => {
    navigation.setOptions({
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => (
        <>
          <Button compact={true} onPress={handleApply}><AntDesign name="check" size={24} color={"#ffffff"} /></Button>
          <Button
            compact={true}
            onPress={handleDuplicate}
            style={{ marginLeft: 8 }}
          >
            <AntDesign name="copy1" size={22} color={"#ffffff"} />
          </Button>
          <Button
            compact={true}
            onPress={handleDelete}
            style={{ marginLeft: 8 }}
          >
            <AntDesign name="delete" size={22} color={"#ffffff"} />
          </Button>
        </>
      ),
    });
  }, [activityName, navigation, theme, activity]);


  return (
    <Fragment>
      <SystemBars style={"light"} />
      <ScrollView>
        <SafeAreaView edges={["left", "right", "bottom"]}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', elevation: 2, backgroundColor: theme.colors.elevation.level1, marginBottom: 10, marginHorizontal: 4 }}>
            {dialogStat && (
              <StatView
                sharedTransitionTag="tag"
                stat={dialogStat}
                activity={activity}
                onPress={() => { }}
              />
            )}
          </View>

          <TextInput
            label="Label"
            mode="outlined"
            value={inputLabel}
            onChangeText={setInputLabel}
            style={{ flex: 1, margin: 10 }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center', marginVertical: 5 }}>
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

            {/* SubUnit menu */}
            <SubUnitMenu
              subUnitNames={subUnitNames}
              subUnitName={inputSubUnit}
              setSubUnitName={(name) => setInputSubUnit(name)}
              menuVisible={subUnitMenuVisible}
              setMenuVisible={setSubUnitMenuVisible}
              themeColors={theme.colors}
            />

            {/* Value */}
            <DropdownMenu
              options={statValues}
              selectedKey={inputValue || ""}
              onSelect={(key: string) => setInputValue(key as StatValue)}
              visible={valueMenuVisible}
              setVisible={setValueMenuVisible}
              label="Value"
              themeColors={theme.colors}
            />


            {/* Tags */}
            {activity.tags.length > 0 && (
              <TagMenu
                tags={inputTagFilters}
                onChange={(tags) => setInputTagFilters(tags)}
                menuVisible={tagsMenuVisible}
                setMenuVisible={setTagsMenuVisible}
                activityTags={activity.tags}
                activity={activity}
              />
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
    </Fragment>
  );
};

export default EditStat; 