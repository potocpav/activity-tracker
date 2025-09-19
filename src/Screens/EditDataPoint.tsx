import React, { useState, FC, useRef, Fragment } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
  Pressable,
} from "react-native";
import { Chip, TextInput, Button, MD3Theme } from 'react-native-paper';
import { ActivityType, dateToDateList, DataPoint, dateListToDate, SubUnit, DateList } from "../Model/StoreTypes";
import useStore from "../Model/Store";
import { DatePickerModal } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";
import AntDesign from '@expo/vector-icons/AntDesign';
import { cmpDateList, formatDate } from "../Model/Activity";
import { getTheme, getThemePalette, getThemeVariant } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { numberToString, stringToNumber, renderUnit } from "../Model/Unit";
import { ValueEditor } from "../Components/UnitView";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import Hint from "../Components/Hint";

type EditDataPointProps = {
  navigation: any;
  route: any;
};

const EditDataPoint: FC<EditDataPointProps> = ({ navigation, route }) => {
  const { activityName, dataPointIndex, newDataPoint, newDataPointDate, tags } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity: ActivityType = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity.color);
  const styles = getStyles(theme);
  const themeVariant = getThemeVariant();
  const palette = getThemePalette();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);

  const dataPoint : DataPoint = 
    dataPointIndex !== undefined ? 
      activity?.dataPoints[dataPointIndex] : 
      {
        date: dateToDateList(newDataPointDate ? dateListToDate(newDataPointDate) : new Date()),
      };
  
  if (!dataPoint) {
    console.error("Data point not found", dataPointIndex, dataPoint);
    return <Text style={{ color: theme.colors.error }}>Data point not found</Text>;
  }
  
  const dateTime = dateListToDate(dataPoint.date);
  const today = dateToDateList(new Date());
  const [showErrors, setShowErrors] = useState(false);

  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const [inputDate, setInputDate] = useState<CalendarDate>(dateTime);
  const [noteInput, setNoteInput] = useState<string>(dataPoint.note ?? "");

  const dateInputRef = useRef<InputWrapperRef>(undefined);
  let dateError: string | null = null;
  let inputDateList: DateList | undefined = inputDate ? dateToDateList(inputDate) : undefined;
  if (inputDateList === undefined) {
    dateError = "Date is required";
  } else if (cmpDateList(inputDateList, today) > 0) {
    dateError = "Date cannot be in the future";
  } else if (cmpDateList(inputDateList, [2000, 1, 1]) < 0) {
    dateError = "Date must be from this millenium";
  }

  let inputValues: { subUnit: 
    {name: string | null, unit: SubUnit}, 
    value: [string, (text: string) => void]
  }[];
    
  switch (activity.unit.type) {
    case 'none':
      inputValues = [];
      break;
    case 'single':
      inputValues = [{ 
        subUnit: {name: null, unit: activity.unit.unit}, 
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

  const [inputTags, setInputTags] = useState<string[]>(dataPoint.tags ?? tags ?? []);

  const toggleInputTag = (tag: string) => {
    setInputTags(inputTags.includes(tag) ? inputTags.filter((t: string) => t !== tag) : [...inputTags, tag]);
  }

  const deleteDataPointWrapper = () => {
    deleteActivityDataPoint(activityName, dataPointIndex);
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

    const note = noteInput === "" ? {} : { "note": noteInput };
    const newIndex = updateActivityDataPoint(activityName, newDataPoint ? undefined : dataPointIndex, {
      date: inputDateList,
      ...(newValue === undefined ? {} : {value: newValue}),
      ...(inputTags.length > 0 ? { tags: inputTags } : {}),
      ...note,
    });
    navigation.goBack();
    return newIndex;
  };

  const duplicateDataPointWrapper = () => {
    const newIndex = saveDataPointWrapper();
    ToastAndroid.show('Data point saved', ToastAndroid.SHORT);
    navigation.navigate("EditDataPoint", { activityName, dataPointIndex: newIndex, newDataPoint: true });
  };

  React.useEffect(() => {
    navigation.setOptions({
      title: newDataPoint ? 'New data point' : `${formatDate(dateListToDate(dataPoint.date))} #${dataPointIndex + 1}`,
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => (
        <>
          <Button compact={true} onPress={saveDataPointWrapper}>
            <AntDesign name="check" size={24} color={"#ffffff"} />
          </Button>
          <Button compact={true} onPress={duplicateDataPointWrapper}>
            <View style={{ position: 'relative' }}>
            <AntDesign name="check" size={24} color={"#ffffff"} />
            <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
            <AntDesign name="pluscircleo" size={12} color={"#ffffff"} />
            </View>
            </View>
          </Button>
          {dataPointIndex !== undefined && (
            <Button compact={true} onPress={deleteDataPointWrapper}>
              <AntDesign name="delete" size={24} color={"#ffffff"} />
            </Button>
          )}
        </>
      ),
    });
  }, [navigation, theme, activity, inputDate, ...inputValues.map((inputValue: any) => inputValue.value[0]), inputTags, noteInput]);

  return (
    <Fragment>
      <Hint hint="save_data_point" />
      <SystemBars style={"light"} />
      <ScrollView>
        <SafeAreaView style={{ gap: 10, padding: 10 }} edges={["left", "right", "bottom"]}>
          <InputWrapper error={showErrors ? dateError : null} ref={dateInputRef}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Pressable onPress={() => { setDatePickerVisible(true); }}
          style={({pressed}) => [
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
          <Button compact={true} onPress={() => { setDatePickerVisible(true); }}>
            <View>
              <AntDesign name="calendar" size={24} color={theme.colors.onSurface} />
            </View>
          </Button>
          </View>
          </InputWrapper>

        <InputWrapper>
          <TextInput
            label="Note (optional)"
            value={noteInput}
            onChangeText={setNoteInput}
            mode="outlined"
          />
        </InputWrapper>


        {activity.tags.length > 0 && (<View style={{ gap: 10 }}>
          <Text style={styles.header}>Tags:</Text>
          <View style={styles.tagsContainer}>
            {activity.tags.map((tag: any, index: number) => (
              <Chip
                key={tag.name}
                onPress={() => { toggleInputTag(tag.name); }}
                mode={inputTags.includes(tag.name) ? "flat" : "outlined"}
                style={{
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: inputTags.includes(tag.name) ? palette[tag.color] : theme.colors.surface,
                }}
                textStyle={{
                  color: inputTags.includes(tag.name) ? theme.colors.surface : palette[tag.color],
                }}
              >
                {tag.name}
              </Chip>
            ))}
          </View>
        </View>)}

        {activity.unit.type !== "none" && (
          <InputWrapper error={showErrors ? emptyValueError : null} ref={valueRef}>
          <Text style={styles.header}>{activity.unit.type === "single" ? "Value:" : "Values:"}</Text>

        <View>
          {inputValues.map((inputValue: { 
            subUnit: {name: string | null, unit: SubUnit}, 
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

      <DatePickerModal
          mode="single"
          endYear={new Date().getFullYear()}
          label={"Select date"}
          locale={"en-GB"}
          visible={datePickerVisible}
          onDismiss={() => { setDatePickerVisible(false); }}
          startYear={2000}
          validRange={{
            startDate: new Date(2000, 0, 1),
            endDate: new Date(),
          }}
          date={inputDate}
          startWeekOnMonday={weekStart === "monday"}
          onConfirm={(d) => { setInputDate(d.date); setDatePickerVisible(false); }}
        />
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