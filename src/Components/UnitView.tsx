import { Text, View, ScrollView, Pressable, Modal, KeyboardAvoidingView } from "react-native";
import { TextInput, List, SegmentedButtons } from "react-native-paper";
import { ClimbingGrade, DistanceUnit, SubUnit, SubUnitType, TimeUnit, WeightUnit } from "../Model/StoreTypes";
import { useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../Model/Theme";
import {
  renderUnit,
  mapStringValue,
  uiaaGrades,
  vScaleGrades,
  numberToString,
  stringToNumber,
  ydsGrades,
  frenchGrades,
  fontGrades,
} from "../Model/Unit";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import GradeSelection from "./GradeSelection";
import { SafeAreaView } from "react-native-safe-area-context";
import { CheckButton, MinusIcon, PlusIcon, Button } from "./Element";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

const subUnitProps = (
  subUnitType: SubUnitType,
  allUnits: SubUnit[],
  setAllUnits: (units: SubUnit[]) => void,
): { title: string; icon: string; description: string | null; children: React.ReactNode | null } => {
  switch (subUnitType) {
    case "count":
      return {
        title: "Count",
        icon: "numeric-3-circle-outline",
        description: "reps, sets, etc.",
        children: null,
      };
    case "percentage":
      return {
        title: "Percentage",
        icon: "percent",
        description: null,
        children: null,
      };
    case "distance":
      return {
        title: "Distance",
        icon: "ruler",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as DistanceUnit } : unit)),
                );
              }}
              buttons={[
                { value: "mm", label: "mm" },
                { value: "cm", label: "cm" },
                { value: "m", label: "m" },
                { value: "km", label: "km" },
              ]}
            />
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as DistanceUnit } : unit)),
                );
              }}
              buttons={[
                { value: "in", label: "in" },
                { value: "ft", label: "ft" },
                { value: "yd", label: "yd" },
                { value: "mi", label: "mi" },
              ]}
            />
          </View>
        ),
      };
    case "weight":
      return {
        title: "Weight",
        icon: "weight-kilogram",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as WeightUnit } : unit)),
                );
              }}
              buttons={[
                { value: "g", label: "g" },
                { value: "kg", label: "kg" },
              ]}
            />
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as WeightUnit } : unit)),
                );
              }}
              buttons={[
                { value: "oz", label: "oz" },
                { value: "lb", label: "lb" },
              ]}
            />
          </View>
        ),
      };
    case "time":
      return {
        title: "Time",
        icon: "timer",
        description: null,
        children: (
          <SegmentedButtons
            value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
            onValueChange={(value) => {
              setAllUnits(
                allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as TimeUnit } : unit)),
              );
            }}
            buttons={[
              { value: "seconds", label: "seconds" },
              { value: "hours", label: "hours" },
            ]}
          />
        ),
      };
    case "climbing_grade":
      return {
        title: "Climbing Grade",
        icon: "numeric-9-plus",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.grade ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) =>
                    unit.type === subUnitType ? { ...unit, grade: value as ClimbingGrade } : unit,
                  ),
                );
              }}
              buttons={[
                { value: "uiaa", label: "UIAA" },
                { value: "french", label: "French" },
                { value: "yds", label: "YDS" },
              ]}
            />
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.grade ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) =>
                    unit.type === subUnitType ? { ...unit, grade: value as ClimbingGrade } : unit,
                  ),
                );
              }}
              buttons={[
                { value: "font", label: "Font" },
                { value: "v-scale", label: "V-Scale" },
              ]}
            />
          </View>
        ),
      };
    case "number":
      return {
        title: "Other",
        icon: "numeric",
        description: "Numerical value",
        children: (
          <InputWrapper>
            <TextInput
              label="Unit"
              value={allUnits.find((unit) => unit.type === subUnitType)?.symbol ?? ""}
              onChangeText={(text) =>
                setAllUnits(allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, symbol: text } : unit)))
              }
              mode="outlined"
            />
          </InputWrapper>
        ),
      };
  }
};

export const UnitEditor = ({ unit, onChange }: { unit: SubUnit | null; onChange: (unit: SubUnit | null) => void }) => {
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const theme = useAppTheme();

  const [chosenUnitType, setChosenUnitType] = useState<SubUnitType | null>(unit?.type ?? null);
  const [allUnits, setAllUnits] = useState<SubUnit[]>(
    (() => {
      let defaultUnits: SubUnit[] = [
        { type: "count" },
        { type: "percentage" },
        { type: "distance", unit: "km" },
        { type: "weight", unit: "kg" },
        { type: "time", unit: "seconds" },
        { type: "climbing_grade", grade: "french" },
        { type: "number", symbol: "" },
      ];
      return defaultUnits.map((defaultUnit) => (unit?.type === defaultUnit.type ? unit : defaultUnit));
    })(),
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable
        onPress={() => setUnitDialogVisible(true)}
        style={({ pressed }) => [
          {
            flex: 1,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <TextInput
          style={{ flex: 1 }}
          label="Unit"
          value={unit === null ? "" : renderUnit(unit)}
          editable={false}
          mode="outlined"
        />
      </Pressable>
      <Modal
        transparent={false}
        backdropColor={theme.colors.surface}
        onRequestClose={() => setUnitDialogVisible(false)}
        animationType="fade"
        visible={unitDialogVisible}
        onDismiss={() => setUnitDialogVisible(false)}
      >
        <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
          <SafeAreaView style={{ flex: 1 }}>
            <View
              style={{
                backgroundColor: theme.colors.elevation.level1,
                elevation: 2,
                flexDirection: "row",
                paddingVertical: 10,
                paddingRight: 10,
                alignItems: "center",
              }}
            >
              <Button onPress={() => setUnitDialogVisible(false)}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
              </Button>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, color: theme.colors.onSurface }}>Select Unit</Text>
              </View>
              <CheckButton
                onPress={() => {
                  setUnitDialogVisible(false);
                  const newUnitInput = allUnits.find((unit) => unit.type === chosenUnitType) ?? null;
                  onChange(newUnitInput);
                }}
                color={theme.colors.onSurface}
              />
            </View>
            <ScrollView>
              <View style={{ gap: 10, padding: 10 }}>
                {allUnits.map((subUnit) => {
                  const { title, icon, description, children } = subUnitProps(subUnit.type, allUnits, setAllUnits);
                  if (children) {
                    return (
                      <List.Accordion
                        key={subUnit.type}
                        title={title}
                        left={() => <List.Icon icon={icon} />}
                        description={description}
                        expanded={chosenUnitType === subUnit.type}
                        onPress={() => setChosenUnitType(chosenUnitType === subUnit.type ? null : subUnit.type)}
                      >
                        {children}
                      </List.Accordion>
                    );
                  } else {
                    return (
                      <List.Item
                        key={subUnit.type}
                        title={title}
                        titleStyle={{
                          color: chosenUnitType === subUnit.type ? theme.colors.primary : theme.colors.onSurface,
                        }}
                        onPress={() => setChosenUnitType(subUnit.type)}
                        left={() => <List.Icon icon={icon} />}
                        description={description}
                      />
                    );
                  }
                })}
              </View>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export const ValueEditor = ({
  unit,
  label,
  value,
  error,
  inputWrapperRef,
  onChange,
  setSubmitDisabled, // whether to disable submitting the value
}: {
  unit: SubUnit;
  label: string;
  value: string;
  error: string | null;
  inputWrapperRef: React.RefObject<InputWrapperRef>;
  onChange: (value: string) => void;
  setSubmitDisabled: (disabled: string | null) => void;
}) => {
  const theme = useAppTheme();

  const [gradeSelectionVisible, setGradeSelectionVisible] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    setTimerActive(false);
    setTimerStartTime(null);
    setNow(null);
    setSubmitDisabled(null);
    onChange(numberToString(0, unit));
  };

  const toggleTimer = (timeUnit: TimeUnit) => {
    const timeFactor = timeUnit === "hours" ? 3600e3 : 1e3;
    if (timerActive) {
      // stop timer
      onChange(addTimerToValue(value));
      setTimerActive(false);
      setTimerStartTime(null);
      setSubmitDisabled(null);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    } else {
      // start timer
      if (value === "") {
        onChange(numberToString(0, unit));
      }
      setTimerActive(true);
      setTimerStartTime(Date.now() / timeFactor);
      setNow(Date.now() / timeFactor);
      setSubmitDisabled("Timer is running");

      setTimerInterval(
        setInterval(() => {
          setNow(Date.now() / timeFactor);
        }, 200),
      );
    }
  };

  const addTimerToValue = (val: string) => {
    return numberToString((stringToNumber(val, unit) ?? 0) + ((now ?? 0) - (timerStartTime ?? 0)), unit);
  };

  const gradePicker = (options: string[]) => {
    return (
      <>
        <Pressable
          onPress={() => setGradeSelectionVisible(true)}
          style={({ pressed }) => [
            {
              flex: 1,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <TextInput
            label={label}
            value={value}
            onChangeText={(text) => onChange(text)}
            keyboardType="numeric"
            editable={false}
            mode="outlined"
          />
        </Pressable>
        <GradeSelection
          visible={gradeSelectionVisible}
          options={options}
          value={value}
          onSelect={onChange}
          onDismiss={() => setGradeSelectionVisible(false)}
        />
      </>
    );
  };

  const showTimePicker = () => {
    const valueHours = stringToNumber(value, unit);
    DateTimePickerAndroid.open({
      mode: "time",
      is24Hour: true,
      value: valueHours
        ? new Date(
            0,
            0,
            0,
            Math.floor((valueHours ?? 0) + 1 / 120),
            Math.floor((((valueHours ?? 0) + 1 / 120) % 1) * 60),
          )
        : new Date(),
      onChange: (event, selectedDate) => {
        if (selectedDate !== undefined) {
          const newValue = selectedDate.getHours() + selectedDate.getMinutes() / 60;
          onChange(numberToString(newValue, unit));
        }
      },
    });
  };

  return (
    <InputWrapper error={error} ref={inputWrapperRef}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 4 }}>
        {(() => {
          switch (unit.type) {
            case "time":
              switch (unit.unit) {
                case "hours":
                  return (
                    <>
                      <TextInput
                        style={{ flex: 1 }}
                        label={label}
                        value={value}
                        onChangeText={onChange}
                        mode="outlined"
                      />
                      <Button onPress={() => showTimePicker()}>
                        <MaterialCommunityIcons name="timer" size={22} color={theme.colors.onSurface} />
                      </Button>
                    </>
                  );
                case "seconds":
                  return (
                    <>
                      <TextInput
                        style={{ flex: 1 }}
                        label={label}
                        value={timerActive ? addTimerToValue(value) : value}
                        editable={!timerActive}
                        onChangeText={onChange}
                        mode="outlined"
                      />
                      <Button onPress={() => resetTimer()}>
                        <MaterialCommunityIcons name="reload" size={22} color={theme.colors.onSurface} />
                      </Button>
                      <Button onPress={() => toggleTimer(unit.unit)}>
                        <MaterialCommunityIcons
                          name={timerActive ? "pause" : "play"}
                          size={22}
                          color={theme.colors.onSurface}
                        />
                      </Button>
                    </>
                  );
                default:
                  return null;
              }
            case "count":
              return (
                <>
                  <TextInput
                    style={{ flex: 1 }}
                    label={label}
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <Button onPress={() => onChange(mapStringValue(unit, value, (v) => v - 1))}>
                    <MinusIcon color={theme.colors.onSurface} />
                  </Button>
                  <Button onPress={() => onChange(mapStringValue(unit, value, (v) => v + 1))}>
                    <PlusIcon color={theme.colors.onSurface} />
                  </Button>
                </>
              );
            case "climbing_grade":
              switch (unit.grade) {
                case "uiaa":
                  return gradePicker(uiaaGrades);
                case "yds":
                  return gradePicker(ydsGrades);
                case "french":
                  return gradePicker(frenchGrades);
                case "font":
                  return gradePicker(fontGrades);
                case "v-scale":
                  return gradePicker(vScaleGrades);
              }
            default:
              return (
                <TextInput
                  style={{ flex: 1 }}
                  label={label}
                  value={value}
                  onChangeText={(text) => onChange(text)}
                  keyboardType="numeric"
                  mode="outlined"
                />
              );
          }
        })()}
      </View>
    </InputWrapper>
  );
};
