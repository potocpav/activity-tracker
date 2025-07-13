import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import useStore, { GoalType, SubUnit, Unit, DataPoint } from "./Store";
import GoalGraph from "./GoalGraph";


const Tab = createMaterialTopTabNavigator();

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
        parts.push(`${value[u.name.toLowerCase()]} ${u.symbol}`);
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
      <View style={styles.dataPointDate}>
        <Text style={styles.dataPointDateText}>{formatDate(item.time)}</Text>
      </View>
      <View style={styles.dataPointValueContainer}>
        <Text style={styles.dataPointValue}>
          {renderValue(item.value, unit)}
        </Text>
      </View>
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
    // <SafeAreaView style={styles.container}>

    <Tab.Navigator>
      <Tab.Screen name="Summary" component={GoalSummary} initialParams={{ goal }} />
      <Tab.Screen name="Data" component={GoalData} initialParams={{ goal }} />
      <Tab.Screen name="Graph" component={GoalGraph} initialParams={{ goal }} />
    </Tab.Navigator>
    // </SafeAreaView>
  );
};

const GoalSummary = ({ route }: { route: any }) => {
  const { goal } = route.params;
  return (
    <View>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{goal.name}</Text>
        </View>
        
        <View style={styles.goalInfo}>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <Text style={styles.goalUnit}>{renderUnit(goal.unit)}</Text>
        </View>

        <View>
            <Text style={styles.sectionTitle}>Data Points ({goal.dataPoints.length})</Text>
            <FlatList
            data={goal.dataPoints}
            renderItem={(item) => renderDataPoint(item, goal.unit)}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            />
        </View>
    </View>
  );
};

const GoalData = ({ route }: { route: any }) => {
  const { goal } = route.params;
  return (
    <View>
      <Text style={styles.sectionTitle}>Data Points ({goal.dataPoints.length})</Text>
      <FlatList
      data={goal.dataPoints}
      renderItem={(item) => renderDataPoint(item, goal.unit)}
      keyExtractor={(item, index) => index.toString()}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
      />
  </View>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
    flex: 1,
  },
  goalInfo: {
    backgroundColor: '#ffffff',
    padding: 15,
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
  // dataSection: {
  //   flex: 1,
  // },
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
  dataPointDate: {
  },
  dataPointDateText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  dataPointValueContainer: {
    alignItems: 'flex-end',
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