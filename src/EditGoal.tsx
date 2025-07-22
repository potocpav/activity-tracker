import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Dialog, Divider, Portal, SegmentedButtons, useTheme } from 'react-native-paper';
import { GoalType, SetTag, Tag } from "./Store";
import { TextInput, Button, Chip, ToggleButton } from "react-native-paper";
import useStore from "./Store";
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { lightPalette, darkPalette } from './Color';
import ColorPicker from './ColorPicker';
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
  const setTags = useStore((state: any) => state.setTags);
  
  const [goalNameInput, setGoalNameInput] = useState(goal.name);
  const [goalDescriptionInput, setGoalDescriptionInput] = useState(goal.description);
  const [unitInput, setUnitInput] = useState(goal.unit);
  const [unitMode, setUnitMode] = useState<'single' | 'multiple'>('single');
  const [multiValues, setMultiValues] = useState([
    { value: '', unit: '' },
    { value: '', unit: '' },
  ]);

  const [tagDialogVisible, setTagDialogVisible] = useState(false);
  const [tagState, setTagState] = useState<SetTag[]>(goal.tags.map((t: Tag) => ({oldTagName: t.name, ...t})));
  const [tagDialogName, setTagDialogName] = useState("");
  const [tagDialogNameInput, setTagDialogNameInput] = useState("");
  const [tagDialogColorInput, setTagDialogColorInput] = useState(19);
  const [tagColorDialogVisible, setTagColorDialogVisible] = useState(false);

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
      setTags(updatedGoal.name, tagState);
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
  }, [navigation, theme, goal, goalNameInput, goalDescriptionInput, unitInput, selectedColor, tagState]);

  const onUpdateTag = (action: "delete" | "update") => {
    if (tagDialogNameInput === "") {
      Alert.alert("Error", "Tag name cannot be empty");
    } else {
      if (action === "delete") {
        setTagState(tagState.filter((t: SetTag) => t.name !== tagDialogName));
      } else if (action === "update") {
        const existingTagNames = tagState.map((t: SetTag) => t.name);
        if (tagDialogNameInput !== tagDialogName && existingTagNames.includes(tagDialogNameInput)) {
          Alert.alert("Error", "A tag with this name already exists");
          return;
        } 
        if (tagDialogName === "") {
            setTagState([...tagState, { oldTagName: null, name: tagDialogNameInput, color: tagDialogColorInput }]);
        } else {
          setTagState(tagState.map((t: SetTag) => t.name === tagDialogName ? { ...t, name: tagDialogNameInput, color: tagDialogColorInput } : t));
        }
      }
      setTagDialogVisible(false);
    }
  }

  const handleColorSelect = (colorIx: number) => {
    setSelectedColor(colorIx);
    setColorDialogVisible(false);
  };

  const handleTagColorSelect = (colorIx: number) => {
    setTagDialogColorInput(colorIx);
    setTagColorDialogVisible(false);
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
          <View style={{}}>
            <SegmentedButtons
              value={unitMode}
              onValueChange={setUnitMode}
              buttons={[               
                {
                  value: 'single',
                  label: 'Single value',
                  icon: 'counter',
                },
                {
                  value: 'multiple',
                  label: 'Multiple values',
                  icon: 'numeric',
                },
              ]}
            />
          </View>
        </View>

        {unitMode === 'single' ? (
          <View style={styles.inputContainer}>
            <TextInput
              label="Unit"
              value={unitInput}
              onChangeText={setUnitInput}
              mode="outlined"
            />
          </View>
        ) : (
          <View style={styles.inputContainer}>
            {[0, 1].map(idx => (
              <View key={idx} style={{ flexDirection: 'row', marginBottom: 8 }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <TextInput
                    label="Value"
                    value={multiValues[idx].value}
                    onChangeText={text => {
                      const newVals = [...multiValues];
                      newVals[idx].value = text;
                      setMultiValues(newVals);
                    }}
                    mode="outlined"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    label="Unit"
                    value={multiValues[idx].unit}
                    onChangeText={text => {
                      const newVals = [...multiValues];
                      newVals[idx].unit = text;
                      setMultiValues(newVals);
                    }}
                    mode="outlined"
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: theme.colors.onSurface }]}>Tags:</Text>
          <DraggableFlatList
            data={tagState}
            horizontal={true}
            keyExtractor={(item: SetTag) => item.name}
            renderItem={({ item, drag, isActive }: { item: SetTag, drag: () => void, isActive: boolean }) => (
              <Chip
                onPress={() => { setTagDialogVisible(true); setTagDialogName(item.name); setTagDialogNameInput(item.name); setTagDialogColorInput(item.color);}}
                textStyle={{ color: theme.colors.surface }}
                style={{
                  backgroundColor: palette[item.color],
                  marginRight: 8,
                  marginBottom: 8,
                  opacity: isActive ? 0.7 : 1,
                }}
                onLongPress={drag}
              >
                {item.name}
              </Chip>
            )}
            onDragEnd={(data) => {
              setTagState(data.data);
            }}
            contentContainerStyle={{ flexDirection: 'row' }}
            style={{ marginTop: 8 }}
          />
          <View style={{ flexDirection: 'row' }}>
              <Chip onPress={() => { setTagDialogVisible(true); setTagDialogName(""); setTagDialogNameInput(""); setTagDialogColorInput(19);}}
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
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TextInput label="Tag Name" value={tagDialogNameInput} onChangeText={setTagDialogNameInput} mode="outlined" />
              </View>
              <Button
                onPress={() => setTagColorDialogVisible(true)}
                compact={true}
                style={{ marginLeft: 10 }}
            >
              <View style={{ width: 30, height: 30, borderRadius: 12, backgroundColor: palette[tagDialogColorInput], borderWidth: 1, borderColor: theme.colors.onBackground }} />
              </Button>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => onUpdateTag("delete")}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
            <Button onPress={() => onUpdateTag("update")}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
          </Dialog.Actions>
        </Dialog>
        {/* Color picker dialog */}
        <ColorPicker
          visible={colorDialogVisible}
          palette={palette}
          selectedColor={selectedColor}
          onSelect={handleColorSelect}
          onDismiss={() => setColorDialogVisible(false)}
          theme={theme}
        />
        <ColorPicker
          visible={tagColorDialogVisible}
          palette={palette}
          selectedColor={tagDialogColorInput}
          onSelect={handleTagColorSelect}
          onDismiss={() => setTagColorDialogVisible(false)}
          theme={theme}
        />
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