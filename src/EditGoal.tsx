import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Dialog, Portal, SegmentedButtons, useTheme } from 'react-native-paper';
import { GoalType, SetTag, SubUnit, Tag } from "./StoreTypes";
import { TextInput, Button, Chip } from "react-native-paper";
import useStore from "./Store";
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { lightPalette, darkPalette } from './Color';
import ColorPicker from './ColorPicker';
import { defaultGoal } from "./ExampleData";
type EditGoalProps = {
  navigation: any;
  route: any;
};

const EditGoal: FC<EditGoalProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const themeState = useStore((state: any) => state.theme);
  const goal = goals.find((g: GoalType) => g.name === goalName) ?? defaultGoal;
  const updateGoal = useStore((state: any) => state.updateGoal);
  const setTags = useStore((state: any) => state.setTags);
  const setUnit = useStore((state: any) => state.setUnit);

  const [goalNameInput, setGoalNameInput] = useState(goal.name);
  const [goalDescriptionInput, setGoalDescriptionInput] = useState(goal.description);
  const [unitMode, setUnitMode] = useState<'no_value' | 'single' | 'multiple'>(goal.unit === null ? 'no_value' : typeof goal.unit === 'string' ? 'single' : 'multiple');
  const [singleUnitInput, setSingleUnitInput] = useState<string>(typeof goal.unit === 'string' ? goal.unit : "");
  // Missing oldName represents there is no old name
  // null oldName represents that the old value comes from a single-valued unit
  // String oldName represents the old value name from a multi-valued unit
  const [multiUnitInput, setMultiUnitInput] = useState<{ name: string, unit: string, oldName?: null | string }[]>(
    goal.unit === null ? [
      { name: '', unit: '' },
      { name: '', unit: '' },
    ] : typeof goal.unit === 'string' ? [
      { name: '', unit: goal.unit, oldName: null },
      { name: '', unit: '' },
    ] : goal.unit.map((u: SubUnit) => ({ name: u.name, unit: u.symbol, oldName: u.name }))
  );

  const [tagDialogVisible, setTagDialogVisible] = useState(false);
  const [tagState, setTagState] = useState<SetTag[]>(goal.tags.map((t: Tag) => ({ oldTagName: t.name, ...t })));
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
    const updatedGoal = {
      ...goal,
      name: goalNameInput,
      description: goalDescriptionInput,
      color: selectedColor,
    };
    const newUnit = 
      unitMode === 'no_value' ? null : 
      unitMode === 'single' ? singleUnitInput : 
      multiUnitInput;
    const goalName = goal.name === "" ? updatedGoal.name : goal.name;
    updateGoal(goalName, updatedGoal);
    setTags(updatedGoal.name, tagState);
    console.log("newUnit", newUnit, singleUnitInput, multiUnitInput);
    setUnit(updatedGoal.name, newUnit);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Goals' }, { name: 'Goal', params: { goalName: updatedGoal.name } }],
    });
  };

  const saveGoalWrapper = () => {
    if (goalNameInput === "") {
      Alert.alert("Error", "Goal name cannot be empty");
    } else if (goalNameInput !== goal.name && goals.find((g: GoalType) => g.name === goalNameInput)) {
      Alert.alert("Error", "A goal with this name already exists");
    } else {
      let dataLossAlert = (callback: () => void) => {
        Alert.alert("Warning", "Some numerical data may be lost.", [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => {
            callback();
          } },
        ]);
      };
      // data loss?
      if (goal.dataPoints.length > 0) {
        console.log("unitMode", unitMode, typeof null);
        if (unitMode === 'no_value' && goal.unit !== null) {
          dataLossAlert(saveGoal);
        } else if (unitMode === 'single' && Array.isArray(goal.unit)) {
          dataLossAlert(saveGoal);
        } else if (unitMode === 'multiple' && typeof goal.unit === 'string' && multiUnitInput.findIndex((u) => u.oldName === null) === -1) {
          dataLossAlert(saveGoal);
        } else if (unitMode === 'multiple' && Array.isArray(goal.unit)) {
          let oldNames: any[] = multiUnitInput.map((u) => u.oldName).filter((n) => n !== undefined);
          console.log("oldNames", oldNames);
          if (new Set(oldNames).isSupersetOf(new Set(goal.unit.map((u: SubUnit) => u.name)))) {
            saveGoal();
          } else {
            dataLossAlert(saveGoal);
          }
        } else {
          saveGoal();
        }
      } else {
        saveGoal();
      }
    }
  }

    React.useEffect(() => {
      navigation.setOptions({
        title: goal.name,
        headerRight: () => (
          <>
            <Button compact={true} onPress={saveGoalWrapper}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
          </>
        ),
      });
    }, [navigation, theme, goal, goalNameInput, goalDescriptionInput, singleUnitInput, selectedColor, tagState, multiUnitInput, unitMode]);

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

    const editNoValue = () => (
      <></>
    );

    const editSingleValue = () => (
      <View style={styles.inputContainer}>
        <TextInput
          label="Unit"
          value={singleUnitInput}
          onChangeText={setSingleUnitInput}
          mode="outlined"
        />
      </View>
    );



    const editMultipleValues = () => (
      multiUnitInput.map((val, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <TextInput
              label="Value"
              value={val.name}
              onChangeText={text => {
                const newVals = [...multiUnitInput];
                newVals[idx].name = text;
                setMultiUnitInput(newVals);
              }}
              mode="outlined"
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Unit"
              value={val.unit}
              onChangeText={text => {
                const newVals = [...multiUnitInput];
                newVals[idx].unit = text;
                setMultiUnitInput(newVals);
              }}
              mode="outlined"
            />
          </View>
          <View style={{ width: 40, marginLeft: 4 }}>
            {multiUnitInput.length > 2 && (
              <Button compact={true} onPress={() => {
                const newVals = [...multiUnitInput];
                newVals.splice(idx, 1);
                setMultiUnitInput(newVals);
              }}><AntDesign name="delete" size={20} color={theme.colors.onSurface} /></Button>
            )}
          </View>
        </View>
      ))
    );

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
            <Text style={{ marginBottom: 8, color: theme.colors.onSurface }}>Value:</Text>
            <View style={{}}>
              <SegmentedButtons
                value={unitMode}
                onValueChange={setUnitMode}
                buttons={[
                  {
                    value: 'no_value',
                    label: 'None',
                    icon: 'counter',
                  },
                  {
                    value: 'single',
                    label: 'Single',
                    icon: 'counter',
                  },
                  {
                    value: 'multiple',
                    label: 'Multiple',
                    icon: 'numeric',
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            {unitMode === 'no_value' ? editNoValue() : unitMode === 'single' ? editSingleValue() : editMultipleValues()}
            <Button compact={true} onPress={() => setMultiUnitInput([...multiUnitInput, { name: '', unit: '' }])}><AntDesign name="plus" size={20} color={theme.colors.onSurface} /></Button>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>Tags:</Text>
            <DraggableFlatList
              data={tagState}
              horizontal={true}
              keyExtractor={(item: SetTag) => item.name}
              renderItem={({ item, drag, isActive }: { item: SetTag, drag: () => void, isActive: boolean }) => (
                <Chip
                  onPress={() => { setTagDialogVisible(true); setTagDialogName(item.name); setTagDialogNameInput(item.name); setTagDialogColorInput(item.color); }}
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
              <Chip onPress={() => { setTagDialogVisible(true); setTagDialogName(""); setTagDialogNameInput(""); setTagDialogColorInput(19); }}
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