import React, { useState, FC, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Dialog, Portal, SegmentedButtons, MD3Theme } from 'react-native-paper';
import { ActivityType, SetTag, Tag, SubUnit, Unit } from "../Model/StoreTypes";
import { TextInput, Button, Chip } from "react-native-paper";
import useStore from "../Model/Store";
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from 'react-native-draggable-flatlist';
import ColorPicker from '../Components/ColorPicker';
import { getTheme, getThemePalette, getThemeVariant } from "../Model/Theme";
import { defaultCalendar, defaultGraph, defaultStats } from "../Model/DefaultActivity";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { UnitEditor } from "../Components/UnitView";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import Hint from "../Components/Hint";

type EditActivityProps = {
  navigation: any;
  route: any;
};

const isSupersetOf = (set1: Set<string>, set2: Set<string>) => {
  for (const item of set2) {
    if (!set1.has(item)) {
      return false;
    }
  }
  return true;
};

const ColorButton = ({ color, onPress }: { color: number, onPress: () => void }) => {
  const theme = getTheme(color);
  return (
    <Button compact={true} onPress={onPress} style={{ marginBottom: 10 }}>
      <View style={{ width: 35, height: 35, borderRadius: 12, backgroundColor: theme.colors.primary, borderWidth: 1, borderColor: theme.colors.onBackground }} />
    </Button>
  );
};

const EditActivity: FC<EditActivityProps> = ({ navigation, route }) => {
  const { activityName } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity: ActivityType | null = activities.find((a: ActivityType) => a.name === activityName) ?? null;
  const themeVariant = getThemeVariant();
  const palette = getThemePalette();
  const updateActivity = useStore((state: any) => state.updateActivity);
  const setTags = useStore((state: any) => state.setTags);
  const setUnit = useStore((state: any) => state.setUnit);

  const [showErrors, setShowErrors] = useState(false);
  const [showTagDialogErrors, setShowTagDialogErrors] = useState(false);

  const [unitMode, setUnitMode] = useState<'no_value' | 'single' | 'multiple' | null>((() => {
    if (!activity) {
      return null;
    } else {
      switch (activity.unit.type) {
        case 'none':
          return 'no_value';
        case 'single':
          return 'single';
        case 'multiple':
          return 'multiple';
      }
    }
  })());

  const [activityNameInput, setActivityNameInput] = useState(activity?.name ?? "");
  const activityNameInputRef = useRef<InputWrapperRef>(undefined);
  let activityNameError: string | null = null;
  if (activityNameInput === "") {
    activityNameError = "Enter activity name";
  } else if ((activity === null || activityNameInput !== activity.name) && activities.find((a: ActivityType) => a.name === activityNameInput)) {
    activityNameError = "An activity with this name already exists";
  }

  let unitModeError = null;
  const unitModeInputRef = useRef<InputWrapperRef>(undefined);
  if (unitMode === null) {
    unitModeError = "Choose measurement type";
  }

  const [singleUnitInput, setSingleUnitInput] = useState<SubUnit | null>((() => {
    if (!activity) {
      return null;
    } else {
      switch (activity.unit.type) {
        case 'none':
          return null;
        case 'single':
          return activity.unit.unit;
        case 'multiple':
          return activity.unit.values[0].unit;
      }
    }
  })());
  const singleUnitInputRef = useRef<InputWrapperRef>(undefined);
  let singleUnitInputError: string | null = null;
  if (unitMode === 'single' && singleUnitInput === null) {
    singleUnitInputError = "Select a unit";
  }

  const [selectedColor, setSelectedColor] = useState(
    activity === null ?
      Math.floor(Math.random() * palette.length) :
      activity.color
  );
  const theme = getTheme(selectedColor);
  const styles = getStyles(theme);
  const [activityDescriptionInput, setActivityDescriptionInput] = useState(activity?.description ?? "");

  // Missing oldName represents there is no old name
  // null oldName represents that the old value comes from a single-valued unit
  // String oldName represents the old value name from a multi-valued unit
  const [oldUnitMap, setOldUnitMap] = useState<{ oldName: string | null, newIndex: number }[]>((() => {
    if (!activity) {
      return [];
    } else {
      switch (activity.unit.type) {
        case 'none':
          return [];
        case 'single':
          return [{ oldName: null, newIndex: 0 }];
        case 'multiple':
          return activity.unit.values.map((u, index: number) => ({ oldName: u.name, newIndex: index }));
      }
    }
  })());

  const emptyMultiUnit = { name: '', unit: null, nameRef: null, unitRef: null, nameError: null, unitError: null };

  const computeMultiUnitInputErrors = (vals: { name: string, unit: SubUnit | null, nameRef: InputWrapperRef | null, unitRef: InputWrapperRef | null }[]) => {
    return vals.map((val, idx) => {
      return {
        ...val,
        nameError: val.name === "" ? "Enter a name" : vals.findIndex((u) => u.name === val.name) !== idx ? "Name must be unique" : null,
        unitError: val.unit === null ? "Select a unit" : null,
      }
    });
  };

  const [multiUnitInput, setMultiUnitInputInternal] = useState<{ name: string, unit: SubUnit | null, nameRef: InputWrapperRef | null, unitRef: InputWrapperRef | null, nameError: string | null, unitError: string | null }[]>((() => {
    let res = [];
    if (!activity) {
      res = [emptyMultiUnit, emptyMultiUnit];
    } else {
      switch (activity.unit.type) {
        case 'none':
          res = [emptyMultiUnit, emptyMultiUnit];
          break;
        case 'single':
          res = [{ ...emptyMultiUnit, unit: activity.unit.unit }, emptyMultiUnit];
          break;
        case 'multiple':
          res = activity.unit.values.map((u: { name: string, unit: SubUnit }) => ({ ...emptyMultiUnit, name: u.name, unit: u.unit }));
          break;
      }
    }
    return computeMultiUnitInputErrors(res);
  })());

  const setMultiUnitInput = (vals: { name: string, unit: SubUnit | null, nameRef: InputWrapperRef | null, unitRef: InputWrapperRef | null }[]) => {
    setMultiUnitInputInternal(computeMultiUnitInputErrors(vals));
  };

  const [tagDialogVisible, setTagDialogVisible] = useState(false);
  const [tagState, setTagState] = useState<SetTag[]>(activity?.tags.map((t: Tag) => ({ oldTagName: t.name, ...t })) ?? []);
  const [tagDialogName, setTagDialogName] = useState("");
  const [tagDialogNameInput, setTagDialogNameInput] = useState("");
  const tagDialogNameInputRef = useRef<InputWrapperRef>(undefined);
  let tagDialogNameError: string | null = null;
  if (tagDialogNameInput === "") {
    tagDialogNameError = "Enter a tag name";
  } else if (tagDialogNameInput !== tagDialogName && tagState.map((t: SetTag) => t.name).includes(tagDialogNameInput)) {
    tagDialogNameError = "A tag with this name already exists";
  }
  const [tagDialogColorInput, setTagDialogColorInput] = useState(0);
  const [tagColorDialogVisible, setTagColorDialogVisible] = useState(false);

  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const saveActivity = () => {
    let newUnit: Unit;
    switch (unitMode) {
      case 'no_value':
        newUnit = { type: "none" };
        break;
      case 'single':
        if (singleUnitInput === null) {
          console.error("Error", "Single unit cannot be null");
          return;
        }
        newUnit = { type: "single", unit: singleUnitInput };
        break;
      case 'multiple':
        if (multiUnitInput.findIndex((u) => u.unit === null) !== -1) {
          console.error("Error", "All value units must be non-empty");
          return;
        }
        // no nulls at this point
        newUnit = { type: "multiple", values: multiUnitInput as { name: string, unit: SubUnit }[] };
        break;
      case null:
        console.error("Error", "Unit mode cannot be null");
        return;
    }

    let updatedActivity: ActivityType;
    if (activity === null) {
      const defaultUnit: Unit = { type: "single", unit: { type: "number", symbol: "" } };
      updatedActivity = {
        name: activityNameInput,
        description: activityDescriptionInput,
        unit: defaultUnit,
        color: selectedColor,
        dataPoints: [],
        tags: [],
        stats: defaultStats(defaultUnit),
        calendars: [defaultCalendar(defaultUnit)],
        graphs: [defaultGraph(defaultUnit)],
      };
    } else {
      updatedActivity = {
        ...activity,
        name: activityNameInput,
        description: activityDescriptionInput,
        color: selectedColor,
        // don't update unit, it will be updated in the setUnit call
        // don't update tags, they will be updated in the setTags call
      };
    }
    const currentActivityName = activity === null ? updatedActivity.name : activity.name;
    updateActivity(currentActivityName, updatedActivity);
    setTags(updatedActivity.name, tagState);
    let unitMap;
    switch (newUnit.type) {
      case "none":
        unitMap = {};
        break;
      case "single":
        unitMap = {};
        break;
      case "multiple":
        unitMap = oldUnitMap.map((u) => ({ oldName: u.oldName, newName: multiUnitInput[u.newIndex].name }));
        break;
    }
    setUnit(updatedActivity.name, newUnit, unitMap);
    navigation.reset({
      index: 0,
      routes: [{ name: 'Activities' }, { name: 'Activity', params: { activityName: updatedActivity.name } }],
    });
  };

  const saveActivityWrapper = () => {
    // check for errors
    let hasError = false;
    if (activityNameError !== null) {
      activityNameInputRef?.current?.highlightError();
      hasError = true;
    }
    if (unitMode === null) {
      unitModeInputRef?.current?.highlightError();
      hasError = true;
    }
    if (unitMode === 'single' && singleUnitInputError !== null) {
      singleUnitInputRef?.current?.highlightError();
      hasError = true;
    }
    if (unitMode === 'multiple' && multiUnitInput.find((e) => e.nameError !== null || e.unitError !== null) !== undefined) {
      multiUnitInput.forEach((e, idx) => {
        if (e.nameError !== null) {
          multiUnitInput[idx].nameRef?.highlightError();
        }
        if (e.unitError !== null) {
          multiUnitInput[idx].unitRef?.highlightError();
        }
      });
      hasError = true;
    }

    if (hasError) {
      setShowErrors(true);
      return;
    }

    let dataLossAlert = (callback: () => void) => {
      Alert.alert("Warning", "Some numerical data may be lost.\n\nConsider backing up your data.", [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue', onPress: () => {
            callback();
          }
        },
      ]);
    };
    // data loss?
    if (activity !== null && activity.dataPoints.length > 0) {
      if (unitMode === 'no_value' && activity.unit.type !== 'none') {
        dataLossAlert(saveActivity);
      } else if (unitMode === 'single' && activity.unit.type === 'multiple') {
        dataLossAlert(saveActivity);
      } else if (unitMode === 'multiple' && activity.unit.type === 'single') {
        if (oldUnitMap.findIndex((u) => u.oldName === null) === -1) {
          dataLossAlert(saveActivity);
        } else {
          saveActivity();
        }
      } else if (unitMode === 'multiple' && activity.unit.type === 'multiple') {
        let oldNames: any[] = oldUnitMap.map((u) => u.oldName)
        if (isSupersetOf(new Set(oldNames), new Set(activity.unit.values.map((u: { name: string, unit: SubUnit }) => u.name)))) {
          saveActivity();
        } else {
          dataLossAlert(saveActivity);
        }
      } else {
        saveActivity();
      }
    } else {
      saveActivity();
    }
  }

  React.useEffect(() => {
    navigation.setOptions({
      title: activity === null ? "New Activity" : activity.name,
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => (
        <>
          <Button compact={true} onPress={saveActivityWrapper}><AntDesign name="check" size={24} color={"#ffffff"} /></Button>
        </>
      ),
    });
  }, [activityName, navigation, theme, activity, activityNameInput, activityDescriptionInput, singleUnitInput, selectedColor, tagState, multiUnitInput, unitMode]);

  const onUpdateTag = (action: "delete" | "update") => {
    let hasError = false;
    if (action !== "delete" && tagDialogNameError !== null) {
      tagDialogNameInputRef?.current?.highlightError();
      hasError = true;
    }
    if (hasError) {
      setShowTagDialogErrors(true);
      return;
    }


    if (action === "delete") {
      if (tagDialogName === "") {
        // nothing to do, deleted only a temporary tag
      } else {
        setTagState(tagState.filter((t: SetTag) => t.name !== tagDialogName));
      }
    } else if (action === "update") {
      if (tagDialogName === "") {
        setTagState([...tagState, { oldTagName: null, name: tagDialogNameInput, color: tagDialogColorInput }]);
      } else {
        setTagState(tagState.map((t: SetTag) => t.name === tagDialogName ? { ...t, name: tagDialogNameInput, color: tagDialogColorInput } : t));
      }
    }
    setTagDialogVisible(false);
    setShowTagDialogErrors(false);
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
    <>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>Value-less activities are useful to mark that an activity was done, without tracking any performance data.</Text>
    </>
  );

  const editSingleValue = () => (
    <InputWrapper error={showErrors ? singleUnitInputError : null} ref={singleUnitInputRef}>
      <UnitEditor unit={singleUnitInput} onChange={(unit: SubUnit | null) => {
        setSingleUnitInput(unit);
      }} />
    </InputWrapper>
  );

  const editMultipleValues = () => (
    <>
      {multiUnitInput.map((val, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <InputWrapper error={showErrors ? multiUnitInput[idx].nameError : null} ref={el => multiUnitInput[idx].nameRef = el}>
            <TextInput
              label="Name"
              value={val.name}
              onChangeText={text => {
                // Update sub-unit name
                const newVals = [...multiUnitInput];
                newVals[idx].name = text;
                setMultiUnitInput(newVals);
              }}
              mode="outlined"
            />
          </InputWrapper>
          <InputWrapper error={showErrors ? multiUnitInput[idx].unitError : null} ref={el => multiUnitInput[idx].unitRef = el}>
            <UnitEditor unit={val.unit} onChange={(unit: SubUnit | null) => {
              // Update unit
              const newVals = [...multiUnitInput];
              newVals[idx].unit = unit;
              setMultiUnitInput(newVals);
            }} />
          </InputWrapper>
          <View>
            {multiUnitInput.length > 2 && (
              <Button compact={true} onPress={() => {
                // Delete unit
                const newVals = [...multiUnitInput];
                newVals.splice(idx, 1);
                setMultiUnitInput(newVals);

                const newOldUnitMap = oldUnitMap
                  .filter((u) => u.newIndex !== idx)
                  .map((u) => u.newIndex > idx ? { ...u, newIndex: u.newIndex - 1 } : u);
                setOldUnitMap(newOldUnitMap);
              }}><AntDesign name="delete" size={20} color={theme.colors.onSurface} /></Button>
            )}
          </View>
        </View>
      ))}
      {multiUnitInput.length < 4 && (
        <Button compact={true} onPress={() => {
          // Add unit to the end
          setMultiUnitInput([...multiUnitInput, emptyMultiUnit]);
        }}>
          <AntDesign name="plus" size={20} color={theme.colors.onSurface} />
        </Button>
      )}
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={["left", "right", "bottom"]}>
      <Hint hint="edit_activity_introduction" />
      <SystemBars style={"light"} />
      <ScrollView style={styles.content}>
        <View style={{ gap: 10 }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <InputWrapper error={showErrors ? activityNameError : null} ref={activityNameInputRef}>
                <TextInput
                  label="Activity Name"
                  value={activityNameInput}
                  onChangeText={setActivityNameInput}
                  mode="outlined"
                />
              </InputWrapper>
              <ColorButton color={selectedColor} onPress={() => setColorDialogVisible(true)} />
            </View>
          </View>

          <View>
            <TextInput
              label="Description (optional)"
              value={activityDescriptionInput}
              onChangeText={setActivityDescriptionInput}
              multiline
              numberOfLines={2}
              style={{ height: 80 }}
              mode="outlined"
            />
          </View>

          <View>
            <Text style={styles.header}>Tags:</Text>
            <DraggableFlatList
              data={tagState}
              horizontal={true}
              keyExtractor={(item: SetTag) => item.name}
              renderItem={({ item, drag, isActive }: { item: SetTag, drag: () => void, isActive: boolean }) => (
                <Chip
                  onPress={() => {
                    setTagDialogVisible(true);
                    setTagDialogName(item.name);
                    setTagDialogNameInput(item.name);
                    setTagDialogColorInput(item.color);
                  }}
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
              <Chip onPress={() => {
                setTagDialogVisible(true);
                setTagDialogName("");
                setTagDialogNameInput("");
                setTagDialogColorInput(Math.floor(Math.random() * palette.length));
              }}
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

          <View>
            <Text style={styles.header}>Measurement:</Text>
            <InputWrapper error={showErrors ? unitModeError : null} ref={unitModeInputRef}>
              <SegmentedButtons
                value={unitMode ?? ""}
                onValueChange={(value) => setUnitMode(value as "no_value" | "single" | "multiple" | null)}   // TODO: fix this
                buttons={[
                  {
                    value: 'no_value',
                    label: 'None',
                    icon: 'checkbox-marked-outline',
                  },
                  {
                    value: 'single',
                    label: 'Single',
                    icon: 'numeric',
                  },
                  {
                    value: 'multiple',
                    label: 'Multiple',
                    icon: 'counter',
                  },
                ]}
              />
            </InputWrapper>
          </View>
          <View>
            {unitMode === null ? null : unitMode === 'no_value' ? editNoValue() : unitMode === 'single' ? editSingleValue() : editMultipleValues()}
          </View>
          <Hint hint="activity_value_help" inline />
        </View>
      </ScrollView>
      <Portal>
        {/* Tag dialog (existing) */}
        <Dialog visible={tagDialogVisible} onDismiss={() => { setTagDialogVisible(false); setShowTagDialogErrors(false); }}>
          <Dialog.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <InputWrapper error={showTagDialogErrors ? tagDialogNameError : null} ref={tagDialogNameInputRef}>
                <TextInput label="Tag Name" defaultValue={tagDialogNameInput} onChangeText={setTagDialogNameInput} mode="outlined" />
              </InputWrapper>
              <ColorButton color={tagDialogColorInput} onPress={() => setTagColorDialogVisible(true)} />
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
    </SafeAreaView>
  );
};

const getStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 10,
  },
  header: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    marginBottom: 5,
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

export default EditActivity; 