import React, { Fragment } from "react";
import { ScrollView, ToastAndroid, View } from "react-native";
import useStore from "../Model/Store";
import {
  ActivityType,
  StatPeriod,
  StatValue,
  TagFilter,
  allStatPeriods,
  unaryStatValues,
  numericStatValues,
  State,
} from "../Model/StoreTypes";
import { valueToLabel, periodToLabel } from "../Model/Activity";
import TagMenu from "../Components/TagMenu";
import SubUnitMenu from "../Components/SubUnitMenu";
import DropdownMenu from "../Components/DropdownMenu";
import StatView from "../Components/StatView";
import TextField from "../Components/TextField";
import { useAppTheme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { ButtonRow, CheckButton, CopyButton, DeleteButton } from "../Components/Element";

export const EditStat = ({ navigation, route }: { navigation: any; route: any }) => {
  const { activityPath, statId } = route.params;
  const activity: ActivityType = useStore(
    (state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId],
  );
  const stat = activity.stats[statId];
  const theme = useAppTheme(activity.color);
  const cloneActivityStat = useStore((state: any) => state.cloneActivityStat);
  const setActivityStat = useStore((state: any) => state.setActivityStat);
  const deleteActivityStat = useStore((state: any) => state.deleteActivityStat);

  const subUnitNames = activity.unit.type === "multiple" ? activity.unit.values.map((u) => u.name) : null;

  // Initialize state based on the provided stat or defaults
  const [inputLabel, setInputLabel] = React.useState<string>(stat?.label || "New Stat");
  const [inputValue, setInputValue] = React.useState<StatValue | null>(stat?.value || "mean");
  const [inputSubUnit, setInputSubUnit] = React.useState<string | null>(
    stat?.subUnit || (activity.unit.type === "multiple" ? activity.unit.values[0].name : null),
  );
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
  const dialogStat =
    inputValue !== null && inputPeriod !== null
      ? {
          label: inputLabel,
          value: inputValue,
          subUnit: inputSubUnit,
          period: inputPeriod,
          tagFilters: inputTagFilters,
        }
      : null;

  const handleApply = () => {
    if (dialogStat !== null) {
      setActivityStat(activityPath, statId, dialogStat);
    }
    navigation.goBack();
  };

  const handleDuplicate = () => {
    if (statId !== null) {
      cloneActivityStat(activityPath, statId);
      ToastAndroid.show("Stat cloned", ToastAndroid.SHORT);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (statId !== null) {
      deleteActivityStat(activityPath, statId);
      ToastAndroid.show("Stat deleted", ToastAndroid.SHORT);
    }
    navigation.goBack();
  };

  const statValues = (activity.unit.type === "none" ? unaryStatValues : numericStatValues).map((v: StatValue) => ({
    key: v,
    label: valueToLabel(v),
  }));

  React.useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.onHeader,
      headerRight: () => (
        <ButtonRow>
          <CheckButton onPress={handleApply} color={theme.onHeader} />
          <CopyButton onPress={handleDuplicate} color={theme.onHeader} />
          {activity.stats.length > 1 && <DeleteButton onPress={handleDelete} color={theme.onHeader} />}
        </ButtonRow>
      ),
    });
  }, [activityPath, dialogStat, navigation, theme, activity]);

  return (
    <Fragment>
      <SystemBars style={{ statusBar: "light", navigationBar: theme.variant == "light" ? "dark" : "light" }} />
      <ScrollView>
        <SafeAreaView edges={["left", "right", "bottom"]}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              elevation: 2,
              backgroundColor: theme.elevation1,
              marginBottom: 10,
              marginHorizontal: 4,
            }}
          >
            {dialogStat && (
              <StatView sharedTransitionTag="tag" stat={dialogStat} activity={activity} onPress={() => {}} />
            )}
          </View>

          <TextField
            label="Label"
            activityColor={activity.color}
            value={inputLabel}
            onChangeText={setInputLabel}
            containerStyle={{ flex: 1, margin: 10 }}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              flexWrap: "wrap",
              justifyContent: "center",
              marginVertical: 5,
            }}
          >
            {/* Period */}
            <DropdownMenu
              options={allStatPeriods.map((p: StatPeriod) => ({ key: p, label: periodToLabel(p) }))}
              selectedKey={inputPeriod || ""}
              onSelect={(key: string) => setInputPeriod(key as StatPeriod)}
              visible={periodMenuVisible}
              setVisible={setPeriodMenuVisible}
              label="Period"
              theme={theme}
            />

            {/* SubUnit menu */}
            <SubUnitMenu
              subUnitNames={subUnitNames}
              subUnitName={inputSubUnit}
              setSubUnitName={(name) => setInputSubUnit(name)}
              menuVisible={subUnitMenuVisible}
              setMenuVisible={setSubUnitMenuVisible}
              theme={theme}
            />

            {/* Value */}
            <DropdownMenu
              options={statValues}
              selectedKey={inputValue || ""}
              onSelect={(key: string) => setInputValue(key as StatValue)}
              visible={valueMenuVisible}
              setVisible={setValueMenuVisible}
              label="Value"
              theme={theme}
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
