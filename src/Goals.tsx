import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
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
  const goals = useStore((state: any) => state.goals);

  const renderGoal = ({ item }: { item: GoalType }) => (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => navigation.navigate('Goal', { goalId: item.id })}
      activeOpacity={0.7}
    >
      <Text style={styles.goalTitle}>{item.name}</Text>
      <Text style={styles.goalDate}>{renderUnit(item.unit)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
    backgroundColor: "#f2f2f2",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666666",
  },
  listContainer: {
    padding: 10,
  },
  goalCard: {
    backgroundColor: '#ffffff',
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
    color: "#333333",
    marginBottom: 8,
  },
  goalDescription: {
    fontSize: 16,
    color: "#666666",
    lineHeight: 22,
    marginBottom: 8,
  },
  goalDate: {
    fontSize: 14,
    color: "#999999",
    fontStyle: "italic",
  },
});

export default Goals; 