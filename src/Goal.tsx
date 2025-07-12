import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import useStore, { GoalType, SubUnit, Unit, DataPoint } from "./Store";

type GoalProps = {
  navigation: any;
  route: any;
};

const renderUnit = (unit: Unit) => {
  if (typeof unit === "string") {
    return "[" + unit + "]";
  }
  return unit.map((u: SubUnit) => u.name + " [" + u.symbol + "]").join(", ");
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderValue = (value: any, unit: Unit) => {
  if (typeof value === "number") {
    return `${value} ${typeof unit === "string" ? unit : ""}`;
  }
  
  if (typeof value === "object" && value !== null) {
    if (typeof unit === "string") {
      return JSON.stringify(value);
    }
    
    // Handle complex units (like finger strength with mean, max, tut)
    const parts: string[] = [];
    unit.forEach((u: SubUnit) => {
      if (value[u.name.toLowerCase()] !== null && value[u.name.toLowerCase()] !== undefined) {
        parts.push(`${u.name}: ${value[u.name.toLowerCase()]} ${u.symbol}`);
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
  <View style={styles.dataPointCard}>
    <View style={styles.dataPointHeader}>
      <Text style={styles.dataPointDate}>{formatDate(item.time)}</Text>
      <Text style={styles.dataPointValue}>
        {renderValue(item.value, unit)}
      </Text>
    </View>
    {renderTags(item.tags)}
  </View>
);

const Goal: React.FC<GoalProps> = ({ navigation, route }) => {
  const { goalId } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);

  if (!goal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Goal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{goal.name}</Text>
      </View>
      
      <View style={styles.goalInfo}>
        <Text style={styles.goalDescription}>{goal.description}</Text>
        <Text style={styles.goalUnit}>{renderUnit(goal.unit)}</Text>
      </View>

      <View style={styles.dataSection}>
        <Text style={styles.sectionTitle}>Data Points ({goal.dataPoints.length})</Text>
        <FlatList
          data={goal.dataPoints}
          renderItem={(item) => renderDataPoint(item, goal.unit)}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "500",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  goalInfo: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginBottom: 10,
  },
  goalDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
    marginBottom: 8,
  },
  goalUnit: {
    fontSize: 14,
    color: "#999999",
    fontStyle: "italic",
  },
  dataSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333333",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  listContainer: {
    paddingHorizontal: 20,
  },
  dataPointCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dataPointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dataPointDate: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  dataPointValue: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "600",
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: "#666666",
  },
});

export default Goal; 