import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Dialog, Portal, SegmentedButtons } from 'react-native-paper';
import { ActivityType, SetTag, Tag, SubUnit, Unit } from "./StoreTypes";
import { TextInput, Button, Chip } from "react-native-paper";
import useStore from "./Store";
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from 'react-native-draggable-flatlist';
import ColorPicker from './ColorPicker';
import { defaultActivity } from "./DefaultActivity";
import { getTheme, getThemePalette, getThemeVariant } from "./Theme";
import { defaultStats } from "./DefaultActivity";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { UnitEditor } from "./UnitView";

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

const EditActivity: FC<EditActivityProps> = ({ navigation, route }) => {
  const { activityName } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity: ActivityType = activities.find((a: ActivityType) => a.name === activityName) ?? defaultActivity;
  const isNewActivity = activity.name === null;
  const theme = getTheme(activity);
  const themeVariant = getThemeVariant();
  const palette = getThemePalette();
  const updateActivity = useStore((state: any) => state.updateActivity);
  const setTags = useStore((state: any) => state.setTags);
  const setUnit = useStore((state: any) => state.setUnit);

  const [activityNameInput, setActivityNameInput] = useState(activity.name);
  const [selectedColor, setSelectedColor] = useState(activity.color);
  const [activityDescriptionInput, setActivityDescriptionInput] = useState(activity.description);
  const [unitMode, setUnitMode] = useState<'no_value' | 'single' | 'multiple'>((() => {
    switch (activity.unit.type) {
      case 'none':
        return 'no_value';
      case 'single':
        return 'single';
      case 'multiple':
        return 'multiple';
    }
  })());
  const [singleUnitInput, setSingleUnitInput] = useState<SubUnit>((() => {
    switch (activity.unit.type) {
      case 'none':
        return { type: "number", symbol: '' };
      case 'single':
        return activity.unit.unit;
      case 'multiple':
        return activity.unit.values[0].unit;
    }
  })());

  // Missing oldName represents there is no old name
  // null oldName represents that the old value comes from a single-valued unit
  // String oldName represents the old value name from a multi-valued unit
  const [oldUnitMap, setOldUnitMap] = useState<{ oldName: string | null, newIndex: number }[]>((() => {
    switch (activity.unit.type) {
      case 'none':
        return [];
      case 'single':
        return [{ oldName: null, newIndex: 0 }];
      case 'multiple':
        return activity.unit.values.map((u, index: number) => ({ oldName: u.name, newIndex: index }));
    }
  })());
  const [multiUnitInput, setMultiUnitInput] = useState<{ name: string, unit: SubUnit }[]>((() => {
    switch (activity.unit.type) {
      case 'none':
        return [
          { name: '', unit: { type: "number", symbol: '' } },
          { name: '', unit: { type: "number", symbol: '' } },
        ];
      case 'single':
        return [
          { name: '', unit: activity.unit.unit },
          { name: '', unit: { type: "number", symbol: '' } },
        ];
      case 'multiple':
        return activity.unit.values.map((u: { name: string, unit: SubUnit }) => ({ name: u.name, unit: u.unit }));
    }
  })());
  

  const [tagDialogVisible, setTagDialogVisible] = useState(false);
  const [tagState, setTagState] = useState<SetTag[]>(activity.tags.map((t: Tag) => ({ oldTagName: t.name, ...t })));
  const [tagDialogName, setTagDialogName] = useState("");
  const [tagDialogNameInput, setTagDialogNameInput] = useState("");
  const [tagDialogColorInput, setTagDialogColorInput] = useState(Math.floor(Math.random() * palette.length));
  const [tagColorDialogVisible, setTagColorDialogVisible] = useState(false);

  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  if (!activity) {
    return <Text>Activity not found</Text>;
  }


  const saveActivity = () => {
    let newUnit : Unit;
    switch (unitMode) {
      case 'no_value':
        newUnit = { type: "none" };
        break;
      case 'single':
        newUnit = { type: "single", unit: singleUnitInput };
        break;
      case 'multiple':
        newUnit = { type: "multiple", values: multiUnitInput };
        break;
    }

    const updatedActivity = {
      ...activity,
      name: activityNameInput,
      description: activityDescriptionInput,
      color: selectedColor,
      stats: isNewActivity ? defaultStats(newUnit) : activity.stats,
      // don't update unit, it will be updated in the setUnit call
    };
    const activityName = activity.name === "" ? updatedActivity.name : activity.name;
    updateActivity(activityName, updatedActivity);
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
    if (activityNameInput === "") {
      Alert.alert("Error", "Activity name cannot be empty");
    } else if (activityNameInput !== activity.name && activities.find((a: ActivityType) => a.name === activityNameInput)) {
      Alert.alert("Error", "An activity with this name already exists");
    } else {
      if (unitMode === 'multiple' && multiUnitInput.findIndex((u) => u.name === "") !== -1) {
        Alert.alert("Error", "All value names must be non-empty");
        return;
      } else if (unitMode === 'multiple' && new Set(multiUnitInput.map(u => u.name)).size !== multiUnitInput.length) {
        Alert.alert("Error", "All value names must be unique");
        return;
      }

      let dataLossAlert = (callback: () => void) => {
        Alert.alert("Warning", "Some numerical data may be lost.\n\nConsider backing up your data.", [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => {
            callback();
          } },
        ]);
      };
      // data loss?
      if (activity.dataPoints.length > 0) {
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
  }

    React.useEffect(() => {
      navigation.setOptions({
        title: activityName === null ? "New Activity" : activity.name,
        headerStyle: {
          backgroundColor: themeVariant == 'light' ? theme.colors.primary : theme.colors.background,
        },
        headerTintColor: "#ffffff",
        headerRight: () => (
          <>
            <Button compact={true} onPress={saveActivityWrapper}><AntDesign name="check" size={24} color={"#ffffff"} /></Button>
          </>
        ),
      });
    }, [activityName, navigation, theme, activity, activityNameInput, activityDescriptionInput, singleUnitInput, selectedColor, tagState, multiUnitInput, unitMode]);

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
      <>
      <Text style={{ color: theme.colors.onSurfaceVariant }}>Value-less activities are useful to mark that an activity was done, without tracking any performance data.</Text>
      </>
    );

    const editSingleValue = () => (
      <View style={styles.inputContainer}>
        <UnitEditor unit={singleUnitInput} onChange={(unit: SubUnit) => {
          setSingleUnitInput(unit);
        }} />
      </View>
    );

    const editMultipleValues = () => (
      <>
      {multiUnitInput.map((val, idx) => (
        <View key={idx} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 2, marginRight: 8 }}>
            <TextInput
              label="Value"
              value={val.name}
              onChangeText={text => {
                // Update sub-unit name
                const newVals = [...multiUnitInput];
                newVals[idx].name = text;
                setMultiUnitInput(newVals);
              }}
              mode="outlined"
            />
          </View>
          <View style={{ flex: 1 }}>
            <UnitEditor unit={val.unit} onChange={(unit: SubUnit) => {
              // Update unit
              const newVals = [...multiUnitInput];
              newVals[idx].unit = unit;
              setMultiUnitInput(newVals);
            }} />
          </View>
          <View style={{ width: 40, marginLeft: 4 }}>
            {multiUnitInput.length > 2 && (
              <Button compact={true} onPress={() => {
                // Delete unit
                const newVals = [...multiUnitInput];
                newVals.splice(idx, 1);
                setMultiUnitInput(newVals);

                const newOldUnitMap = [...oldUnitMap];
                newOldUnitMap
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
          setMultiUnitInput([...multiUnitInput, { name: '', unit: { type: "number", symbol: '' } }]);
        }}>
          <AntDesign name="plus" size={20} color={theme.colors.onSurface} />
        </Button>
      )}
      </>
    );

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={["left", "right"]}>
        <SystemBars style={"light"} />
        <ScrollView style={styles.content}>
          <View style={styles.inputContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TextInput
                  label="Activity Name"
                  value={activityNameInput}
                  onChangeText={setActivityNameInput}
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
              value={activityDescriptionInput}
              onChangeText={setActivityDescriptionInput}
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
            </View>
          </View>

          <View style={styles.inputContainer}>
            {unitMode === 'no_value' ? editNoValue() : unitMode === 'single' ? editSingleValue() : editMultipleValues()}
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
                  <TextInput label="Tag Name" defaultValue={tagDialogNameInput} onChangeText={setTagDialogNameInput} mode="outlined" />
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
      </SafeAreaView>
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

  export default EditActivity; 