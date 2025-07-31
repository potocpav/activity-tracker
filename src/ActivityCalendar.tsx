import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  NativeModules,
} from "react-native";
import { useTheme } from 'react-native-paper';
import useStore from "./Store";
import { ActivityType, Unit, StatValue } from "./StoreTypes";
import { darkPalette, lightPalette } from "./Color";
import TagMenu from "./TagMenu";
import Calendar from "./Calendar";
import ValueMenu from "./ValueMenu";
import SubUnitMenu from "./SubUnitMenu";
const locale = NativeModules.I18nManager.localeIdentifier;

type ActivityCalendarProps = {
  navigation: any;
  activityName: string;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};

export const renderValueSummary = (value: any, unit: Unit, style: any, short = false) => {
  if (typeof value === "number" && typeof unit === "string") {
    return (
      <Text style={style}>{`${Math.round(value * 100) / 100} ${unit}`}</Text>
    );
  } else if (typeof value === "object" && Array.isArray(unit)) {
    var parts: string[] = [];
    unit.forEach((u: any) => {
      if (value[u.name] !== null && value[u.name] !== undefined) {
        parts.push(`${value[u.name]} ${u.symbol}`);
      }
    });
    if (short) {
      parts = parts.slice(0, 1);
    }
    return (
      parts.map((p: string, i: number) => (
        <Text style={style} key={i}>{p}</Text>
      ))
    );
  } else {
    return <Text style={style}>-</Text>
  }
};

export const renderValue = (value: any, unit: Unit) => {
  if (typeof value === "number" && typeof unit === "string") {
    return `${Math.round(value * 100) / 100} ${unit}`;
  } else if (typeof value === "object" && Array.isArray(unit)) {
    const parts: string[] = [];
    unit.forEach((u: any) => {
      if (value[u.name] !== null && value[u.name] !== undefined) {
        parts.push(`${value[u.name]} ${u.symbol}`);
      }
    });
    return parts.join(", ");
  } else {
    return "n/a"
  }
};

const ActivityCalendar = ({ navigation, activityName }: ActivityCalendarProps) => {
  const theme = useTheme();
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;

  const setActivityCalendar = useStore((state: any) => state.setActivityCalendar);

  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [valueMenuVisible, setValueMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);

  const subUnitNames = Array.isArray(activity.unit) ? activity.unit.map((u: any) => u.name) : null;

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Calendar navigation={navigation} activityName={activityName}/>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {activity.tags.length > 0 && (
          <TagMenu
            tags={activity.calendar.tagFilters}
            onChange={(tags) => {
              setActivityCalendar(activityName, { ...activity.calendar, tagFilters: tags });
            }}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            activityTags={activity.tags}
            palette={palette}
            themeColors={theme.colors}
          />
        )}
        {/* SubUnit menu */}
        <SubUnitMenu
          subUnitNames={subUnitNames}
          subUnitName={activity.calendar.subUnit}
          setSubUnitName={(name) => setActivityCalendar(activityName, { ...activity.calendar, subUnit: name })}
          menuVisible={subUnitMenuVisible}
          setMenuVisible={setSubUnitMenuVisible}
          themeColors={theme.colors}
        />
        {activity.unit !== null && <ValueMenu
          value={activity.calendar.value}
          onChange={(v: StatValue) => setActivityCalendar(activityName, { ...activity.calendar, value: v })}
          menuVisible={valueMenuVisible}
          setMenuVisible={setValueMenuVisible}
          themeColors={theme.colors}
          valueList={["n_points", "sum", "mean", "max", "min", "last"]}
        />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 16,
  },
});

export default ActivityCalendar; 