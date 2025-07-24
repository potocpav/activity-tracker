import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  FlatList,
} from "react-native";
import { useTheme, DataTable, FAB } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, GoalType, Tag, Unit } from "./StoreTypes";
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

export const renderValueSummary = (value: any, unit: Unit, style: any) => {
  if (value === null) {
    return "-"
  } else if (typeof value === "number" && typeof unit === "string") {
    return (
      `${Math.round(value * 100) / 100} ${unit}`
    );
  } else if (typeof value === "object" && typeof unit === "object") {
    // Handle complex units (like finger strength with mean, max, tut)
    var parts: string[] = [];
    unit.forEach((u: any) => {
      if (value[u.name] !== null && value[u.name] !== undefined) {
        parts.push(`${value[u.name]} ${u.symbol}`);
      }
    });
    return ( // Only render the first part always
      parts[0]
    );
  } else {
    return "-"
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

const ITEM_HEIGHT = 50;

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
    .slice()
    .reverse()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {goal.tags.length > 0 && (
        <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
          <TagMenu
            tags={tags}
            setTags={setTags}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            goalTags={goal.tags}
            palette={palette}
            themeColors={theme.colors}
          />
        </View>
      )}
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Date</DataTable.Title>
          <DataTable.Title>Tags</DataTable.Title>
          <DataTable.Title numeric>Value</DataTable.Title>
        </DataTable.Header>
      </DataTable>
      <FlatList
        style={styles.scrollView}
        data={filteredDataPoints}
        keyExtractor={([_, i]) => i.toString()}
        windowSize={2}
        getItemLayout={(_, index) => (
          { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
        )}
        renderItem={({ item: [dataPoint, i] }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name, dataPointIndex: i })}
          >
            <DataTable.Row style={{ height: ITEM_HEIGHT }}>
              <DataTable.Cell>{formatDate(new Date(dataPoint.time))}</DataTable.Cell>
              <DataTable.Cell>{renderTags(goal.tags.filter((t: Tag) => dataPoint.tags.includes(t.name)), theme, palette)}</DataTable.Cell>
              <DataTable.Cell numeric>{renderValue(dataPoint.value, goal.unit)}</DataTable.Cell>
            </DataTable.Row>
          </TouchableOpacity>
        )}
      />
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