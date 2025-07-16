import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTheme, DataTable, FAB } from 'react-native-paper';
import useStore, { DataPoint, GoalType, Unit } from "./Store";
import EditDataPoint from "./EditDataPoint";

type GoalDataProps = {
  navigation: any;
  route: any;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString("cs-CZ", {year: "numeric",month: "short",day: "numeric"});
  // return date.toUTCString();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("cs-CZ", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const renderValueSummary = (value: any, unit: Unit, style: any, short=false) => {
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

const renderTags = (tags: string[], theme: any) => {
  if (tags.length === 0) return null;

  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => (
        <View key={index} style={[styles.tag, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.onSurfaceVariant }]}>
          <Text style={[styles.tagText, { color: theme.colors.onSurfaceVariant }]}>{tag}</Text>
        </View>
      ))}
    </View>
  );
};

const GoalData = ({ navigation, route }: GoalDataProps) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Tags</DataTable.Title>
            <DataTable.Title numeric>Value</DataTable.Title>
          </DataTable.Header>

          {goal.dataPoints.slice().reverse().map((dataPoint: DataPoint, index: number) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name, dataPointIndex: goal.dataPoints.length - 1 - index })}
            >
              <DataTable.Row>
                <DataTable.Cell>{formatDate(new Date(dataPoint.time))}</DataTable.Cell>
                <DataTable.Cell>{renderTags(dataPoint.tags, theme)}</DataTable.Cell>
                <DataTable.Cell numeric>{renderValue(dataPoint.value, goal.unit)}</DataTable.Cell>
              </DataTable.Row>
            </TouchableOpacity>
          ))}
        </DataTable>
      </ScrollView>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name, newDataPoint: true })}
        color={theme.colors.onPrimary}
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
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default GoalData; 