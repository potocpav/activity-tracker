import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  NativeModules,
} from "react-native";
import { useTheme, DataTable, FAB } from 'react-native-paper';
import useStore, { DataPoint, GoalType, Tag, Unit } from "./Store";
import { darkPalette, lightPalette } from "./Color";
import { renderTags } from "./GoalUtil";
import TagMenu from "./TagMenu";
import Calendar from "./Calendar";
import ValueMenu, { Value } from "./ValueMenu";
const locale = NativeModules.I18nManager.localeIdentifier;

type GoalCalendarProps = {
  navigation: any;
  route: any;
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

const GoalCalendar = ({ navigation, route }: GoalCalendarProps) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const goalColor = palette[goal.color];

  const [tags, setTags] = useState<{ name: string; state: "yes" | "no" | "maybe" }[]>(goal.tags.map((t: Tag) => ({ name: t.name, state: "maybe" })));
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);

  const [displayValue, setDisplayValue] = useState<Value>("count");
  const [valueMenuVisible, setValueMenuVisible] = useState(false);

  const [subValue, setSubValue] = useState<string | null>(null);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const requiredTags = tags.filter((t) => t.state === "yes").map(t => t.name);
  const negativeTags = tags.filter((t) => t.state === "no").map(t => t.name);
  const filteredDataPoints = goal.dataPoints
    .map((o: DataPoint, i: number) => [o, i])
    .filter(([dataPoint, i]: [DataPoint, number]) => {
      const hasAllRequired = requiredTags.every(tag => dataPoint.tags.includes(tag));
      const hasAnyNegative = negativeTags.some(tag => dataPoint.tags.includes(tag));
      return hasAllRequired && !hasAnyNegative;
    })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
      {goal.tags.length > 0 && (
          <TagMenu
            tags={tags}
            setTags={setTags}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            goalTags={goal.tags}
            palette={palette}
            themeColors={theme.colors}
          />
        )}
          <ValueMenu
            value={displayValue}
            setValue={setDisplayValue}
            menuVisible={valueMenuVisible}
            setMenuVisible={setValueMenuVisible}
            themeColors={theme.colors}
          />
        </View>
        <Calendar 
          goalName={goalName} 
          palette={palette} 
          colorIndex={goal.color} 
          dataPoints={filteredDataPoints} 
          firstDpTime={goal.dataPoints[0].time || null } 
          displayValue={displayValue}
          subValue={subValue} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GoalCalendar; 