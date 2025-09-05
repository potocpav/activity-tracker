import { Text, View, ScrollView, Pressable, Modal, FlatList, useWindowDimensions } from "react-native";
import { TextInput, Button, RadioButton, Dialog, Portal, List } from "react-native-paper";
import { SubUnit, TimeUnit } from "./StoreTypes";
import { useState } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getTheme, useWideDisplay } from "./Theme";
import { renderUnit, mapStringValue, uiaaGrades, vScaleGrades, numberToString, renderShortFormValue, stringToNumber } from "./Unit";
import Animated, { LinearTransition, FadeInUp, FadeOutUp } from "react-native-reanimated";

type ChosenUnit = "number" | "count" | "weight_kg" | "weight_lb" | "time_seconds" | "time_hours" | "climbing_grade_uiaa" | "climbing_grade_french" | "climbing_grade_font" | "climbing_grade_v_scale";

const subUnitToChosenUnit = (subUnit: SubUnit): ChosenUnit | null => {
  switch (subUnit.type) {
    case "number":
      return "number";
    case "count":
      return "count";
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


export const UnitEditor = ({ unit, onChange }: { unit: SubUnit, onChange: (unit: SubUnit) => void }) => {
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const [unitInput, setUnitInput] = useState(unit);
  const [chosenUnit, setChosenUnit] = useState<ChosenUnit | null>(subUnitToChosenUnit(unit));
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
          value={renderUnit(unitInput)}
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
              if (chosenUnit) {
                onChange(unitInput);
              }
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
              {unitInput.type === "number" &&
                <Animated.View key="number-symbol" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                  <TextInput
                    label="Symbol"
                    value={unitInput.symbol}
                    onChangeText={text => setUnitInput({ ...unitInput, symbol: text })}
                    mode="outlined"
                    style={{ marginHorizontal: 16 }}
                  />
                </Animated.View>
              }
              <Animated.View key="count" layout={LinearTransition} entering={FadeInUp} exiting={FadeOutUp}>
                <RadioButton.Item key="count" label="Count" value="count" />
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
  onChange,
  setSubmitDisabled, // whether to disable submitting the value
}: {
  unit: SubUnit,
  label: string,
  value: string,
  onChange: (value: string) => void,
  setSubmitDisabled: (disabled: boolean) => void,
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

  const toggleTimer = (timeUnit: TimeUnit) => {
    const timeFactor = timeUnit === "hours" ? 3600e3 : 1e3;
    if (timerActive) {
      // stop timer
      onChange(addTimerToValue(value));
      setTimerActive(false);
      setTimerStartTime(null);
      setSubmitDisabled(false);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    } else {
      // start timer
      setTimerActive(true);
      setTimerStartTime(Date.now() / timeFactor);
      setNow(Date.now() / timeFactor);
      setSubmitDisabled(true);

      setTimerInterval(setInterval(() => {
        setNow(Date.now() / timeFactor);
      }, 200));
    }
    // return interval;
  };
  console.log('tick', now);

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
            <Dialog.ScrollArea>
              <FlatList
                getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * Math.floor(index / numColumns), index })}
                key={`uiaa-grade-list-${numColumns}`}
                numColumns={numColumns}
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
                <Button onPress={() => toggleTimer(unit.unit)} compact={false} style={{ marginTop: 4 }} mode="outlined">
                  <AntDesign name={timerActive ? "pausecircleo" : "playcircleo"} size={20} color={theme.colors.onSurface} />
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
                  <AntDesign name="minus" size={24} color={theme.colors.onSurface} />
                </Button>
                <Button onPress={() => onChange(mapStringValue(unit, value, v => v + 1))} compact={true} mode="outlined" style={{ marginTop: 4 }}>
                  <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
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
  );
}