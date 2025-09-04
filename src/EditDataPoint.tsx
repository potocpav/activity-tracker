import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
  Pressable,
} from "react-native";
import { Chip, TextInput, Button } from 'react-native-paper';
import { ActivityType, dateToDateList, DataPoint, dateListToDate, SubUnit2 } from "./StoreTypes";
import useStore from "./Store";
import { DatePickerModal } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cmpDateList, formatDate } from "./ActivityUtil";
import { getTheme, getThemePalette, getThemeVariant } from "./Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";

type EditDataPointProps = {
  navigation: any;
  route: any;
};

const EditDataPoint: FC<EditDataPointProps> = ({ navigation, route }) => {
  const { activityName, dataPointIndex, newDataPoint, newDataPointDate, tags } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity: ActivityType = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);
  const themeVariant = getThemeVariant();
  const palette = getThemePalette();
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  const weekStart = useStore((state: any) => state.weekStart);

  const dataPoint : DataPoint = 
    dataPointIndex !== undefined ? 
      activity?.dataPoints[dataPointIndex] : 
      {
        date: dateToDateList(newDataPointDate ? dateListToDate(newDataPointDate) : new Date()),
      };
  
  if (!dataPoint) {
    console.log("Data point not found", dataPointIndex, dataPoint);
    return <Text style={{ color: theme.colors.error }}>Data point not found</Text>;
  }
  
  const dateTime = dateListToDate(dataPoint.date);

  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const [inputDate, setInputDate] = useState<CalendarDate | undefined>(dateTime);
  const [noteInput, setNoteInput] = useState<string>(dataPoint.note ?? "");
  let inputValues: { subUnit: {name: string, unit: SubUnit2} | null, value: [string, (text: string) => void] }[];
  switch (activity.unit.type) {
    case 'none':
      inputValues = [];
      break;
    case 'single':
      inputValues = [{ 
        subUnit: null, 
        value: useState<string>(dataPoint.value?.toString() ?? "") 
      }];
      break;
    case 'multiple':
      inputValues = activity.unit.values.map((u) => ({ 
        subUnit: u,
        value: useState<string>(
          (dataPoint.value as Record<string, number>)[u.name]?.toString() ?? "")
      }));
      break;
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
    var newValue: any;
    var hasNonEmptyValue = false;
    var hasNonNumbervalue = false;
    if (activity.unit === null) {
      newValue = undefined;
    } else if (typeof activity.unit === "string") {
      newValue = parseFloat(inputValues[0].value[0]);
      if (inputValues[0].value[0] === "") {
        // empty input is invalid, `hasNonEmptyValue` remains false
      } else if (isNaN(newValue)) {
        // non-number input is invalid, `hasNonNumbervalue` is set
        hasNonNumbervalue = true;
      } else {
        // all is OK
        hasNonEmptyValue = true;
      }
    } else {
      newValue = {};
      for (const inputValue of inputValues) {
        if (inputValue.value[0] === "") {
          // empty value, do not set the sub-value to anything
        } else {
          hasNonEmptyValue = true;
          const value = parseFloat(inputValue.value[0]);
          if (isNaN(value)) {
            hasNonNumbervalue = true;
            break;
          } else {
            newValue[inputValue.subUnit.name] = value;
          }
        }
      }
    }

    if (!inputDate) {
      Alert.alert("Date is required");
    } else if (hasNonNumbervalue) {
      Alert.alert("Value must be a number");
    } else if (activity.unit !== null && !hasNonEmptyValue) {
      Alert.alert("Value is required");
    } else {
      const newDate = dateToDateList(inputDate);
      const today = dateToDateList(new Date());
      if (cmpDateList(newDate, today) > 0) {
        Alert.alert("Date cannot be in the future");
      } else if (cmpDateList(newDate, [2000, 1, 1]) < 0) {
        Alert.alert("Date must be from this millenium");
      } else {
        const note = noteInput === "" ? {} : { "note": noteInput };
        const newIndex = updateActivityDataPoint(activityName, newDataPoint ? undefined : dataPointIndex, {
          date: newDate,
          ...(newValue === undefined ? {} : {value: newValue}),
          ...(inputTags.length > 0 ? { tags: inputTags } : {}),
          ...note,
        });
        navigation.goBack();
        return newIndex;
      }
    }
  };

  const duplicateDataPointWrapper = () => {
    const newIndex = saveDataPointWrapper();
    ToastAndroid.show('Data point saved', ToastAndroid.SHORT);
    navigation.navigate("EditDataPoint", { activityName, dataPointIndex: newIndex, newDataPoint: true });
  };

  React.useEffect(() => {
    navigation.setOptions({
      title: newDataPoint ? 'New data point' : `${formatDate(dateListToDate(dataPoint.date))} #${dataPointIndex + 1}`,
      headerStyle: {
        backgroundColor: themeVariant == 'light' ? theme.colors.primary : theme.colors.background,
      },
      headerTintColor: "#ffffff",
      headerRight: () => (
        <>
          <Button compact={true} onPress={saveDataPointWrapper}><AntDesign name="check" size={24} color={"#ffffff"} /></Button>
          <Button compact={true} onPress={duplicateDataPointWrapper}><Ionicons name="duplicate-outline" size={24} color={"#ffffff"} /></Button>
          {dataPointIndex !== undefined && (
            <Button compact={true} onPress={deleteDataPointWrapper}><AntDesign name="delete" size={24} color={"#ffffff"} /></Button>
          )}
        </>
      ),
    });
  }, [navigation, theme, activity, inputDate, ...inputValues.map((inputValue: any) => inputValue.value[0]), inputTags, noteInput]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={["left", "right"]}>
      <SystemBars style={"light"} />
      <ScrollView style={styles.content}>
        <View style={styles.pickerContainer}>
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
              right={<TextInput.Icon icon="calendar" />}
            />
          </Pressable>
        </View>

        <View style={styles.inputContainer}>
          {inputValues.map((inputValue: { subUnit: {name: string, unit: SubUnit2} | null, value: [string, (text: string) => void] }) => (
            <Text>Unimplemented</Text>
            // <TextInput
            //   key={inputValue.subUnit?.name ?? "value"}
            //   label={inputValue.subUnit ? `${inputValue.subUnit.name} [${inputValue.subUnit.symbol}]` : `Value ${activity.unit ? `[${activity.unit}]` : ""}`}
            //   value={inputValue.value[0] ?? ""}
            //   onChangeText={text => inputValue.value[1](text)}
            //   keyboardType="numeric"
            //   mode="outlined"
            // />
          ))}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            label="Note"
            value={noteInput}
            onChangeText={setNoteInput}
            mode="outlined"
          />
        </View>

        <View style={styles.inputContainer}>
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
        </View>
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
  pickerContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

export default EditDataPoint;