import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useTheme } from 'react-native-paper';
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
  const theme = useTheme();
  const { goalId } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>Goal not found</Text>
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
  const theme = useTheme();
  const { goalId } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  return (
    <View>
        <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outline }]}>
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>{goal.name}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditGoal', { goalId })}>
              <Text style={[styles.editButton, { color: theme.colors.primary, backgroundColor: theme.colors.primaryContainer }]}>Edit</Text>
            </TouchableOpacity>
        </View>
        
        <View style={[styles.goalInfo, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.goalDescription, { color: theme.colors.onSurfaceVariant }]}>{goal.description}</Text>
            <Text style={[styles.goalUnit, { color: theme.colors.onSurfaceVariant }]}>{renderUnit(goal.unit)}</Text>
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
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
  },
  editButton: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  goalInfo: {
    padding: 15,
  },
  goalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  goalUnit: {
    fontSize: 14,
    fontStyle: "italic",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 20,
    paddingVertical: 15,
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
    alignItems: 'flex-end',
  },
  dataPointValue: {
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});

export default Goal; 