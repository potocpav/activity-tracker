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
import { DataPoint, dateListToTime, GoalType, Tag, TagFilter, Unit, StatValue } from "./StoreTypes";
import { darkPalette, lightPalette } from "./Color";
import TagMenu from "./TagMenu";
import Calendar from "./Calendar";
import ValueMenu from "./ValueMenu";
const locale = NativeModules.I18nManager.localeIdentifier;

type GoalCalendarProps = {
  navigation: any;
  goalName: string;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};

export const renderValueSummary = (value: any, unit: Unit, style: any, short = false) => {
  if (typeof value === "number" && typeof unit === "string") {
    return (
      <Text style={style}>{`${Math.round(value * 100) / 100} ${unit}`}</Text>
    );
  } else if (typeof value === "object" && typeof unit === "object") {
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
  } else if (typeof value === "object" && typeof unit === "object") {
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

const GoalCalendar = ({ navigation, goalName }: GoalCalendarProps) => {
  const theme = useTheme();
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const goalColor = palette[goal.color];
  const weekStart = useStore((state: any) => state.weekStart);

  const setGoalCalendar = useStore((state: any) => state.setGoalCalendar);

  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);

  const [valueMenuVisible, setValueMenuVisible] = useState(false);

  const [subValue, setSubValue] = useState<string | null>(null);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Calendar
        navigation={navigation}
        goalName={goalName}
        palette={palette}
        colorIndex={goal.color}
        dataPoints={goal.dataPoints}
        firstDpDate={goal.dataPoints[0]?.date || null}
        weekStart={weekStart}
        calendarProps={goal.calendar}
         />
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {goal.tags.length > 0 && (
          <TagMenu
            tags={goal.calendar.tagFilters}
            onChange={(tags) => {
              setGoalCalendar(goalName, { ...goal.calendar, tagFilters: tags });
            }}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            goalTags={goal.tags}
            palette={palette}
            themeColors={theme.colors}
          />
        )}
        <ValueMenu
          value={goal.calendar.value}
          onChange={(v: StatValue) => setGoalCalendar(goalName, { ...goal.calendar, value: v })}
          menuVisible={valueMenuVisible}
          setMenuVisible={setValueMenuVisible}
          themeColors={theme.colors}
          valueList={["n_points", "sum", "mean", "max", "min", "last"]}
        />
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

export default GoalCalendar; 