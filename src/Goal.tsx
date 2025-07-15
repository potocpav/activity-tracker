import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { useTheme, FAB, Button } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import useStore, { GoalType, SubUnit, Unit } from "./Store";
import GoalGraph from "./GoalGraph";
import GoalData from "./GoalData";
import AntDesign from '@expo/vector-icons/AntDesign';
import { formatDate, renderValue } from "./GoalData";


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
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);

  return goal ? (
    <GoalInner goal={goal} navigation={navigation} />
  ) : (
    <Text></Text>
  )
}

const GoalInner: React.FC<any> = ({ goal, navigation }) => {
  const goalName = goal.name;
  const theme = useTheme();
  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>Goal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  React.useEffect(() => {
    navigation.setOptions({
      title: goal.name,
      headerRight: () => (
        <Button compact={true} onPress={() => {
          navigation.navigate("EditGoal", { goalName });
        }}><AntDesign name="edit" size={24} color={theme.colors.onSurface} /></Button>
      ),
    });
  }, [navigation]);

  return (
    <Tab.Navigator screenOptions={{swipeEnabled: false}}>
      <Tab.Screen name="Summary" component={GoalSummary} initialParams={{ goalName }} />
      <Tab.Screen name="Data" component={GoalData} initialParams={{ goalName }} />
      <Tab.Screen name="Graph" component={GoalGraph} initialParams={{ goalName }} />
    </Tab.Navigator>
  );
};

const GoalSummary = ({ navigation, route }: { navigation: any, route: any }) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const numDataPoints = goal.dataPoints.length;
  const lastDataPoint = numDataPoints > 0 ? goal.dataPoints[numDataPoints - 1] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>    
      <View>
        <View style={[styles.goalInfo, { backgroundColor: theme.colors.surface }]}>  
          <Text style={[styles.goalDescription, { color: theme.colors.onSurfaceVariant }]}>{goal.description}</Text>
          <Text style={[styles.goalUnit, { color: theme.colors.onSurfaceVariant }]}>Unit: {renderUnit(goal.unit)}</Text>
        </View>
        <View style={[styles.goalInfo, { backgroundColor: theme.colors.surface }]}>  
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Number of data points: {numDataPoints}</Text>
          {lastDataPoint && (
            <>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Last data point: {renderValue(lastDataPoint.value, goal.unit)}</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Last date: {formatDate(new Date(lastDataPoint.time))}</Text>
            </>
          )}
        </View>
      </View>
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("EditDataPoint", { goalName, newDataPoint: true })}
        color={theme.colors.onPrimary}
      />
    </SafeAreaView>
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default Goal; 