import React, { useState, FC, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Pressable, TextInput } from "react-native";
import Menu from "../Components/Menu";
import { ActivityType, SetTag, Tag, SubUnit, Unit, WeightUnit, State, ActivityPath } from "../Model/StoreTypes";
import TextField from "../Components/TextField";
import SegmentedButtons from "../Components/SegmentedButtons";
import { stringToNumber } from "../Model/Unit";
import useStore from "../Model/Store";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import DraggableFlatList from "react-native-draggable-flatlist";
import ColorPicker from "../Components/ColorPicker";
import TagDialog from "../Components/TagDialog";
import { useAppTheme, useThemePalette, Theme } from "../Model/Theme";
import { defaultCalendar, defaultGraphs, defaultStats, defaultBleScaleGraphs } from "../Model/DefaultActivity";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { UnitEditor } from "../Components/UnitView";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import { CheckButton, DeleteButton, ButtonRow, Button, ColorButton, PlusIcon } from "../Components/Element";
import * as Crypto from "expo-crypto";

type SpecialType = "ble_scale" | null;

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
  const activityPath: ActivityPath = route.params.activityPath;
  const activity: ActivityType | null =
    useStore((state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]) ?? null;
  const palette = useThemePalette();
  const updateActivity = useStore((state: any) => state.updateActivity);
  const createActivity = useStore((state: any) => state.createActivity);
  const setTags = useStore((state: any) => state.setTags);
  const setUnit = useStore((state: any) => state.setUnit);

  const [showErrors, setShowErrors] = useState(false);
  const [showTagDialogErrors, setShowTagDialogErrors] = useState(false);

  const [unitMode, setUnitMode] = useState<"yes_no" | "measurable" | null>(
    (() => {
      if (!activity) {
        return null;
      } else {
        switch (activity.unit.type) {
          case "none":
            return "yes_no";
          case "single":
            return "measurable";
          case "multiple":
            return "measurable";
        }
      }
    })(),
  );

  const [activityNameInput, setActivityNameInput] = useState(activity?.name ?? "");
  const activityNameInputRef = useRef<InputWrapperRef>(undefined);
  let activityNameError: string | null = null;
  if (activityNameInput === "") {
    activityNameError = "Enter activity name";
  }

  let unitModeError = null;
  const unitModeInputRef = useRef<InputWrapperRef>(undefined);
  if (unitMode === null) {
    unitModeError = "Choose measurement type";
  }

  const [singleUnitInput, setSingleUnitInput] = useState<SubUnit | null>(
    (() => {
      if (!activity) {
        return null;
      } else {
        switch (activity.unit.type) {
          case "none":
            return null;
          case "single":
            return activity.unit.unit;
          case "multiple":
            return activity.unit.values[0].unit;
        }
      }
    })(),
  );

  const [selectedColor, setSelectedColor] = useState(
    activity === null ? Math.floor(Math.random() * palette.length) : activity.color,
  );
  const theme = useAppTheme(selectedColor);
  const styles = getStyles(theme);
  const [activityDescriptionInput, setActivityDescriptionInput] = useState(activity?.description ?? "");

  // Missing oldName represents there is no old name
  // null oldName represents that the old value comes from a single-valued unit
  // String oldName represents the old value name from a multi-valued unit
  const [oldUnitMap, setOldUnitMap] = useState<{ oldName: string | null; newIndex: number }[]>(
    (() => {
      if (!activity) {
        return [];
      } else {
        switch (activity.unit.type) {
          case "none":
            return [];
          case "single":
            return [{ oldName: null, newIndex: 0 }];
          case "multiple":
            return activity.unit.values.map((u, index: number) => ({ oldName: u.name, newIndex: index }));
        }
      }
    })(),
  );

  const emptyMultiUnit = { name: "", unit: null, nameRef: null, unitRef: null, nameError: null, unitError: null };

  const computeMultiUnitInputErrors = (
    vals: { name: string; unit: SubUnit | null; nameRef: InputWrapperRef | null; unitRef: InputWrapperRef | null }[],
  ) => {
    return vals.map((val, idx) => {
      return {
        ...val,
        nameError:
          val.name === ""
            ? "Enter a name"
            : vals.findIndex((u) => u.name === val.name) !== idx
              ? "Name must be unique"
              : null,
        unitError: val.unit === null ? "Select a unit" : null,
      };
    });
  };

  const [multiUnitInput, setMultiUnitInputInternal] = useState<
    {
      name: string;
      unit: SubUnit | null;
      nameRef: InputWrapperRef | null;
      unitRef: InputWrapperRef | null;
      nameError: string | null;
      unitError: string | null;
    }[]
  >(
    (() => {
      let res = [];
      if (!activity) {
        res = [emptyMultiUnit];
      } else {
        switch (activity.unit.type) {
          case "none":
            res = [emptyMultiUnit];
            break;
          case "single":
            res = [{ ...emptyMultiUnit, unit: activity.unit.unit }];
            break;
          case "multiple":
            res = activity.unit.values.map((u: { name: string; unit: SubUnit }) => ({
              ...emptyMultiUnit,
              name: u.name,
              unit: u.unit,
            }));
            break;
        }
      }
      return computeMultiUnitInputErrors(res);
    })(),
  );

  const setMultiUnitInput = (
    vals: { name: string; unit: SubUnit | null; nameRef: InputWrapperRef | null; unitRef: InputWrapperRef | null }[],
  ) => {
    setMultiUnitInputInternal(computeMultiUnitInputErrors(vals));
  };

  const [tagDialogVisible, setTagDialogVisible] = useState(false);
  const [tagState, setTagState] = useState<SetTag[]>(
    activity?.tags.map((t: Tag) => ({ oldTagName: t.name, ...t })) ?? [],
  );
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

  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const [specialType, setSpecialType] = useState<SpecialType>(activity?.special?.type ?? null);

  const bleMinWeightUnit = multiUnitInput[0]?.unit?.type === "weight" ? (multiUnitInput[0]?.unit?.unit ?? "kg") : "kg";
  const [bleMinWeight, setBleMinWeight] = useState<string>(
    "" + (activity?.special?.minWeight ?? (bleMinWeightUnit === "kg" ? 10 : 22)),
  );
  let bleMinWeightError: string | null = null;
  const bleMinWeightNumber = stringToNumber(bleMinWeight, { type: "weight", unit: bleMinWeightUnit });
  if (bleMinWeightUnit === "kg" && (bleMinWeightNumber ?? 0) < 1) {
    bleMinWeightError = "Minimum weight must be at least 1 kg";
  } else if (bleMinWeightUnit === "lb" && (bleMinWeightNumber ?? 0) < 2) {
    bleMinWeightError = "Minimum weight must be at least 2 lb";
  }
  const bleMinWeightInputRef = useRef<InputWrapperRef>(undefined);
  const [specialMenuVisible, setSpecialMenuVisible] = useState(false);

  const specialIcon = (specialType: SpecialType) => {
    switch (specialType) {
      case "ble_scale":
        return "bluetooth";
    }
  };

  const saveActivity = () => {
    let newUnit: Unit;
    switch (unitMode) {
      case "yes_no":
        newUnit = { type: "none" };
        break;
      case "measurable":
        if (multiUnitInput.length === 1) {
          if (multiUnitInput[0].unit === null) {
            console.error("Error", "Single unit cannot be null");
            return;
          }
          newUnit = { type: "single", unit: multiUnitInput[0].unit };
        } else {
          if (multiUnitInput.findIndex((u) => u.unit === null) !== -1) {
            console.error("Error", "All value units must be non-empty");
            return;
          }
          // no nulls at this point
          newUnit = { type: "multiple", values: multiUnitInput as { name: string; unit: SubUnit }[] };
        }
        break;
      case null:
        console.error("Error", "Unit mode cannot be null");
        return;
    }

    const bleMinWeightNumber = stringToNumber(bleMinWeight, { type: "weight", unit: bleMinWeightUnit });
    if (bleMinWeightNumber === null) {
      console.error("Error", "Invalid minimum weight");
      return;
    }

    let newActivityPath: ActivityPath = activityPath;
    if (activity === null) {
      const updatedActivity: ActivityType = {
        uuid: Crypto.randomUUID(),
        name: activityNameInput,
        description: activityDescriptionInput,
        unit: newUnit,
        color: selectedColor,
        dataPoints: [],
        tags: [],
        stats: defaultStats(newUnit),
        calendars: [defaultCalendar(newUnit)],
        graphs: specialType === "ble_scale" ? defaultBleScaleGraphs(newUnit) : defaultGraphs(newUnit),
        special: specialType === "ble_scale" ? { type: "ble_scale", minWeight: bleMinWeightNumber } : null,
      };
      newActivityPath = createActivity(activityPath.tabId, updatedActivity);
    } else {
      const updatedActivity: ActivityType = {
        ...activity,
        name: activityNameInput,
        description: activityDescriptionInput,
        color: selectedColor,
        special: specialType === "ble_scale" ? { type: "ble_scale", minWeight: bleMinWeightNumber } : null,
        // don't update unit, it will be updated in the setUnit call
        // don't update tags, they will be updated in the setTags call
      };
      updateActivity(activityPath, updatedActivity);
    }

    setTags(newActivityPath, tagState);
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
    setUnit(newActivityPath, newUnit, unitMap);
    navigation.reset({
      index: 0,
      routes: [{ name: "Activities" }, { name: "Activity", params: { activityPath: newActivityPath } }],
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
    if (unitMode === "measurable" && multiUnitInput.length === 1 && multiUnitInput[0].unitError !== null) {
      multiUnitInput[0].unitRef?.highlightError();
      hasError = true;
    }
    if (
      unitMode === "measurable" &&
      multiUnitInput.length > 1 &&
      multiUnitInput.find((e) => e.nameError !== null || e.unitError !== null) !== undefined
    ) {
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
    if (specialType === "ble_scale" && bleMinWeightError !== null) {
      bleMinWeightInputRef?.current?.highlightError();
      hasError = true;
    }

    if (hasError) {
      setShowErrors(true);
      return;
    }

    let dataLossAlert = (callback: () => void) => {
      Alert.alert("Warning", "Some numerical data may be lost.\n\nConsider backing up your data.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            callback();
          },
        },
      ]);
    };
    // data loss?
    if (activity !== null && activity.dataPoints.length > 0) {
      if (unitMode === "yes_no" && activity.unit.type !== "none") {
        dataLossAlert(saveActivity);
      } else if (unitMode === "measurable" && multiUnitInput.length === 1 && activity.unit.type === "multiple") {
        dataLossAlert(saveActivity);
      } else if (unitMode === "measurable" && multiUnitInput.length > 1 && activity.unit.type === "single") {
        if (oldUnitMap.findIndex((u) => u.oldName === null) === -1) {
          dataLossAlert(saveActivity);
        } else {
          saveActivity();
        }
      } else if (unitMode === "measurable" && multiUnitInput.length > 1 && activity.unit.type === "multiple") {
        let oldNames: any[] = oldUnitMap.map((u) => u.oldName);
        if (
          isSupersetOf(
            new Set(oldNames),
            new Set(activity.unit.values.map((u: { name: string; unit: SubUnit }) => u.name)),
          )
        ) {
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
  };

  React.useEffect(() => {
    navigation.setOptions({
      title: activity === null ? "New Activity" : activity.name,
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.onHeader,
      headerRight: () => (
        <ButtonRow>
          {
            <Button onPress={() => setSpecialMenuVisible(true)}>
              <MaterialCommunityIcons
                name={specialType ? (specialIcon(specialType) as any) : "star-outline"}
                size={24}
                color={theme.onHeader}
              />
            </Button>
          }
          <CheckButton onPress={saveActivityWrapper} color={theme.onHeader} />
        </ButtonRow>
      ),
    });
  }, [
    activityPath,
    navigation,
    theme,
    activity,
    activityNameInput,
    activityDescriptionInput,
    singleUnitInput,
    selectedColor,
    tagState,
    multiUnitInput,
    unitMode,
    specialType,
    bleMinWeight,
  ]);

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
        setTagState(
          tagState.map((t: SetTag) =>
            t.name === tagDialogName ? { ...t, name: tagDialogNameInput, color: tagDialogColorInput } : t,
          ),
        );
      }
    }
    setTagDialogVisible(false);
    setShowTagDialogErrors(false);
  };

  const handleColorSelect = (colorIx: number) => {
    setSelectedColor(colorIx);
    setColorDialogVisible(false);
  };

  const setSpecialActivity = (specialType: SpecialType) => {
    setSpecialType(specialType);
    setUnitMode("measurable");
    // TODO: allow pounds
    setMultiUnitInput([
      { name: "Weight", unit: { type: "weight", unit: "kg" }, unitRef: null, nameRef: null },
      { name: "Time", unit: { type: "time", unit: "seconds" }, unitRef: null, nameRef: null },
    ]);
  };

  const editNoValue = () => (
    <Text style={{ color: theme.onSurfaceVariant, paddingBottom: 10 }}>
      e.g. Did you excercise? Did you play chess?
    </Text>
  );

  const editSingleValue = () => (
    <View style={{ gap: 10 }}>
      <Text style={{ color: theme.onSurfaceVariant }}>
        e.g. How many kilometers did you run? How many pull-ups did you do?
      </Text>
      <InputWrapper
        error={showErrors ? multiUnitInput[0].unitError : null}
        ref={(el) => (multiUnitInput[0].unitRef = el)}
      >
        <UnitEditor
          activityColor={selectedColor}
          unit={multiUnitInput[0].unit}
          onChange={(unit: SubUnit | null) => {
            setMultiUnitInput([{ ...multiUnitInput[0], unit: unit }]);
          }}
        />
      </InputWrapper>
      <View style={{ flex: 1, flexDirection: "row", justifyContent: "center" }}>
        <Button onPress={() => setMultiUnitInput([...multiUnitInput, emptyMultiUnit])}>
          <PlusIcon color={theme.onSurface} />
          <Text style={{ color: theme.onSurface }}>Add Unit</Text>
        </Button>
      </View>
    </View>
  );

  const editMultipleValues = () => (
    <View style={{ gap: 10 }}>
      <Text style={{ color: theme.onSurfaceVariant }}>
        e.g. How many kilometers did you run? How many pull-ups did you do?
      </Text>
      <View style={{ gap: 4 }}>
        {multiUnitInput.map((val, idx) => (
          <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <InputWrapper
              error={showErrors ? multiUnitInput[idx].nameError : null}
              ref={(el) => (multiUnitInput[idx].nameRef = el)}
              containerStyle={{ flex: 1 }}
            >
              <TextField
                label="Name"
                value={val.name}
                containerStyle={{ flex: 1 }}
                onChangeText={(text) => {
                  // Update sub-unit name
                  const newVals = [...multiUnitInput];
                  newVals[idx].name = text;
                  setMultiUnitInput(newVals);
                }}
                activityColor={selectedColor}
              />
            </InputWrapper>
            <InputWrapper
              error={showErrors ? multiUnitInput[idx].unitError : null}
              ref={(el) => (multiUnitInput[idx].unitRef = el)}
              containerStyle={{ flex: 1 }}
            >
              <UnitEditor
                activityColor={selectedColor}
                unit={val.unit}
                onChange={(unit: SubUnit | null) => {
                  // Update unit
                  const newVals = [...multiUnitInput];
                  newVals[idx].unit = unit;
                  setMultiUnitInput(newVals);
                }}
              />
            </InputWrapper>
            <View style={{ paddingTop: 15 }}>
              <DeleteButton
                onPress={() => {
                  if (multiUnitInput.length >= 3) {
                    // Delete unit
                    const newVals = [...multiUnitInput];
                    newVals.splice(idx, 1);
                    setMultiUnitInput(newVals);

                    const newOldUnitMap = oldUnitMap
                      .filter((u) => u.newIndex !== idx)
                      .map((u) => (u.newIndex > idx ? { ...u, newIndex: u.newIndex - 1 } : u));
                    setOldUnitMap(newOldUnitMap);
                  } else {
                    setMultiUnitInput(multiUnitInput.slice(0, idx).concat(multiUnitInput.slice(idx + 1)));
                  }
                }}
                color={theme.onSurface}
              />
            </View>
          </View>
        ))}
        {multiUnitInput.length < 4 && (
          <View style={{ flex: 1, flexDirection: "row", justifyContent: "center" }}>
            <Button onPress={() => setMultiUnitInput([...multiUnitInput, emptyMultiUnit])}>
              <PlusIcon color={theme.onSurface} />
              <Text style={{ color: theme.onSurface }}>Add Unit</Text>
            </Button>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={100}>
      <SystemBars style={{ statusBar: "light", navigationBar: theme.variant == "light" ? "dark" : "light" }} />
      <View style={{ position: "absolute", top: 10, right: 0 }}>
        <Menu
          visible={specialMenuVisible}
          onDismiss={() => setSpecialMenuVisible(false)}
          anchor={<View style={{ width: 1, height: 1 }} />}
        >
          <Menu.Item
            onPress={() => {
              (setSpecialActivity(null), setSpecialMenuVisible(false));
            }}
            title="Normal"
          />
          <Menu.Item
            onPress={() => {
              (setSpecialActivity("ble_scale"), setSpecialMenuVisible(false));
            }}
            title={"BLE Scale"}
            trailingIcon={specialIcon("ble_scale") as any}
          />
        </Menu>
      </View>
      <ScrollView>
        <SafeAreaView edges={["left", "right", "bottom"]}>
          <View style={{ padding: 10, gap: 12 }}>
            <InputWrapper error={showErrors ? activityNameError : null} ref={activityNameInputRef}>
              <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 14 }}>
                <TextField
                  containerStyle={{ flex: 1 }}
                  label="Activity Name"
                  value={activityNameInput}
                  onChangeText={setActivityNameInput}
                  activityColor={selectedColor}
                />
                <ColorButton color={selectedColor} onPress={() => setColorDialogVisible(true)} />
              </View>
            </InputWrapper>

            <View>
              <TextInput
                placeholder="Description (optional)"
                placeholderTextColor={theme.onSurfaceVariant}
                value={activityDescriptionInput}
                onChangeText={setActivityDescriptionInput}
                multiline
                numberOfLines={Infinity}
                style={styles.descriptionInput}
              />
            </View>

            <View>
              <Text style={styles.header}>Tags:</Text>
              <DraggableFlatList
                data={tagState}
                horizontal={true}
                keyExtractor={(item: SetTag) => item.name}
                renderItem={({ item, drag, isActive }: { item: SetTag; drag: () => void; isActive: boolean }) => (
                  <Pressable
                    onPress={() => {
                      setTagDialogVisible(true);
                      setTagDialogName(item.name);
                      setTagDialogNameInput(item.name);
                      setTagDialogColorInput(item.color);
                    }}
                    onLongPress={drag}
                    android_ripple={{ foreground: true, color: theme.elevation3 }}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: palette[item.color],
                        opacity: isActive ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: theme.surface }]}>{item.name}</Text>
                  </Pressable>
                )}
                onDragEnd={(data) => {
                  setTagState(data.data);
                }}
                contentContainerStyle={{ flexDirection: "row" }}
              />
              <View style={{ flexDirection: "row" }}>
                <Pressable
                  onPress={() => {
                    setTagDialogVisible(true);
                    setTagDialogName("");
                    setTagDialogNameInput("");
                    setTagDialogColorInput(Math.floor(Math.random() * palette.length));
                  }}
                  android_ripple={{ foreground: true, color: theme.elevation3 }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.outline,
                    },
                  ]}
                >
                  <Text style={[styles.chipLabel, { color: theme.onSurfaceVariant }]}>+</Text>
                </Pressable>
              </View>
            </View>

            {specialType === "ble_scale" && (
              <View style={{ marginBottom: 20, gap: 10 }}>
                <SegmentedButtons
                  value={bleMinWeightUnit}
                  onValueChange={(value) => {
                    const conversionFactor =
                      value === "kg" && bleMinWeightUnit === "lb"
                        ? 0.453592
                        : value === "lb" && bleMinWeightUnit === "kg"
                          ? 2.20462
                          : 1;
                    setBleMinWeight((old: string) => "" + Math.round(Number(old) * conversionFactor));
                    setMultiUnitInput(
                      multiUnitInput.map((u, idx) =>
                        idx === 0
                          ? {
                              ...u,
                              unit: { type: "weight", unit: value as WeightUnit },
                            }
                          : u,
                      ),
                    );
                  }}
                  buttons={[
                    { value: "kg", label: "kg" },
                    { value: "lb", label: "lb" },
                  ]}
                />
                <InputWrapper error={showErrors ? bleMinWeightError : null} ref={bleMinWeightInputRef}>
                  <TextField
                    containerStyle={{ flex: 1 }}
                    label={`Minimum Weight (${bleMinWeightUnit})`}
                    value={bleMinWeight}
                    onChangeText={setBleMinWeight}
                    keyboardType="numeric"
                    activityColor={selectedColor}
                  />
                </InputWrapper>
              </View>
            )}

            {specialType !== "ble_scale" && (
              <>
                <Text style={styles.header}>Activity type:</Text>
                <InputWrapper error={showErrors ? unitModeError : null} ref={unitModeInputRef}>
                  <SegmentedButtons
                    value={unitMode ?? ""}
                    onValueChange={(value) => setUnitMode(value as "yes_no" | "measurable" | null)} // TODO: fix this
                    buttons={[
                      { value: "yes_no", label: "Yes or No", icon: "checkbox-marked-outline" },
                      { value: "measurable", label: "Measurable", icon: "numeric" },
                    ]}
                  />
                </InputWrapper>
                <View>
                  {unitMode === null
                    ? null
                    : unitMode === "yes_no"
                      ? editNoValue()
                      : unitMode === "measurable"
                        ? multiUnitInput.length === 1
                          ? editSingleValue()
                          : editMultipleValues()
                        : null}
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </ScrollView>
      {/* Tag dialog */}
      <TagDialog
        visible={tagDialogVisible}
        onDismiss={() => {
          setTagDialogVisible(false);
          setShowTagDialogErrors(false);
        }}
        nameInput={tagDialogNameInput}
        onChangeName={setTagDialogNameInput}
        nameError={showTagDialogErrors ? tagDialogNameError : null}
        nameInputRef={tagDialogNameInputRef}
        color={tagDialogColorInput}
        onChangeColor={setTagDialogColorInput}
        onDelete={() => onUpdateTag("delete")}
        onUpdate={() => onUpdateTag("update")}
        palette={palette}
        theme={theme}
      />
      {/* Color picker dialog */}
      <ColorPicker
        visible={colorDialogVisible}
        palette={palette}
        selectedColor={selectedColor}
        onSelect={handleColorSelect}
        onDismiss={() => setColorDialogVisible(false)}
        theme={theme}
      />
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    chip: {
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 6,
      marginRight: 8,
      marginBottom: 8,
      overflow: "hidden",
    },
    chipLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      letterSpacing: 0.1,
    },
    content: {
      flex: 1,
      paddingHorizontal: 10,
    },
    header: {
      color: theme.onSurfaceVariant,
      fontSize: 16,
      marginBottom: 5,
    },
    descriptionInput: {
      color: theme.onSurface,
      borderColor: theme.outline,
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
    },
    colorButton: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 0,
      justifyContent: "center",
      alignItems: "center",
      height: 48,
      width: 48,
    },
  });

export default EditActivity;
