import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { DataPoint, Unit } from "./Store";
import { binTimeSeries } from "./GoalUtil";

type GoalDataProps = {
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

const renderDataPoint = ({ item }: { item: DataPoint }, unit: Unit) => (
  <View style={styles.dataPointContainer}>
    <View style={styles.dataPointContent}>
      <View style={styles.dataPointValueContainer}>
        <Text style={styles.dataPointValue}>
          {renderValue(item.value, unit)}
        </Text>
      </View>
      {renderTags(item.tags)}
    </View>
  </View>
);

const GoalData = ({ route }: GoalDataProps) => {
  const { goal } = route.params;
  const bins = binTimeSeries("day", goal.dataPoints);

  const getDayKey = (t: Date) => {
    return t.getFullYear() + "-" + (t.getMonth() + 1) + "-" + t.getDate();
  };

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

  const renderDay = ({ item }: { item: { time: Date; values: DataPoint[] } }) => {
    const dayKey = getDayKey(item.time);
    const isExpanded = expandedDays.has(dayKey);

    return (
      <View style={styles.dayContainer}>
        <TouchableOpacity 
          style={styles.dayHeader} 
          onPress={() => toggleDay(dayKey)}
        >
          <View style={styles.dayHeaderContent}>
            <Text style={styles.dayDate}>{formatDate(item.time)}</Text>
            <Text style={styles.dayCount}>({item.values.length})</Text>
          </View>
          <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.dayDataPoints}>
            {item.values.map((dataPoint, index) => (
              <View key={index} style={styles.nestedDataPointContainer}>
                {renderDataPoint({ item: dataPoint }, goal.unit)}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };
  
  return (
    <View>
      <Text style={styles.sectionTitle}>Data Points ({goal.dataPoints.length})</Text>
      <FlatList
        data={bins}
        renderItem={renderDay}
        keyExtractor={(item) => item.time.toISOString().split('T')[0]}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  listContainer: {
    backgroundColor: '#ffffff',
  },
  dataPointContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataPointContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dataPointValueContainer: {
    alignItems: 'flex-end',
  },
  dataPointValue: {
    fontSize: 16,
    color: "#333333",
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: "500",
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
    color: '#333333',
    fontWeight: '600',
  },
  dayCount: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 16,
    color: '#666666',
  },
  dayDataPoints: {
    backgroundColor: '#ffffff',
  },
  nestedDataPointContainer: {
    marginBottom: 0,
  },
});

export default GoalData; 