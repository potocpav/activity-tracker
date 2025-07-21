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
  }, [navigation, theme]);

  return (
    <Tab.Navigator screenOptions={{swipeEnabled: false}}>
      <Tab.Screen name="Summary" component={GoalSummary} initialParams={{ goalName }} />
      <Tab.Screen name="Data" component={GoalData} initialParams={{ goalName }} />
      <Tab.Screen name="Graph" component={GoalGraph} initialParams={{ goalName }} />
    </Tab.Navigator>
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