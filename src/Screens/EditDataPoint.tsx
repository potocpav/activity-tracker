import React, { useState, FC, useRef, Fragment } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Pressable,
  KeyboardAvoidingView,
  TextInput,
} from "react-native";
import TextField from "../Components/TextField";
import {
  ActivityType,
  ActivityPath,
  dateToDateList,
  DataPoint,
  dateListToDate,
  SubUnit,
  DateList,
  State,
} from "../Model/StoreTypes";
import useStore from "../Model/Store";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { CheckButton, CheckPlusButton, DeleteButton, ButtonRow, Button } from "../Components/Element";
import { cmpDateList, formatDate } from "../Model/Activity";
import { useAppTheme, useThemePalette, Theme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { numberToString, stringToNumber, renderUnit } from "../Model/Unit";
import { ValueEditor } from "../Components/UnitView";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import Hint from "../Components/Hint";
import TagSelector from "../Components/TagSelector";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as Crypto from "expo-crypto";
import { useToday } from "../Model/useToday";

type EditDataPointProps = {
  navigation: any;
  route: any;
};

type InputData =
  | {
      type: "new";
      dataPoint: DataPoint;
    }
  | {
      type: "edit";
      dataPoints: DataPoint[];
    };

// Return the single value if all values are the same (using JSON.stringify to compare), otherwise null
const singleValueOrNull = (values: any[]): any | null => {
  const set = new Set(values.map((v) => JSON.stringify(v)));
  return (set.size === 1 ? values[0] : null) ?? null;
};

const EditDataPoint: FC<EditDataPointProps> = ({ navigation, route }) => {
  const { activityPath, inputData }: { activityPath: ActivityPath; inputData: InputData } = route.params;
  const activity: ActivityType = useStore(
    (state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId],
  );
  const theme = useAppTheme(activity.color);
  const styles = getStyles(theme);
  const palette = useThemePalette();
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const today = useToday();
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPointsByUuid = useStore((state: any) => state.deleteActivityDataPointsByUuid);

  const editingMultiple = inputData.type === "edit" && inputData.dataPoints.length > 1;
  const dataPoints: DataPoint[] = inputData.type === "new" ? [inputData.dataPoint] : inputData.dataPoints;

  const date = singleValueOrNull(dataPoints.map((dp) => dateListToDate(dp.date)));
  const note = singleValueOrNull(dataPoints.map((dp) => dp.note));
  const tags = singleValueOrNull(dataPoints.map((dp) => dp.tags));
  const [showErrors, setShowErrors] = useState(false);

  const [inputDate, setInputDate] = useState<Date | null>(date);
  const [inputNote, setInputNote] = useState<string>(note ?? "");
  const [inputTags, setInputTags] = useState<string[]>(tags ?? []);

  const dateInputRef = useRef<InputWrapperRef>(undefined);
  let dateError: string | null = null;
  let inputDateList: DateList | null = inputDate ? dateToDateList(inputDate) : null;
  if (inputDateList !== null && cmpDateList(inputDateList, dateToDateList(today)) > 0) {
    dateError = "Date cannot be in the future";
  } else if (inputDateList !== null && cmpDateList(inputDateList, [2000, 1, 1]) < 0) {
    dateError = "Date must be from this millenium";
  }

  let inputValues: {
    subUnit: { name: string | null; unit: SubUnit };
    value: [string, (text: string) => void];
  }[];

  switch (activity.unit.type) {
    case "none":
      inputValues = [];
      break;
    case "single":
      const value: number | null = singleValueOrNull(dataPoints.map((dp) => dp.value as number | undefined));
      inputValues = [
        {
          subUnit: { name: null, unit: activity.unit.unit },
          value: useState<string>(numberToString(value, activity.unit.unit)),
        },
      ];
      break;
    case "multiple":
      inputValues = activity.unit.values.map((u) => {
        const value: number | null = singleValueOrNull(
          dataPoints.map((dp) => {
            const value = dp.value as Record<string, number> | undefined;
            return value?.[u.name] ?? null;
          }),
        );
        return {
          subUnit: u,
          value: useState<string>(numberToString(value, u.unit)),
        };
      });
      break;
  }

  let inputValueDisabled: [string | null, (disabled: string | null) => void][] = inputValues.map((v) =>
    useState<string | null>(null),
  );
  let inputValueRefs: React.RefObject<InputWrapperRef>[] = inputValues.map((v) => useRef<InputWrapperRef>(undefined));
  let inputValueErrors: (string | null)[] = inputValues.map((v, idx) => {
    let error: string | null = null;
    let numValue = stringToNumber(v.value[0], v.subUnit.unit);
    if (inputValueDisabled[idx][0] !== null) {
      error = inputValueDisabled[idx][0];
    } else if (v.value[0] !== "" && (numValue === null || isNaN(numValue))) {
      error = "Enter a valid value";
    }
    return error;
  });

  let valueRef = useRef<InputWrapperRef>(undefined);
  let emptyValueError = null;
  if (activity.unit.type !== "none" && !inputValues.find((v) => v.value[0] !== "")) {
    if (activity.unit.type === "single") {
      emptyValueError = "Enter a value";
    } else {
      emptyValueError = "Enter at least one value";
    }
  }

  const toggleInputTag = (tag: string) => {
    setInputTags(inputTags.includes(tag) ? inputTags.filter((t: string) => t !== tag) : [...inputTags, tag]);
  };

  const deleteDataPointWrapper = () => {
    deleteActivityDataPointsByUuid(
      activityPath,
      dataPoints.map((dp) => dp.uuid),
    );
    navigation.goBack();
  };

  const saveDataPointWrapper = () => {
    dismissHint("save_data_point");
    // check for errors
    let hasError = false;

    if (dateError !== null) {
      dateInputRef?.current?.highlightError();
      hasError = true;
    }
    if (emptyValueError !== null) {
      valueRef?.current?.highlightError();
      hasError = true;
    }
    if (inputValueErrors.find((e) => e !== null) !== undefined) {
      inputValueRefs.forEach((ref, idx) => {
        if (inputValueErrors[idx] !== null) {
          ref.current?.highlightError();
        }
      });
      hasError = true;
    }

    if (hasError) {
      setShowErrors(true);
      return;
    }

    // all is OK, save the data point
    let newValue: any;
    switch (activity.unit.type) {
      case "none":
        newValue = undefined;
        break;
      case "single":
        if (inputValues[0].value[0] === "") {
          // empty value, do not set the sub-value to anything
        } else {
          newValue = stringToNumber(inputValues[0].value[0], activity.unit.unit);
        }
        break;
      case "multiple":
        newValue = {};
        for (const inputValue of inputValues) {
          if (inputValue.value[0] === "") {
            // empty value, do not set the sub-value to anything
          } else {
            const value = stringToNumber(inputValue.value[0], inputValue.subUnit.unit);
            if (inputValue.subUnit.name !== null) {
              newValue[inputValue.subUnit.name] = value;
            } else {
              console.error("Sub-unit name is null");
            }
          }
        }
        break;
    }

    const note = inputNote === "" ? {} : { note: inputNote };
    const newPoint: DataPoint = {
      uuid: Crypto.randomUUID(),
      date: inputDateList as DateList, // TODO: handle null case
      ...(newValue === undefined ? {} : { value: newValue }),
      ...(inputTags.length > 0 ? { tags: inputTags } : {}),
      ...note,
    };
    const newIndex = updateActivityDataPoint(
      activityPath,
      inputData.type === "new" ? undefined : dataPoints[0].uuid,
      newPoint,
    );
    return { index: newIndex, dataPoint: newPoint };
  };

  const duplicateDataPointWrapper = () => {
    const res = saveDataPointWrapper();
    if (res !== undefined) {
      ToastAndroid.show("Data point saved", ToastAndroid.SHORT);
      navigation.replace("EditDataPoint", {
        activityPath,
        inputData: { type: "new", dataPoint: res.dataPoint },
      });
    }
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: inputDate ?? today,
      maximumDate: today,
      minimumDate: new Date(2000, 0, 1),
      firstDayOfWeek: weekStart === "monday" ? 1 : 0,
      onValueChange: (event, selectedDate) => {
        if (selectedDate !== undefined) {
          setInputDate(selectedDate);
        }
      },
    });
  };

  React.useEffect(() => {
    navigation.setOptions({
      title:
        inputData.type === "new"
          ? "New data point"
          : editingMultiple
            ? `Editing ${dataPoints.length} data points`
            : `Editing data point`,
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.onHeader,
      headerRight: () => (
        <ButtonRow>
          {inputData.type === "edit" && <DeleteButton onPress={deleteDataPointWrapper} color={theme.onHeader} />}
          <CheckPlusButton onPress={duplicateDataPointWrapper} color={theme.onHeader} />
          <CheckButton
            onPress={() => {
              saveDataPointWrapper() && navigation.goBack();
            }}
            color={theme.onHeader}
          />
        </ButtonRow>
      ),
    });
  }, [
    navigation,
    theme,
    activity,
    inputDate,
    ...inputValues.map((inputValue: any) => inputValue.value[0]),
    inputTags,
    inputNote,
    dateError,
    emptyValueError,
    inputValueErrors,
  ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={100}>
      <Hint hint="save_data_point" />
      <SystemBars style={{ statusBar: "light", navigationBar: theme.variant == "light" ? "dark" : "light" }} />
      <ScrollView>
        <SafeAreaView style={{ gap: 10, padding: 10 }} edges={["left", "right", "bottom"]}>
          <InputWrapper error={showErrors ? dateError : null} ref={dateInputRef}>
            <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
              <Pressable
                onPress={showDatePicker}
                android_ripple={{ foreground: true, color: theme.elevation3 }}
                style={{ flex: 1 }}
              >
                <TextField
                  label="Date"
                  editable={false}
                  activityColor={activity.color}
                  value={inputDate ? inputDate.toLocaleDateString(locale) : "Select date"}
                />
              </Pressable>
              <Button onPress={showDatePicker} style={{ marginTop: 15 }}>
                <MaterialCommunityIcons name="calendar" size={24} color={theme.onSurface} />
              </Button>
            </View>
          </InputWrapper>

          <InputWrapper>
            <TextInput
              placeholder="Note (optional)"
              value={inputNote}
              onChangeText={setInputNote}
              multiline
              numberOfLines={Infinity}
              style={styles.noteInput}
            />
          </InputWrapper>

          {activity.tags.length > 0 && (
            <View style={{ gap: 5 }}>
              <Text style={{ color: theme.onSurfaceVariant, fontSize: 16 }}>Tags:</Text>
              <TagSelector
                activity={activity}
                inputTags={inputTags}
                toggleInputTag={toggleInputTag}
                palette={palette}
                theme={theme}
                justifyContent="flex-start"
              />
            </View>
          )}

          {activity.unit.type !== "none" && (
            <InputWrapper error={showErrors ? emptyValueError : null} ref={valueRef}>
              <Text style={styles.header}>{activity.unit.type === "single" ? "Value:" : "Values:"}</Text>

              <View>
                {inputValues.map(
                  (
                    inputValue: {
                      subUnit: { name: string | null; unit: SubUnit };
                      value: [string, (text: string) => void];
                    },
                    index: number,
                  ) => (
                    <ValueEditor
                      activityColor={activity.color}
                      key={inputValue.subUnit.name ?? "value"}
                      unit={inputValue.subUnit.unit}
                      error={showErrors ? inputValueErrors[index] : null}
                      inputWrapperRef={inputValueRefs[index]}
                      label={
                        inputValue.subUnit.name === null
                          ? renderUnit(inputValue.subUnit.unit)
                          : `${inputValue.subUnit.name} - ${renderUnit(inputValue.subUnit.unit)}`
                      } // TODO: better label
                      value={inputValue.value[0]}
                      onChange={inputValue.value[1]}
                      setSubmitDisabled={inputValueDisabled[index][1]}
                    />
                  ),
                )}
              </View>
            </InputWrapper>
          )}
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    content: {
      marginTop: 10,
      flex: 1,
      padding: 10,
    },
    tagsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    header: {
      color: theme.onSurfaceVariant,
      fontSize: 16,
    },
    noteInput: {
      color: theme.onSurface,
      borderColor: theme.outline,
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
    },
  });

export default EditDataPoint;
