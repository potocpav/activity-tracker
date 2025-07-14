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

type EditGoalProps = {
  navigation: any;
  route: any;
};

const EditGoal: FC<EditGoalProps> = ({navigation, route}) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  
  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const [goalNameInput, setGoalNameInput] = useState(goal.name);
  const [goalDescriptionInput, setGoalDescriptionInput] = useState(goal.description);

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
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Unit: {typeof goal.unit === "string" ? goal.unit : goal.unit.map((u: any) => u.name).join(", ")}</Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>Unit editing will be implemented later</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Tags: -</Text>
          <Text style={[styles.helperText, { color: theme.colors.onSurfaceVariant }]}>Tag editing will be implemented later</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.colors.outline }]}>
        <TouchableOpacity style={[styles.cancelButton, { backgroundColor: theme.colors.secondary }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.cancelButtonText, { color: theme.colors.onSecondary }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, { backgroundColor: theme.colors.primary }]} onPress={() => {
          // TODO: Implement goal update logic
          Alert.alert("Not implemented", "Goal editing functionality will be implemented later");
          navigation.goBack();
        }}>
          <Text style={[styles.saveButtonText, { color: theme.colors.onPrimary }]}>Save</Text>
        </TouchableOpacity>
      </View>
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