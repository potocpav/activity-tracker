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
import useStore, { GoalType, SubUnit, Unit } from "./Store";
import GoalGraph from "./GoalGraph";
import GoalData from "./GoalData";
import AntDesign from '@expo/vector-icons/AntDesign';
import { formatDate, renderValue } from "./GoalData";
import GoalSummary from "./GoalSummary";
import { lightPalette, darkPalette } from "./Color";


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
              routes: [{name: 'Goals'}],
            });
          }
        }
      ]
    );
  }

  const exportGoalCsv = () => {
    console.log("Exporting goal CSV");
    // const date = new Date();
    // const dateStr = date.toISOString().split('T')[0];
    // Share.share({
    //   message: JSON.stringify(goal, null, 2),
    //   title: `backup_${dateStr}.json`
    // });
    console.log("Data:", goal.dataPoints);
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
      <View style={{ position: 'absolute', top: 10, right: 0}}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={{width: 1, height: 1}}/>}
        >
          <Menu.Item onPress={() => {setMenuVisible(false); exportGoalCsv()}} title="Export" /> 
          <Menu.Item onPress={() => {setMenuVisible(false); deleteGoalWrapper()}} title="Delete" /> 
        </Menu>
      </View>
      <Tab.Navigator screenOptions={{swipeEnabled: false}}>
        <Tab.Screen name="Summary" component={GoalSummary} initialParams={{ goalName }} />
        <Tab.Screen name="Data" component={GoalData} initialParams={{ goalName }} />
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