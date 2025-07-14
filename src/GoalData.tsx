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

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderValue = (value: any, unit: Unit) => {
  if (typeof value === "number") {
    return `${Math.round(value * 100) / 100} ${typeof unit === "string" ? unit : ""}`;
  }

  if (typeof value === "object" && value !== null) {
    if (typeof unit === "string") {
      return JSON.stringify(value);
    }

    // Handle complex units (like finger strength with mean, max, tut)
    const parts: string[] = [];
    unit.forEach((u: any) => {
      if (value[u.name] !== null && value[u.name] !== undefined) {
        parts.push(`${value[u.name]} ${u.symbol}`);
      }
    });
    return parts.join(", ");
  }

  return String(value);
};

const renderTags = (tags: string[]) => {
  if (tags.length === 0) return null;

  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => (
        <View key={index} style={styles.tag}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      ))}
    </View>
  );
};

const renderDataPoint = (theme: any, { item }: { item: DataPoint }, unit: Unit) => (
    <View style={styles.dataPointContainer}>
      <View style={styles.dataPointContent}>
        <View style={styles.dataPointInfo}>
          <Text style={[styles.dataPointDate, { color: theme.colors.onSurface }]}>
            {formatDate(new Date(item.time))}
          </Text>
          <Text style={[styles.dataPointTime, { color: theme.colors.onSurfaceVariant }]}>
            {formatTime(new Date(item.time))}
          </Text>
        </View>
        <View style={styles.dataPointValueContainer}>
          <Text style={[styles.dataPointValue, { color: theme.colors.onSurface }]}>
            {renderValue(item.value, unit)}
          </Text>
        </View>
        <View style={styles.dataPointActions}>
          {renderTags(item.tags)}
        </View>
      </View>
    </View>
);

const GoalData = ({ navigation, route }: GoalDataProps) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Data Points ({goal.dataPoints.length})</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>Date</DataTable.Title>
            <DataTable.Title>Tags</DataTable.Title>
            <DataTable.Title numeric>Value</DataTable.Title>
          </DataTable.Header>

          {goal.dataPoints.slice().reverse().map((dataPoint: DataPoint, index: number) => (
            <TouchableOpacity
              key={dataPoint.time.toString()}
              onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name, dataPointIndex: goal.dataPoints.length - 1 - index })}
            >
              <DataTable.Row>
                <DataTable.Cell>{formatDate(new Date(dataPoint.time))}</DataTable.Cell>
                <DataTable.Cell>{renderTags(dataPoint.tags)}</DataTable.Cell>
                <DataTable.Cell numeric>{renderValue(dataPoint.value, goal.unit)}</DataTable.Cell>
              </DataTable.Row>
            </TouchableOpacity>
          ))}
        </DataTable>
      </ScrollView>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("EditDataPoint", { goalName: goal.name })}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  dataPointContainer: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dataPointContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataPointInfo: {
    flex: 1,
  },
  dataPointDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  dataPointTime: {
    fontSize: 14,
    marginTop: 2,
  },
  dataPointValueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  dataPointValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  dataPointActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
});

export default GoalData; 