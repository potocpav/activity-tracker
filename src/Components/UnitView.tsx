import { Text, View, ScrollView, Pressable, Modal, FlatList, useWindowDimensions } from "react-native";
import { TextInput, Button, RadioButton, Dialog, Portal, List, SegmentedButtons } from "react-native-paper";
import { ClimbingGrade, DistanceUnit, SubUnit, SubUnitType, TimeUnit, WeightUnit } from "../Model/StoreTypes";
import { useState } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getTheme, useWideDisplay } from "../Model/Theme";
import { renderUnit, mapStringValue, uiaaGrades, vScaleGrades, numberToString, stringToNumber, ydsGrades, frenchGrades, fontGrades } from "../Model/Unit";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";


const subUnitProps = (subUnitType: SubUnitType, allUnits: SubUnit[], setAllUnits: (units: SubUnit[]) => void): { title: string, icon: string, description: string | null, children: React.ReactNode | null } => {

  switch (subUnitType) {
    case "count":
      return {
        title: "Count",
        icon: "numeric-3-circle-outline",
        description: "reps, sets, etc.",
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
              value={allUnits.find(unit => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, unit: value as DistanceUnit } : unit))}}
              buttons={[
                { value: "mm", label: "mm" },
                { value: "cm", label: "cm" },
                { value: "m", label: "m" },
                { value: "km", label: "km" },
              ]} />
            <SegmentedButtons
              value={allUnits.find(unit => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, unit: value as DistanceUnit } : unit))}}
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
              value={allUnits.find(unit => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, unit: value as WeightUnit } : unit))}}
              buttons={[
                { value: "g", label: "g" },
                { value: "kg", label: "kg" },
              ]} />
            <SegmentedButtons
              value={allUnits.find(unit => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, unit: value as WeightUnit } : unit))}}
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
              value={allUnits.find(unit => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, unit: value as TimeUnit } : unit))}}
              buttons={[
                { value: "seconds", label: "seconds" },
                { value: "hours", label: "hours" },
              ]} />
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
              value={allUnits.find(unit => unit.type === subUnitType)?.grade ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, grade: value as ClimbingGrade } : unit))}}
              buttons={[
                { value: "uiaa", label: "UIAA" },
                { value: "french", label: "French" },
                { value: "yds", label: "YDS" },
              ]} />
            <SegmentedButtons
              value={allUnits.find(unit => unit.type === subUnitType)?.grade ?? ""}
              onValueChange={value => {setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, grade: value as ClimbingGrade } : unit))}}
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
                value={allUnits.find(unit => unit.type === subUnitType)?.symbol ?? ""}
                onChangeText={text => setAllUnits(allUnits.map(unit => unit.type === subUnitType ? { ...unit, symbol: text } : unit))}
                mode="outlined"
              />
            </InputWrapper>
          ),
        };
  }
}

export const UnitEditor = ({ unit, onChange }: { unit: SubUnit | null, onChange: (unit: SubUnit | null) => void }) => {
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const theme = getTheme();
  
  const [unitInput, setUnitInput] = useState<SubUnit | null>(unit ?? null);
  const [chosenUnitType, setChosenUnitType] = useState<SubUnitType | null>(unit?.type ?? null);
  const [allUnits, setAllUnits] = useState<SubUnit[]>((() => {
    let defaultUnits : SubUnit[] = [
      { type: "count" },
      { type: "distance", unit: "km" },
      { type: "weight", unit: "kg" },
      { type: "time", unit: "seconds" },
      { type: "climbing_grade", grade: "french" },
      { type: "number", symbol: "" },
      ];
    return defaultUnits.map(defaultUnit => unit?.type === defaultUnit.type ? unit : defaultUnit);
  })());

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
          value={unitInput === null ? "" : renderUnit(unitInput)}
          editable={false}
          mode="outlined"
        />
      </Pressable>
      {/* <Portal> */}
      <Modal
        transparent={false}
        backdropColor={theme.colors.surface}
        onRequestClose={() => setUnitDialogVisible(false)}
        animationType="fade"
        visible={unitDialogVisible}
        onDismiss={() => setUnitDialogVisible(false)}
      >
        <View style={{ flex: 1 }}>
          <View style={{ backgroundColor: theme.colors.elevation.level1, elevation: 2, flexDirection: 'row', paddingVertical: 10, alignItems: 'center' }}>
            <Button onPress={() => setUnitDialogVisible(false)}>
              <AntDesign name="arrowleft" size={24} color={theme.colors.onSurface} />
            </Button>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 20, color: theme.colors.onSurface }}>Select Unit</Text>
            </View>
            <Button onPress={() => {
              setUnitDialogVisible(false);
              const newUnitInput = allUnits.find(unit => unit.type === chosenUnitType) ?? null;
              setUnitInput(newUnitInput);
              onChange(newUnitInput);
            }}>
              <AntDesign name="check" size={24} color={theme.colors.onSurface} />
            </Button>
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
                    titleStyle={{ color: chosenUnitType === subUnit.type ? theme.colors.primary : theme.colors.onSurface }}
                    onPress={() => setChosenUnitType(subUnit.type)}
                    left={() => <List.Icon icon={icon} />}
                    description={description}
                  />
                );
              }
            })}
            </View>
          </ScrollView>
        </View>
      </Modal>
      {/* </Portal> */}
    </View>
  );
}

export const ValueEditor = ({
  unit,
  label,
  value,
  error,
  inputWrapperRef,
  onChange,
  setSubmitDisabled, // whether to disable submitting the value
}: {
  unit: SubUnit,
  label: string,
  value: string,
  error: string | null,
  inputWrapperRef: React.RefObject<InputWrapperRef>,
  onChange: (value: string) => void,
  setSubmitDisabled: (disabled: string | null) => void,
}) => {
  const theme = getTheme();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const itemHeight = 50 * dimensions.fontScale;
  const numColumns = wideDisplay ? 4 : 2;

  const [climbingGradeDialogVisible, setClimbingGradeDialogVisible] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const resetTimer = () => {
    setTimerActive(false);
    setTimerStartTime(null);
    setNow(null);
    setSubmitDisabled(null);
    onChange(numberToString(0, unit));
  }

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

      setTimerInterval(setInterval(() => {
        setNow(Date.now() / timeFactor);
      }, 200));
    }
  };

  const addTimerToValue = (val: string) => {
    return numberToString((stringToNumber(val, unit) ?? 0) + ((now ?? 0) - (timerStartTime ?? 0)), unit)
  };

  const pickerDialog = (options: { s: string, n: number }[]) => {
    return (
      <>
        <Pressable onPress={() => setClimbingGradeDialogVisible(true)} style={({ pressed }) => [
          {
            flex: 1,
            opacity: pressed ? 0.7 : 1,
          },
        ]}>
          <TextInput
            label={label}
            value={value}
            onChangeText={text => onChange(text)}
            keyboardType="numeric"
            editable={false}
            mode="outlined"
          />
        </Pressable>
        <Portal>
          <Dialog visible={climbingGradeDialogVisible} onDismiss={() => setClimbingGradeDialogVisible(false)}>
            <Dialog.Title>
              <View style={{ flex: 1, alignItems: 'flex-end', width: '100%' }}>
                <Button onPress={() => {
                  setClimbingGradeDialogVisible(false);
                  onChange("");
                }} compact={true}>
                  <AntDesign name="close" size={24} color={theme.colors.onSurface} />
                </Button>
              </View>
            </Dialog.Title>
            <Dialog.ScrollArea>
              <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <Button onPress={() => { setClimbingGradeDialogVisible(false) }}>
                  <AntDesign name="close" size={24} color={theme.colors.onSurface} />
                </Button>
              </View>
              <FlatList
                key={`uiaa-grade-list-${numColumns}`}
                getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
                initialScrollIndex={
                  Math.max(0, Math.floor(value === "" ?
                    options.length / numColumns / 2 :
                    options.findIndex(o => o.s === value) / numColumns) - 3)}
                numColumns={numColumns}
                indicatorStyle="black"
                data={options}
                renderItem={({ item }) => (
                  <List.Item right={value === item.s ? (props) => <List.Icon {...props} icon="check" /> : undefined} style={{ flex: 1, height: itemHeight }} key={item.s} onPress={() => { onChange(item.s); setClimbingGradeDialogVisible(false); }} title={item.s} />
                )}
              />
            </Dialog.ScrollArea>
          </Dialog>
        </Portal>
      </>
    );
  }

  return (
    <InputWrapper error={error} ref={inputWrapperRef}>
      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 }}>
        {(() => {
          switch (unit.type) {
            case "time":
              return (
                <>
                  <TextInput
                    style={{ flex: 1 }}
                    label={label}
                    value={timerActive ? addTimerToValue(value) : value}
                    editable={!timerActive}
                    onChangeText={text => onChange(text)}
                    mode="outlined"
                  />
                  <Button onPress={() => resetTimer()} compact={true} style={{ marginTop: 4 }} mode="outlined">
                    <View>
                      <AntDesign name={"reload1"} size={22} color={theme.colors.onSurface} />
                    </View>
                  </Button>
                  <Button onPress={() => toggleTimer(unit.unit)} compact={true} style={{ marginTop: 4 }} mode="outlined">
                    <View>
                      <AntDesign name={timerActive ? "pausecircleo" : "playcircleo"} size={22} color={theme.colors.onSurface} />
                    </View>
                  </Button>
                </>
              );
            case "count":
              return (
                <>
                  <TextInput
                    style={{ flex: 1 }}
                    label={label}
                    value={value}
                    onChangeText={text => onChange(text)}
                    keyboardType="numeric"
                    mode="outlined"
                  />
                  <Button onPress={() => onChange(mapStringValue(unit, value, v => v - 1))} compact={true} mode="outlined" style={{ marginTop: 4 }}>
                    <View>
                      <AntDesign name="minus" size={24} color={theme.colors.onSurface} />
                    </View>
                  </Button>
                  <Button onPress={() => onChange(mapStringValue(unit, value, v => v + 1))} compact={true} mode="outlined" style={{ marginTop: 4 }}>
                    <View>
                      <AntDesign name="plus" size={22} color={theme.colors.onSurface} />
                    </View>
                  </Button>
                </>
              )
            case "climbing_grade":
              switch (unit.grade) {
                case "uiaa":
                  return pickerDialog(uiaaGrades);
                case "yds":
                  return pickerDialog(ydsGrades);
                case "french":
                  return pickerDialog(frenchGrades);
                case "font":
                  return pickerDialog(fontGrades);
                case "v-scale":
                  return pickerDialog(vScaleGrades);
                default:
                  return <TextInput
                    style={{ flex: 1 }}
                    label={label}
                    value={value}
                    onChangeText={text => onChange(text)}
                    mode="outlined"
                  />
              }
            default:
              return <TextInput
                style={{ flex: 1 }}
                label={label}
                value={value}
                onChangeText={text => onChange(text)}
                keyboardType="numeric"
                mode="outlined"
              />
          }
        })()}
      </View>
    </InputWrapper>
  );
}