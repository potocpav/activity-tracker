import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import useStore, { GoalType, SubUnit, Unit } from "./Store";
import GoalGraph from "./GoalGraph";
import GoalData from "./GoalData";


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
    <Tab.Navigator screenOptions={{swipeEnabled: false}}>
      <Tab.Screen name="Summary" component={GoalSummary} initialParams={{ goalId }} />
      <Tab.Screen name="Data" component={GoalData} initialParams={{ goalId }} />
      <Tab.Screen name="Graph" component={GoalGraph} initialParams={{ goalId }} />
    </Tab.Navigator>
  );
};

const GoalSummary = ({ navigation, route }: { navigation: any, route: any }) => {
  const { goalId } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  return (
    <View>
        <View style={styles.header}>
            <Text style={styles.headerTitle}>{goal.name}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditGoal', { goalId })}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
        </View>
        
        <View style={styles.goalInfo}>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <Text style={styles.goalUnit}>{renderUnit(goal.unit)}</Text>
        </View>

        <View>
            <GoalData navigation={navigation} route={{ params: { goalId } }} />
        </View>
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
  editButton: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
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