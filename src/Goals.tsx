import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useTheme } from 'react-native-paper';
import useStore, { GoalType, SubUnit, Unit } from "./Store";



type GoalsProps = {
  navigation: any;
};

const renderUnit = (unit: Unit) => {
  if (typeof unit === "string") {
    return "[" + unit + "]";
  }
  return unit.map((u: SubUnit) => u.name + " [" + u.symbol + "]").join(", ");
};

const Goals: React.FC<GoalsProps> = ({ navigation }) => {
  const theme = useTheme();
  const goals = useStore((state: any) => state.goals);

  const renderGoal = ({ item }: { item: GoalType }) => (
    <TouchableOpacity
      style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('Goal', { goalId: item.id })}
      activeOpacity={0.7}
    >
      <Text style={[styles.goalTitle, { color: theme.colors.onSurface }]}>{item.name}</Text>
      <Text style={[styles.goalDate, { color: theme.colors.onSurfaceVariant }]}>{renderUnit(item.unit)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <FlatList
        data={goals}
        renderItem={renderGoal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
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
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  listContainer: {
    padding: 10,
  },
  goalCard: {
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  goalDate: {
    fontSize: 14,
    fontStyle: "italic",
  },
});

export default Goals; 