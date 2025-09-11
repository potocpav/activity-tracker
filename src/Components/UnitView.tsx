import { Text, View, ScrollView, Pressable, Modal, FlatList, useWindowDimensions } from "react-native";
import { TextInput, Button, RadioButton, Dialog, Portal, List } from "react-native-paper";
import { SubUnit, TimeUnit } from "../Model/StoreTypes";
import { useState } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getTheme, useWideDisplay } from "../Model/Theme";
import { renderUnit, mapStringValue, uiaaGrades, vScaleGrades, numberToString, renderShortFormValue, stringToNumber } from "../Model/Unit";
import Animated, { LinearTransition, FadeInUp, FadeOutUp } from "react-native-reanimated";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";

type ChosenUnit = "number" | "count" | "distance_km" | "distance_mi" | "weight_kg" | "weight_lb" | "time_seconds" | "time_hours" | "climbing_grade_uiaa" | "climbing_grade_french" | "climbing_grade_font" | "climbing_grade_v_scale";

const subUnitToChosenUnit = (subUnit: SubUnit | null): ChosenUnit | null => {
  if (subUnit === null) {
    return null;
  }
  switch (subUnit.type) {
    case "number":
      return "number";
    case "count":
      return "count";
    case "distance":
      switch (subUnit.unit) {
        case "km":
          return "distance_km";
        case "mi":
          return "distance_mi";
      }
    case "weight":
      switch (subUnit.unit) {
        case "kg":
          return "weight_kg";
        case "lb":
          return "weight_lb";
      }
    case "time":
      switch (subUnit.unit) {
        case "seconds":
          return "time_seconds";
        case "hours":
          return "time_hours";
      }
    case "climbing_grade":
      return subUnit.grade === "uiaa" ? "climbing_grade_uiaa" : subUnit.grade === "french" ? "climbing_grade_french" : subUnit.grade === "font" ? "climbing_grade_font" : "climbing_grade_v_scale";
    default:
      return null;
  }
}

const toUnit = (chosenUnit: ChosenUnit): SubUnit => {
  switch (chosenUnit) {
    case "number":
      return { type: "number", symbol: "" };
    case "count":
      return { type: "count" };
    case "distance_km":
      return { type: "distance", unit: "km" };
    case "distance_mi":
      return { type: "distance", unit: "mi" };
    case "weight_kg":
      return { type: "weight", unit: "kg" };
    case "weight_lb":
      return { type: "weight", unit: "lb" };
    case "time_seconds":
      return { type: "time", unit: "seconds" };
    case "time_hours":
      return { type: "time", unit: "hours" };
    case "climbing_grade_uiaa":
      return { type: "climbing_grade", grade: "uiaa" };
    case "climbing_grade_french":
      return { type: "climbing_grade", grade: "french" };
    case "climbing_grade_font":
      return { type: "climbing_grade", grade: "font" };
    case "climbing_grade_v_scale":
      return { type: "climbing_grade", grade: "v-scale" };
  }
}


export const UnitEditor = ({ unit, onChange }: { unit: SubUnit | null, onChange: (unit: SubUnit | null) => void }) => {
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const [unitInput, setUnitInput] = useState(unit);
  const theme = getTheme();

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
              onChange(unitInput);
            }}>
              <AntDesign name="check" size={24} color={theme.colors.onSurface} />
            </Button>
          </View>
          <ScrollView>
            <RadioButton.Group
              onValueChange={value => setUnitInput(toUnit(value as ChosenUnit))}
              value={subUnitToChosenUnit(unitInput) ?? ""}>
              <Animated.View key="number" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item label="Number" value="number" />
              </Animated.View>
              {unitInput?.type === "number" &&
                <Animated.View key="number-symbol" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                  <View style={{ marginHorizontal: 16 }}>
                    <TextInput
                      label="Symbol (optional)"
                      value={unitInput.symbol}
                      onChangeText={text => setUnitInput({ ...unitInput, symbol: text })}
                      mode="outlined"
                    />
                    <Text style={{ fontSize: 12, opacity: 0.6 }}>
                      Will be shown besides the value. E.g., "km" for kilometers.
                    </Text>
                  </View>
                </Animated.View>
              }
              <Animated.View key="count" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="count" label="Count" value="count" />
              </Animated.View>
              <Animated.View key="distance_km" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="distance_km" label="Distance (km)" value="distance_km" />
              </Animated.View>
              <Animated.View key="distance_mi" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="distance_mi" label="Distance (mi)" value="distance_mi" />
              </Animated.View>
              <Animated.View key="weight_kg" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="weight_kg" label="Weight (kg)" value="weight_kg" />
              </Animated.View>
              <Animated.View key="weight_lb" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="weight_lb" label="Weight (lb)" value="weight_lb" />
              </Animated.View>
              <Animated.View key="time_seconds" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="time_seconds" label="Time (seconds)" value="time_seconds" />
              </Animated.View>
              <Animated.View key="time_hours" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="time_hours" label="Time (hours)" value="time_hours" />
              </Animated.View>
              <Animated.View key="climbing_grade_uiaa" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="climbing_grade_uiaa" label="Climbing Grade (UIAA)" value="climbing_grade_uiaa" />
              </Animated.View>
              <Animated.View key="climbing_grade_v_scale" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="climbing_grade_v_scale" label="Climbing Grade (V-Scale)" value="climbing_grade_v_scale" />
              </Animated.View>
            </RadioButton.Group>
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
                // case "font":
                //   return pickerDialog(fontGrades);
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