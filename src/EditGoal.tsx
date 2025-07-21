import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Dialog, Portal, useTheme } from 'react-native-paper';
import { GoalType, Tag } from "./Store";
import { TextInput, Button, Chip } from "react-native-paper";
import useStore from "./Store";
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { lightPalette, darkPalette } from './Color';
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
  color: 19,
};

const EditGoal: FC<EditGoalProps> = ({navigation, route}) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const themeState = useStore((state: any) => state.theme);
  const goal = goals.find((g: GoalType) => g.name === goalName) ?? defaultGoal;
  const updateGoal = useStore((state: any) => state.updateGoal);
  const deleteGoal = useStore((state: any) => state.deleteGoal);
  const findTag = useStore((state: any) => state.findTag);
  const addTag = useStore((state: any) => state.addTag);
  const deleteTag = useStore((state: any) => state.deleteTag);
  const renameTag = useStore((state: any) => state.renameTag);
  const setTags = useStore((state: any) => state.setTags);
  
  const [goalNameInput, setGoalNameInput] = useState(goal.name);
  const [goalDescriptionInput, setGoalDescriptionInput] = useState(goal.description);
  const [unitInput, setUnitInput] = useState(goal.unit);

  const [tagDialogVisible, setTagDialogVisible] = useState(false);
  const [tagDialogName, setTagDialogName] = useState("");
  const [tagDialogNameInput, setTagDialogNameInput] = useState("");

  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState(goal.color);

  const palette = themeState === "dark" ? darkPalette : lightPalette;

  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const saveGoal = () => {
    if (goalNameInput === "") {
      Alert.alert("Error", "Goal name cannot be empty");
    } else if (goalNameInput !== goal.name && goals.find((g: GoalType) => g.name === goalNameInput)) {
      Alert.alert("Error", "A goal with this name already exists");
    } else {
      const updatedGoal = {
        ...goal,
        name: goalNameInput,
        description: goalDescriptionInput,
        unit: unitInput,
        color: selectedColor,
      };
      const goalName = goal.name === "" ? updatedGoal.name : goal.name;
      updateGoal(goalName, updatedGoal);
      navigation.reset(
        {
        index: 0,
        routes: [{name: 'Goals'}, {name: 'Goal', params: { goalName: updatedGoal.name }}],
      });
    }
  }

  React.useEffect(() => {
    navigation.setOptions({
      title: goal.name,
      headerRight: () => (
        <>
        <Button compact={true} onPress={saveGoal}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>        
        </>
      ),
    });
  }, [navigation, theme, goal, goalNameInput, goalDescriptionInput, unitInput, selectedColor]);

  const onUpdateTag = (action: "delete" | "update") => {
    if (tagDialogNameInput === "") {
      Alert.alert("Error", "Tag name cannot be empty");
    } else {
      if (action === "delete") {
        deleteTag(goal.name, tagDialogName);
      } else if (action === "update") {
        if (findTag(goal.name, tagDialogNameInput)) {
          if (tagDialogName === tagDialogNameInput) {
            // do nothing
          } else {
            Alert.alert("Error", "You cannot rename a tag to its own name");
          }
        } else {
          if (tagDialogName) {
            renameTag(goal.name, tagDialogName, tagDialogNameInput);
          } else {
            addTag(goal.name, { name: tagDialogNameInput, color: theme.colors.primary });
          }
        }
      }
      setTagDialogVisible(false);
    }
  }

  const handleColorSelect = (colorIx: number) => {
    setSelectedColor(colorIx);
    setColorDialogVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Goal Name"
                value={goalNameInput}
                onChangeText={setGoalNameInput}
                mode="outlined"
              />
            </View>
            <Button
              onPress={() => setColorDialogVisible(true)}
              compact={true}
              style={{ marginLeft: 10 }}
            >
              <View style={{ width: 30, height: 30, borderRadius: 12, backgroundColor: palette[selectedColor], borderWidth: 1, borderColor: theme.colors.onBackground }} />
            </Button>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Description"
            value={goalDescriptionInput}
            onChangeText={setGoalDescriptionInput}
            multiline
            numberOfLines={3}
            mode="outlined"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Unit"
            value={unitInput}
            onChangeText={setUnitInput}
            mode="outlined"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Tags:</Text>
          <DraggableFlatList
            data={goal.tags}
            horizontal={true}
            keyExtractor={(item: Tag) => item.name}
            renderItem={({ item, drag, isActive }: { item: Tag, drag: () => void, isActive: boolean }) => (
              <Chip
                onPress={() => { setTagDialogVisible(true); setTagDialogName(item.name); setTagDialogNameInput(item.name);}}
                style={{
                  // backgroundColor: item.color,
                  marginRight: 8,
                  marginBottom: 8,
                  // opacity: isActive ? 0.7 : 1,
                }}
                onLongPress={drag}
              >
                {item.name}
              </Chip>
            )}
            onDragEnd={() => {
              setTags(goal.name, goal.tags);
            }}
            contentContainerStyle={{ flexDirection: 'row' }}
            style={{ marginTop: 8 }}
          />
          <View style={{ flexDirection: 'row' }}>
              <Chip onPress={() => { setTagDialogVisible(true); setTagDialogName(""); setTagDialogNameInput("");}}
                mode="outlined"
                style={{
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                +
              </Chip>
          </View>
        </View>
      </ScrollView>
      <Portal>
        {/* Tag dialog (existing) */}
        <Dialog visible={tagDialogVisible} onDismiss={() => setTagDialogVisible(false)}>
          <Dialog.Content>
            <TextInput label="Tag Name" value={tagDialogNameInput} onChangeText={setTagDialogNameInput} mode="outlined" />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => onUpdateTag("delete")}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
            <Button onPress={() => onUpdateTag("update")}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
          </Dialog.Actions>
        </Dialog>
        {/* Color picker dialog */}
        <Dialog visible={colorDialogVisible} onDismiss={() => setColorDialogVisible(false)}>
          <Dialog.Title>Pick a color</Dialog.Title>
          <Dialog.Content>
            <View style={{ flexDirection: 'column', alignItems: 'center' }}>
              {[0, 1, 2, 3, 4].map(row => (
                <View key={row} style={{ flexDirection: 'row', marginBottom: 8 }}>
                  {palette.slice(row * 4, row * 4 + 4).map((color, idx) => (
                    <Button
                      key={idx}
                      mode="contained"
                      compact={true}
                      onPress={() => handleColorSelect(row * 4 + idx)}
                      style={{
                        backgroundColor: color,
                        marginHorizontal: 4,
                        width: 40,
                        height: 40,
                        borderRadius: 15,
                        borderWidth: selectedColor === row * 4 + idx ? 2 : 1,
                        borderColor: selectedColor === row * 4 + idx ? theme.colors.primary : '#ccc',
                        justifyContent: 'center',
                        alignItems: 'center',
                        elevation: 2,
                      }}
                      contentStyle={{ width: 40, height: 40 }}
                    >
                      {selectedColor === row * 4 + idx ? <AntDesign name="check" size={20} color={theme.colors.surface} /> : null}
                    </Button>
                  ))}
                </View>
              ))}
            </View>
          </Dialog.Content>
        </Dialog>
      </Portal>
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
  colorButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    width: 48,
  },
});

export default EditGoal; 