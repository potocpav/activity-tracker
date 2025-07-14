import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useTheme } from 'react-native-paper';
import useStore, { DataPoint, GoalType, Unit } from "./Store";
import { binTimeSeries } from "./GoalUtil";
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
  const { goalId } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }
  const bins = binTimeSeries("day", [...goal.dataPoints]);

  const getDayKey = (t: number) => t.toString();

  const daysWithFewPoints: any = new Set(bins.filter((bin) => bin.values.length <= 2).map((bin) => getDayKey(bin.time)));
  const [expandedDays, setExpandedDays] = useState<Set<string>>(daysWithFewPoints);


  const toggleDay = (dayKey: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayKey)) {
      newExpanded.delete(dayKey);
    } else {
      newExpanded.add(dayKey);
    }
    setExpandedDays(newExpanded);
  };

  const renderDay = ({ item }: { item: { time: number; values: DataPoint[] } }) => {
    const isExpanded = expandedDays.has(getDayKey(item.time));

    return (
      <View style={styles.dayContainer}>
        <TouchableOpacity
          style={styles.dayHeader}
          onPress={() => toggleDay(getDayKey(item.time))}
        >
          <View style={styles.dayHeaderContent}>
            <Text style={[styles.dayDate, { color: theme.colors.onSurface }]}>{formatDate(new Date(item.time))}</Text>
            <Text style={[styles.dayCount, { color: theme.colors.onSurfaceVariant }]}>({item.values.length})</Text>
          </View>
          <Text style={[styles.expandIcon, { color: theme.colors.onSurfaceVariant }]}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={[styles.dayDataPoints, { backgroundColor: theme.colors.surface }]}>
            {item.values.map((dataPoint, index) => {
              // Find the actual index in the original dataPoints array
              const actualIndex = goal.dataPoints.findIndex((dp: DataPoint) =>
                dp.time === dataPoint.time &&
                JSON.stringify(dp.value) === JSON.stringify(dataPoint.value)
              );
              return (
                  <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => navigation.navigate("EditDataPoint", { goalId: goal.id, dataPointIndex: actualIndex })}>
                  <View key={index} style={styles.nestedDataPointContainer}>
                    {renderDataPoint(theme, { item: dataPoint }, goal.unit)}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Data Points ({goal.dataPoints.length})</Text>
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate("EditDataPoint", { goalId: goal.id })}>
          <Text style={[styles.addButtonText, { color: theme.colors.onPrimary }]}>+</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={bins}
        renderItem={renderDay}
        keyExtractor={(item) => item.time.toString()}
        contentContainerStyle={[styles.listContainer, { backgroundColor: theme.colors.surface }]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
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
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContainer: {
  },
  dataPointContainer: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dataPointContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataPointValueContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  dataPointValue: {
    fontSize: 16,
  },
  dataPointActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
  editButton: {
    padding: 4,
  },
  editButtonText: {
    fontSize: 16,
  },
  dayContainer: {
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  dayHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: '600',
  },
  dayCount: {
    fontSize: 14,
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 16,
  },
  dayDataPoints: {
  },
  nestedDataPointContainer: {
    marginBottom: 0,
  },
});

export default GoalData; 