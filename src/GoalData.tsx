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
const locale = NativeModules.I18nManager.localeIdentifier;

type GoalDataProps = {
  navigation: any;
  route: any;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  // return date.toUTCString();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const renderValueSummary = (value: any, unit: Unit, style: any, short = false) => {
  if (typeof value === "number" && typeof unit === "string") {
    return (
      <Text style={style}>{`${Math.round(value * 100) / 100} ${unit}`}</Text>
    );
  } else if (typeof value === "object" && typeof unit === "object") {
    // Handle complex units (like finger strength with mean, max, tut)
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
      // <View style={{flexDirection: 'column'}}>
      parts.map((p: string, i: number) => (
        <Text style={style} key={i}>{p}</Text>
      ))
      // </View>
    );
  } else {
    return <Text style={style}>-</Text>
  }
};

export const renderValue = (value: any, unit: Unit) => {
  if (typeof value === "number" && typeof unit === "string") {
    return `${Math.round(value * 100) / 100} ${unit}`;
  } else if (typeof value === "object" && typeof unit === "object") {
    // Handle complex units (like finger strength with mean, max, tut)
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

const GoalData = ({ navigation, route }: GoalDataProps) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const goalColor = palette[goal.color];

  // Tag filter state
  const [tags, setTags] = useState<{ name: string; state: "yes" | "no" | "maybe" }[]>(goal.tags.map((t: Tag) => ({ name: t.name, state: "maybe" })));
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  // Filtering logic
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
      {goal.tags.length > 0 && (
        <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
          <TagMenu
            tags={tags}
            setTags={setTags}
            tagsMenuVisible={tagsMenuVisible}
            setTagsMenuVisible={setTagsMenuVisible}
            goalTags={goal.tags}
            palette={palette}
            themeColors={theme.colors}
          />
        </View>
      )}
      <ScrollView style={styles.scrollView}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Tags</DataTable.Title>
            <DataTable.Title numeric>Value</DataTable.Title>
          </DataTable.Header>

          {filteredDataPoints.slice().reverse().map(([dataPoint, i]: [DataPoint, number]) => (
            <TouchableOpacity
              key={i}
              onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name, dataPointIndex: i })}
            >
              <DataTable.Row>
                <DataTable.Cell>{formatDate(new Date(dataPoint.time))}</DataTable.Cell>
                <DataTable.Cell>{renderTags(goal.tags.filter((t: Tag) => dataPoint.tags.includes(t.name)), theme, palette)}</DataTable.Cell>
                <DataTable.Cell numeric>{renderValue(dataPoint.value, goal.unit)}</DataTable.Cell>
              </DataTable.Row>
            </TouchableOpacity>
          ))}
        </DataTable>
      </ScrollView>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: goalColor }]}
        onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name, newDataPoint: true })}
        color={theme.colors.surface}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default GoalData; 