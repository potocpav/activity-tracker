import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { useTheme, Menu, FAB, Button } from 'react-native-paper';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import useStore from "./Store";
import {DataPoint, GoalType, SubUnit, Tag, Unit} from "./StoreTypes";
import GoalGraph from "./GoalGraph";
import GoalData from "./GoalData";
import GoalCalendar from "./GoalCalendar";
import AntDesign from '@expo/vector-icons/AntDesign';
import GoalSummary from "./GoalSummary";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from 'expo-sharing';


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

const renderCsv = (data: (string | number | null)[][]) => {
  return data.map((row) => {
    var rowStr = "";
    row.forEach((cell, ix) => {
      if (typeof cell === "string") {
        const escaped = cell.replace(/"/g, "\"\"");
        rowStr += `"${escaped}"`;
      } else if (typeof cell === "number") {
        rowStr += cell.toString(); // no quoting for numbers
      } else if (cell === null) {
        // null is empty cell
      }
      if (ix < row.length - 1) {
        rowStr += ",";
      }
    });
    return rowStr;
  }).join("\r\n");
}

const GoalInner: React.FC<any> = ({ goal, navigation }) => {
  const goalName = goal.name;
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const deleteGoal = useStore((state: any) => state.deleteGoal);

  if (!goal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>Goal not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const deleteGoalWrapper = () => {
    Alert.alert(
      `Delete "${goal.name}"`,
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteGoal(goal.name);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Goals' }],
            });
          }
        }
      ]
    );
  }

  const exportGoalCsv = async () => {
    const valueNames = (() => {
      if (typeof goal.unit === "string") {
        return [goal.unit];
      } else {
        return goal.unit.map((u: SubUnit) => u.name);
      }
    })();
    const tagNames = goal.tags.map((t: Tag) => t.name);
    const headerRow = ["Date", ...valueNames, ...tagNames];
    var dataRows = goal.dataPoints.map((dp: DataPoint) => {
      const values = (() => {
        if (typeof goal.unit === "string" && typeof dp.value === "number") {
          return [dp.value];
        } else {
          return goal.unit.map((u: SubUnit) =>
            (typeof dp.value === "object" ? (dp.value as any)[u.name] ?? null : null));
        }
      })();
      const tags = (() => {
        return goal.tags.map((t: Tag) => dp.tags.includes(t.name) ? 1 : null);
      })();
      return [new Date(...dp.date).toLocaleDateString(), ...values, ...tags];
    });
    const csv = renderCsv([headerRow, ...dataRows]);

    // save to file and share
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const file = new File(Paths.cache, `workout-goal-${dateStr}.csv`);

    try {
      if (file.exists) {
        file.delete();
      }
      file.create(); // can throw an error if the file already exists or no permission to create it
      file.write(csv);

      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Export Workout Goal',
        mimeType: 'text/csv',
      });
    } catch (error) {
      console.error(error);
    }
  }

  React.useEffect(() => {
    navigation.setOptions({
      title: goal.name,
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button compact={true} onPress={() => navigation.navigate("EditGoal", { goalName })}>
            <AntDesign name="edit" size={24} color={theme.colors.onSurface} />
          </Button>
          <Button compact={true} onPress={() => setMenuVisible(!menuVisible)}>
            <AntDesign name="bars" size={24} color={theme.colors.onSurface} />
          </Button>
        </View>
      ),
    });
  }, [navigation, theme, menuVisible]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={{ position: 'absolute', top: 10, right: 0 }}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={{ width: 1, height: 1 }} />}
        >
          <Menu.Item onPress={() => { setMenuVisible(false); exportGoalCsv() }} title="Export" />
          <Menu.Item onPress={() => { setMenuVisible(false); deleteGoalWrapper() }} title="Delete" />
        </Menu>
      </View>
      <Tab.Navigator screenOptions={{ swipeEnabled: false }}>
        <Tab.Screen name="Summary" component={GoalSummary} initialParams={{ goalName }} />
        <Tab.Screen name="Data" component={GoalData} initialParams={{ goalName }} />
        <Tab.Screen name="Calendar" component={GoalCalendar} initialParams={{ goalName }} />
        <Tab.Screen name="Graph" component={GoalGraph} initialParams={{ goalName }} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

// GoalSummary component removed for extraction to a separate file.

const styles = StyleSheet.create({
  container: {
    flex: 1,
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