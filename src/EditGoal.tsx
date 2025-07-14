import React, { useState, FC } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { GoalType } from "./Store";
import { TextInput, Button } from "react-native-paper";
import useStore from "./Store";

type EditGoalProps = {
  navigation: any;
  route: any;
};

const EditGoal: FC<EditGoalProps> = ({navigation, route}) => {
  const { goalId } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);
  
  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const [goalName, setGoalName] = useState(goal.name);
  const [goalDescription, setGoalDescription] = useState(goal.description);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            label="Goal Name"
            value={goalName}
            onChangeText={setGoalName}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Description"
            value={goalDescription}
            onChangeText={setGoalDescription}
            multiline
            numberOfLines={3}
            style={styles.textInput}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Unit: {typeof goal.unit === "string" ? goal.unit : goal.unit.map((u: any) => u.name).join(", ")}</Text>
          <Text style={styles.helperText}>Unit editing will be implemented later</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={() => {
          // TODO: Implement goal update logic
          Alert.alert("Not implemented", "Goal editing functionality will be implemented later");
          navigation.goBack();
        }}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
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
    color: "#333333",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#666666",
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
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default EditGoal; 