import React, { Fragment } from "react";
import { ScrollView, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import useStore from "../Model/Store";
import {
  ActivityType,
  DataFilter,
  ISODate,
  SortDirection,
  SortKey,
  State,
  StatPeriod,
  SubUnit,
  TagFilter,
  ValueConstraint,
  allStatPeriods,
  dayFromISO,
  defaultDataFilter,
} from "../Model/StoreTypes";
import { filterDataPoints, formatDate, periodToLabel } from "../Model/Activity";
import { numberToString, renderUnit, stringToNumber } from "../Model/Unit";
import DropdownMenu from "../Components/DropdownMenu";
import SegmentedButtons from "../Components/SegmentedButtons";
import TagMenu from "../Components/TagMenu";
import { ValueEditor } from "../Components/UnitView";
import { Button, ButtonRow, CheckButton, Divider, Switch } from "../Components/Element";
import { ListItem } from "../Components/List";
import { useAppTheme } from "../Model/Theme";
import { useToday } from "../Model/useToday";
import { withActivityLock } from "../Components/LockedActivity";

/** The values a filter can bound, one entry per sub-unit; empty for a valueless activity */
type FilterSubUnit = { name: string | null; unit: SubUnit };

/** Bounds as they are being typed, keyed by sub-unit name ("" for a single-valued activity) */
type Bounds = Record<string, { min: string; max: string }>;

const boundsKey = (subUnitName: string | null): string => subUnitName ?? "";

/** A bound the user has not filled in, or has left unparseable, is simply no bound */
const parseBound = (text: string, unit: SubUnit): number | null => {
  const value = stringToNumber(text, unit);
  return value === null || isNaN(value) ? null : value;
};

const Section = ({
  title,
  flush = false,
  children,
}: {
  title: string;
  // Set where the rows bring their own padding, as `ListItem` does
  flush?: boolean;
  children: React.ReactNode;
}) => {
  const theme = useAppTheme();
  return (
    <View style={{ backgroundColor: theme.elevation1, borderRadius: 15, paddingVertical: 12, gap: 10, elevation: 1 }}>
      <View style={{ paddingHorizontal: 16, gap: 10 }}>
        <Text style={{ color: theme.onSurfaceVariant, fontSize: 14 }}>{title}</Text>
        <Divider />
      </View>
      <View style={{ gap: 10, paddingHorizontal: flush ? 0 : 16 }}>{children}</View>
    </View>
  );
};

const EditFilter = ({ navigation, route }: { navigation: any; route: any }) => {
  const { activityPath, day }: { activityPath: { tabId: number; activityId: number }; day: ISODate | undefined } =
    route.params;
  const activity: ActivityType = useStore(
    (state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId],
  );
  const weekStart = useStore((state: State) => state.weekStart);
  const setActivityDataFilter = useStore((state: any) => state.setActivityDataFilter);
  const theme = useAppTheme(activity.color);
  const today = useToday();

  const subUnits: FilterSubUnit[] =
    activity.unit.type === "multiple"
      ? activity.unit.values
      : activity.unit.type === "single"
        ? [{ name: null, unit: activity.unit.unit }]
        : [];

  const filter = activity.dataFilter;

  const [inputPeriod, setInputPeriod] = React.useState<StatPeriod>(filter.period);
  const [inputTagFilters, setInputTagFilters] = React.useState<TagFilter[]>(filter.tagFilters);
  const [inputOnlyWithNote, setInputOnlyWithNote] = React.useState<boolean>(filter.onlyWithNote);
  const [inputSortKey, setInputSortKey] = React.useState<SortKey>(filter.sort.key);
  const [inputSortSubUnit, setInputSortSubUnit] = React.useState<string | null>(
    filter.sort.subUnit ?? subUnits[0]?.name ?? null,
  );
  const [inputSortDirection, setInputSortDirection] = React.useState<SortDirection>(filter.sort.direction);
  const [inputBounds, setInputBounds] = React.useState<Bounds>(() =>
    Object.fromEntries(
      subUnits.map((subUnit) => {
        const constraint = filter.valueConstraints.find((c) => c.subUnit === subUnit.name);
        return [
          boundsKey(subUnit.name),
          {
            min: numberToString(constraint?.min ?? null, subUnit.unit),
            max: numberToString(constraint?.max ?? null, subUnit.unit),
          },
        ];
      }),
    ),
  );

  const [periodMenuVisible, setPeriodMenuVisible] = React.useState(false);
  const [tagsMenuVisible, setTagsMenuVisible] = React.useState(false);
  const [sortMenuVisible, setSortMenuVisible] = React.useState(false);

  const setBound = (subUnitName: string | null, end: "min" | "max", text: string) =>
    setInputBounds((bounds: Bounds) => ({
      ...bounds,
      [boundsKey(subUnitName)]: { ...bounds[boundsKey(subUnitName)], [end]: text },
    }));

  const valueConstraints: ValueConstraint[] = subUnits
    .map((subUnit) => ({
      subUnit: subUnit.name,
      min: parseBound(inputBounds[boundsKey(subUnit.name)].min, subUnit.unit),
      max: parseBound(inputBounds[boundsKey(subUnit.name)].max, subUnit.unit),
    }))
    .filter((c: ValueConstraint) => c.min !== null || c.max !== null);

  const inputFilter: DataFilter = {
    period: inputPeriod,
    tagFilters: inputTagFilters,
    valueConstraints,
    onlyWithNote: inputOnlyWithNote,
    sort: {
      key: inputSortKey,
      subUnit: inputSortKey === "value" ? inputSortSubUnit : null,
      direction: inputSortDirection,
    },
  };

  // What the list would show, so the user sees the filter bite before applying it
  const nListed = filterDataPoints(activity.dataPoints, inputFilter, today, weekStart, day).length;

  const handleApply = () => {
    setActivityDataFilter(activityPath, inputFilter);
    navigation.goBack();
  };

  const handleReset = () => {
    const reset = defaultDataFilter();
    setInputPeriod(reset.period);
    setInputTagFilters(reset.tagFilters);
    setInputOnlyWithNote(reset.onlyWithNote);
    setInputSortKey(reset.sort.key);
    setInputSortSubUnit(subUnits[0]?.name ?? null);
    setInputSortDirection(reset.sort.direction);
    setInputBounds((bounds: Bounds) =>
      Object.fromEntries(Object.keys(bounds).map((key: string) => [key, { min: "", max: "" }])),
    );
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.onHeader,
      headerRight: () => (
        <ButtonRow>
          <Button onPress={handleReset}>
            <MaterialCommunityIcons name="filter-remove" size={22} color={theme.onHeader} />
          </Button>
          <CheckButton onPress={handleApply} color={theme.onHeader} />
        </ButtonRow>
      ),
    });
  }, [navigation, theme, activityPath, inputFilter]);

  // Sorting by value needs a value to sort on, so a valueless activity only sorts by date
  const sortOptions = [
    { key: "date", label: "Date" },
    ...subUnits.map((subUnit: FilterSubUnit) => ({
      key: boundsKey(subUnit.name),
      label: subUnit.name ?? "Value",
    })),
  ];
  const selectedSortKey = inputSortKey === "date" ? "date" : boundsKey(inputSortSubUnit);

  const onSelectSort = (key: string) => {
    if (key === "date") {
      setInputSortKey("date");
    } else {
      setInputSortKey("value");
      setInputSortSubUnit(subUnits.find((s: FilterSubUnit) => boundsKey(s.name) === key)?.name ?? null);
    }
  };

  const boundRow = (subUnit: FilterSubUnit, end: "min" | "max") => {
    const text = inputBounds[boundsKey(subUnit.name)][end];
    const min = parseBound(inputBounds[boundsKey(subUnit.name)].min, subUnit.unit);
    const max = parseBound(inputBounds[boundsKey(subUnit.name)].max, subUnit.unit);
    // Crossed bounds match nothing; say so rather than quietly showing an empty list
    const error = min !== null && max !== null && min > max ? "No value can satisfy both bounds" : null;
    return (
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
        <View style={{ flex: 1 }}>
          <ValueEditor
            unit={subUnit.unit}
            label={end === "min" ? "At least (≥)" : "At most (≤)"}
            value={text}
            error={error}
            activityColor={activity.color}
            onChange={(value: string) => setBound(subUnit.name, end, value)}
          />
        </View>
        <Button
          onPress={() => setBound(subUnit.name, end, "")}
          style={{ marginBottom: 8, opacity: text === "" ? 0.3 : 1 }}
        >
          <MaterialCommunityIcons name="close" size={20} color={theme.onSurfaceVariant} />
        </Button>
      </View>
    );
  };

  return (
    <Fragment>
      <SystemBars style={{ statusBar: "light", navigationBar: theme.variant == "light" ? "dark" : "light" }} />
      <ScrollView>
        <SafeAreaView edges={["left", "right", "bottom"]} style={{ gap: 10, padding: 10 }}>
          <Text style={{ color: theme.onSurfaceVariant, fontSize: 16, textAlign: "center" }}>
            {nListed} of {activity.dataPoints.length} {activity.dataPoints.length === 1 ? "point" : "points"}
          </Text>

          <Section title="Sort by">
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              {subUnits.length > 0 && (
                <DropdownMenu
                  options={sortOptions}
                  selectedKey={selectedSortKey}
                  onSelect={onSelectSort}
                  visible={sortMenuVisible}
                  setVisible={setSortMenuVisible}
                  label="Sort by"
                  theme={theme}
                />
              )}
              <View style={{ flex: 1, minWidth: 200 }}>
                <SegmentedButtons
                  value={inputSortDirection}
                  onValueChange={(value: string) => setInputSortDirection(value as SortDirection)}
                  buttons={[
                    {
                      value: "descending",
                      label: inputSortKey === "date" ? "Newest" : "Highest",
                      icon: "sort-descending",
                    },
                    {
                      value: "ascending",
                      label: inputSortKey === "date" ? "Oldest" : "Lowest",
                      icon: "sort-ascending",
                    },
                  ]}
                />
              </View>
            </View>
          </Section>

          <Section title="Date">
            <DropdownMenu
              options={allStatPeriods.map((p: StatPeriod) => ({ key: p, label: periodToLabel(p) }))}
              selectedKey={inputPeriod}
              onSelect={(key: string) => setInputPeriod(key as StatPeriod)}
              visible={periodMenuVisible}
              setVisible={setPeriodMenuVisible}
              label="Period"
              theme={theme}
            />
            {day !== undefined && (
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 12 }}>
                The list is pinned to {formatDate(dayFromISO(day))}, so the period is not applied to it.
              </Text>
            )}
          </Section>

          {activity.tags.length > 0 && (
            <Section title="Tags">
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <TagMenu
                  activity={activity}
                  tags={inputTagFilters}
                  onChange={(tags: TagFilter[]) => setInputTagFilters(tags)}
                  menuVisible={tagsMenuVisible}
                  setMenuVisible={setTagsMenuVisible}
                  activityTags={activity.tags}
                />
                <Text style={{ flex: 1, color: theme.onSurfaceVariant, fontSize: 12 }}>
                  {inputTagFilters.length === 0
                    ? "Any tags"
                    : inputTagFilters.map((t: TagFilter) => (t.state === "yes" ? t.name : `not ${t.name}`)).join(", ")}
                </Text>
              </View>
            </Section>
          )}

          {subUnits.map((subUnit: FilterSubUnit) => (
            <Section
              key={boundsKey(subUnit.name)}
              title={subUnit.name === null ? renderUnit(subUnit.unit) : `${subUnit.name} — ${renderUnit(subUnit.unit)}`}
            >
              {boundRow(subUnit, "min")}
              {boundRow(subUnit, "max")}
            </Section>
          ))}

          <Section title="Notes" flush>
            <ListItem
              title="Only points with a note"
              icon="note-text-outline"
              onPress={() => setInputOnlyWithNote(!inputOnlyWithNote)}
              right={<Switch value={inputOnlyWithNote} onValueChange={setInputOnlyWithNote} />}
            />
          </Section>
        </SafeAreaView>
      </ScrollView>
    </Fragment>
  );
};

export default withActivityLock(EditFilter);
