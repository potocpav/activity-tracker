import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Menu, useTheme } from 'react-native-paper';
import { FAB, Button } from 'react-native-paper';
import useStore, { GoalType, SubUnit, Unit } from "./Store";
import DraggableFlatList from 'react-native-draggable-flatlist'
import AntDesign from '@expo/vector-icons/AntDesign';



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
  const setGoals = useStore((state: any) => state.setGoals);
  const [menuVisible, setMenuVisible] = React.useState(false);

  React.useEffect(() => {
    navigation.setOptions({
      // title: goal.name,
      headerRight: () => (
        <Button compact={true} onPress={() => {setMenuVisible(!menuVisible)}}>
        <AntDesign name="bars" size={24} color={theme.colors.onSurface} /></Button>
      ),
    });
  }, [navigation, menuVisible, theme]);

  const renderGoal = ({ item, drag }: { item: GoalType, drag: () => void }) => (
    <TouchableOpacity
      style={[styles.goalCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('Goal', { goalName: item.name })}
      onLongPress={drag}
      activeOpacity={0.7}
    >
      <Text style={[styles.goalTitle, { color: theme.colors.onSurface }]}>{item.name}</Text>
      <Text style={[styles.goalDate, { color: theme.colors.onSurfaceVariant }]}>{renderUnit(item.unit)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={{ position: 'absolute', top: 10, right: 0}}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={{width: 1, height: 1}}/>}
        >
            <Menu.Item onPress={() => {setMenuVisible(false); navigation.navigate('Live View')}} title="Tindeq Live View" />
            <Menu.Item onPress={() => {setMenuVisible(false); navigation.navigate('Settings')}} title="Settings" />
          </Menu>
        </View>
      <DraggableFlatList
        data={goals}
        onDragEnd={({ data }) => setGoals(data)}
        renderItem={renderGoal}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listContainer}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate('EditGoal', { goalName: null })}
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
    padding: 10,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  goalTitle: {
    fontSize: 16,
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
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default Goals; 