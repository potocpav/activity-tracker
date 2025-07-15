import React, { useState, FC } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useTheme } from 'react-native-paper';
import { GoalType } from "./Store";
import { TextInput, Button } from "react-native-paper";
import useStore from "./Store";
import AntDesign from '@expo/vector-icons/AntDesign';
type EditGoalProps = {
  navigation: any;
  route: any;
};

const defaultGoal: GoalType = {
  name: "",
  description: "",
  unit: "",
  dataPoints: [],
  tags: [],
};

const EditGoal: FC<EditGoalProps> = ({navigation, route}) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName) ?? defaultGoal;
  const updateGoal = useStore((state: any) => state.updateGoal);
  const deleteGoal = useStore((state: any) => state.deleteGoal);
  
  const [goalNameInput, setGoalNameInput] = useState(goal.name);
  const [goalDescriptionInput, setGoalDescriptionInput] = useState(goal.description);
  const [unitInput, setUnitInput] = useState(goal.unit);


  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const saveGoal = () => {
    if (goalNameInput === "") {
      Alert.alert("Error", "Goal name cannot be empty");
    } else if (unitInput === "") {
      Alert.alert("Error", "Unit cannot be empty");
    } else if (goalNameInput !== goal.name && goals.find((g: GoalType) => g.name === goalNameInput)) {
      Alert.alert("Error", "A goal with this name already exists");
    } else {
      const updatedGoal = {
        ...goal,
        name: goalNameInput,
        description: goalDescriptionInput,
        unit: unitInput
      };
      const goalName = goal.name === "" ? updatedGoal.name : goal.name;
      updateGoal(goalName, updatedGoal);
      navigation.reset(
        {
        index: 0,
        routes: [{name: 'Main Page'}, {name: 'Goals'}, {name: 'Goal', params: { goalName: updatedGoal.name }}],
      });
    }
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
              routes: [{name: 'Main Page'}, {name: 'Goals'}],
            });
          }
        }
      ]
    );
  }
  React.useEffect(() => {
    navigation.setOptions({
      title: goal.name,
      headerRight: () => (
        <>
        <Button compact={true} onPress={() => {
          saveGoal();
        }}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>        
        <Button compact={true} onPress={deleteGoalWrapper}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
        </>
      ),
    });
  }, [navigation, goal, goalNameInput, goalDescriptionInput, unitInput]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            label="Goal Name"
            value={goalNameInput}
            onChangeText={setGoalNameInput}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Description"
            value={goalDescriptionInput}
            onChangeText={setGoalDescriptionInput}
            multiline
            numberOfLines={3}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Unit"
            value={unitInput}
            onChangeText={setUnitInput}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Tags: -</Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>Tag editing will be implemented later</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default EditGoal; 