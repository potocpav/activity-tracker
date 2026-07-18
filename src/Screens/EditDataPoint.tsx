import React, { useState, FC, useRef, Fragment } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Pressable,
} from "react-native";
import { TextInput, MD3Theme } from 'react-native-paper';
import { ActivityType, dateToDateList, DataPoint, dateListToDate, SubUnit, DateList, State } from "../Model/StoreTypes";
import useStore from "../Model/Store";
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CheckButton, CheckPlusButton, DeleteButton, ButtonRow, Button } from "../Components/Element";
import { cmpDateList, formatDate } from "../Model/Activity";
import { useAppTheme, useThemePalette, useThemeVariant } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { numberToString, stringToNumber, renderUnit } from "../Model/Unit";
import { ValueEditor } from "../Components/UnitView";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import Hint from "../Components/Hint";
import TagSelector from "../Components/TagSelector";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Crypto from "expo-crypto";

type EditDataPointProps = {
  navigation: any;
  route: any;
};

const EditDataPoint: FC<EditDataPointProps> = ({ navigation, route }) => {
  const { activityPath, dataPointIndex, newDataPoint, newDataPointDate, tags, newValue, newNote } = route.params;
  const activity: ActivityType = useStore((state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]);
  const theme = useAppTheme(activity.color);
  const styles = getStyles(theme);
  const themeVariant = useThemeVariant();
  const palette = useThemePalette();
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);

  const dataPoint: DataPoint =
    dataPointIndex !== undefined ?
      activity?.dataPoints[dataPointIndex] :
      {
        ...{
          uuid: Crypto.randomUUID(),
          date: dateToDateList(newDataPointDate ? dateListToDate(newDataPointDate) : new Date()),
          tags: tags ?? [],
        },
        ...(newValue !== undefined ? { value: newValue } : {}),
        ...(newNote !== undefined ? { note: newNote } : {})
      };

  if (!dataPoint) {
    console.error("Data point not found", dataPointIndex, dataPoint);
    return <Text style={{ color: theme.colors.error }}>Data point not found</Text>;
  }

  const dateTime = dateListToDate(dataPoint.date);
  const today = new Date();
  const [showErrors, setShowErrors] = useState(false);

  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const [inputDate, setInputDate] = useState<Date>(dateTime);
  const [inputNote, setInputNote] = useState<string>(dataPoint.note ?? "");
  const [inputTags, setInputTags] = useState<string[]>(dataPoint.tags ?? tags ?? []);

  const dateInputRef = useRef<InputWrapperRef>(undefined);
  let dateError: string | null = null;
  let inputDateList: DateList = dateToDateList(inputDate);
  if (cmpDateList(inputDateList, dateToDateList(today)) > 0) {
    dateError = "Date cannot be in the future";
  } else if (cmpDateList(inputDateList, [2000, 1, 1]) < 0) {
    dateError = "Date must be from this millenium";
  }

  let inputValues: {
    subUnit:
    { name: string | null, unit: SubUnit },
    value: [string, (text: string) => void]
  }[];

  switch (activity.unit.type) {
    case 'none':
      inputValues = [];
      break;
    case 'single':
      inputValues = [{
        subUnit: { name: null, unit: activity.unit.unit },
        value: useState<string>(numberToString((dataPoint as any).value ?? null, activity.unit.unit))
      }];
      break;
    case 'multiple':
      inputValues = activity.unit.values.map((u) => ({
        subUnit: u,
        value: useState<string>(
          numberToString(((dataPoint as any).value ?? {})[u.name] ?? null, u.unit))
      }));
      break;
  }

  let inputValueDisabled:
    [string | null, (disabled: string | null) => void][] =
    inputValues.map((v) => useState<string | null>(null));
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
  }

  const deleteDataPointWrapper = () => {
    deleteActivityDataPoint(activityPath, dataPointIndex);
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
    var newValue: any;
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

    const note = inputNote === "" ? {} : { "note": inputNote };
    const newDataPoint: DataPoint = {
      uuid: Crypto.randomUUID(),
      date: inputDateList,
      ...(newValue === undefined ? {} : { value: newValue }),
      ...(inputTags.length > 0 ? { tags: inputTags } : {}),
      ...note,
    };
    const newIndex = updateActivityDataPoint(activityPath, newDataPoint ? undefined : dataPointIndex, newDataPoint);
    navigation.goBack();
    return { index: newIndex, dataPoint: newDataPoint };
  };

  const duplicateDataPointWrapper = () => {
    const res = saveDataPointWrapper();
    if (res !== undefined) {
      ToastAndroid.show('Data point saved', ToastAndroid.SHORT);
      navigation.navigate("EditDataPoint", {
        activityPath,
        newDataPoint: true,
        newDataPointDate: res.dataPoint.date,
        tags: res.dataPoint.tags,
        newValue: res.dataPoint.value,
        newNote: res.dataPoint.note,
      });
    }
  };

  const showDatePicker = () => {
    DateTimePickerAndroid.open({
      value: inputDate,
      maximumDate: today,
      minimumDate: new Date(2000, 0, 1),
      firstDayOfWeek: weekStart === "monday" ? 1 : 0,
      onChange: (event, selectedDate) => {
        if (selectedDate !== undefined) {
          setInputDate(selectedDate);
        }
      },
    });
  };

  React.useEffect(() => {
    navigation.setOptions({
      title: newDataPoint ? 'New data point' : `${formatDate(dateListToDate(dataPoint.date))} #${dataPointIndex + 1}`,
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => (
        <ButtonRow>
          {dataPointIndex !== undefined && (
            <DeleteButton onPress={deleteDataPointWrapper} color="white" />
          )}
          <CheckPlusButton onPress={duplicateDataPointWrapper} color="white" />
          <CheckButton onPress={saveDataPointWrapper} color="white" />
        </ButtonRow>
      ),
    });
  }, [navigation, theme, activity, inputDate, ...inputValues.map((inputValue: any) => inputValue.value[0]), inputTags, inputNote]);

  return (
    <Fragment>
      <Hint hint="save_data_point" />
      <SystemBars style={{ statusBar: "light", navigationBar: themeVariant == 'light' ? "dark" : "light" }} />
      <ScrollView>
        <SafeAreaView style={{ gap: 10, padding: 10 }} edges={["left", "right", "bottom"]}>
          <InputWrapper error={showErrors ? dateError : null} ref={dateInputRef}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable onPress={showDatePicker}
                style={({ pressed }) => [
                  {
                    flex: 1,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              // android_ripple={{ color: theme.colors.onSurface, foreground: false }}
              >
                <TextInput
                  mode="outlined"
                  label="Date"
                  editable={false}
                  value={inputDate ? inputDate.toLocaleDateString(locale) : "Select date"}
                />
              </Pressable>
              <Button onPress={showDatePicker}>
                <MaterialCommunityIcons name="calendar" size={24} color={theme.colors.onSurface} />
              </Button>
            </View>
          </InputWrapper>

          <InputWrapper>
            <TextInput
              label="Note (optional)"
              value={inputNote}
              onChangeText={setInputNote}
              multiline
              numberOfLines={2}
              style={{ height: 80 }}
              mode="outlined"
            />
          </InputWrapper>


          {activity.tags.length > 0 && <View style={{ gap: 5 }}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>Tags:</Text>
            <TagSelector
              activity={activity}
              inputTags={inputTags}
              toggleInputTag={toggleInputTag}
              palette={palette}
              theme={theme}
              justifyContent="flex-start"
            />
          </View>}

          {activity.unit.type !== "none" && (
            <InputWrapper error={showErrors ? emptyValueError : null} ref={valueRef}>
              <Text style={styles.header}>{activity.unit.type === "single" ? "Value:" : "Values:"}</Text>

              <View>
                {inputValues.map((inputValue: {
                  subUnit: { name: string | null, unit: SubUnit },
                  value: [string, (text: string) => void]
                }, index: number) => (
                  <ValueEditor
                    key={inputValue.subUnit.name ?? "value"}
                    unit={inputValue.subUnit.unit}
                    error={showErrors ? inputValueErrors[index] : null}
                    inputWrapperRef={inputValueRefs[index]}
                    label={inputValue.subUnit.name === null ? renderUnit(inputValue.subUnit.unit) : `${inputValue.subUnit.name} - ${renderUnit(inputValue.subUnit.unit)}`} // TODO: better label
                    value={inputValue.value[0]}
                    onChange={inputValue.value[1]}
                    setSubmitDisabled={inputValueDisabled[index][1]}
                  />
                ))}
              </View>
            </InputWrapper>
          )}
        </SafeAreaView>
      </ScrollView>
    </Fragment>
  );
};

const getStyles = (theme: MD3Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    marginTop: 10,
    flex: 1,
    padding: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  header: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
  },
});

export default EditDataPoint;