import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
  NativeModules,
} from "react-native";
import { Chip, useTheme, TextInput, Button } from 'react-native-paper';
import { SubUnit, GoalType, dateToDateList, dateListToTime, DataPoint } from "./StoreTypes";
import useStore from "./Store";
import { DatePickerInput } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { cmpDateList } from "./GoalUtil";

type EditDataPointProps = {
  navigation: any;
  route: any;
};

const locale = NativeModules.I18nManager.localeIdentifier;

const EditDataPoint: FC<EditDataPointProps> = ({ navigation, route }) => {
  const theme = useTheme();
  const { goalName, dataPointIndex, newDataPoint, newDataPointDate } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);

  const dataPoint : DataPoint = dataPointIndex !== undefined ? goal?.dataPoints[dataPointIndex] : {
    date: dateToDateList(newDataPointDate ? new Date(newDataPointDate[0], newDataPointDate[1], newDataPointDate[2]) : new Date()),
    value: typeof goal.unit === "string" ?
      null :
      Object.fromEntries(goal.unit.map((u: SubUnit) => [u.name, null])),
    tags: []
  };

  
  if (!dataPoint) {
    return <Text>Data point not found</Text>;
  }
  
  const dateTime = new Date(...dataPoint.date);

  const updateGoalDataPoint = useStore((state: any) => state.updateGoalDataPoint);
  const deleteGoalDataPoint = useStore((state: any) => state.deleteGoalDataPoint);
  const [inputDate, setInputDate] = useState<CalendarDate | undefined>(dateTime);
  const [noteInput, setNoteInput] = useState<string>(dataPoint.note ?? "");
  const inputValues = typeof goal.unit === "string" ? 
    [{ 
      subUnit: null, 
      value: useState<string>(dataPoint.value?.toString() ?? "") 
    }] :
    goal.unit.map((u: SubUnit) => ({ 
      subUnit: u, 
      value: useState<string>(
        (dataPoint.value as Record<string, number | null>)[u.name]?.toString() ?? "")
    }));
  const [inputTags, setInputTags] = useState<string[]>(dataPoint.tags ?? []);

  const toggleInputTag = (tag: string) => {
    setInputTags(inputTags.includes(tag) ? inputTags.filter((t: string) => t !== tag) : [...inputTags, tag]);
  }

  const deleteDataPointWrapper = () => {
    deleteGoalDataPoint(goalName, dataPointIndex);
    navigation.goBack();
  };

  const saveDataPointWrapper = () => {
    var newValue: any = {};
    var hasNonEmptyValue = false;
    var hasNonNumbervalue = false;
    if (typeof goal.unit === "string") {
      newValue = parseFloat(inputValues[0].value[0]);
      if (inputValues[0].value[0] === "") {
        newValue = null;
      } else if (isNaN(newValue)) {
        newValue = null;
        hasNonNumbervalue = true;
      } else {
        hasNonEmptyValue = true;
      }
    } else {
      for (const inputValue of inputValues) {
        if (inputValue.value[0] === "") {
          newValue[inputValue.subUnit.name] = null;
        } else {
          hasNonEmptyValue = true;
          const value = parseFloat(inputValue.value[0]);
          if (isNaN(value)) {
            newValue = null;
            hasNonNumbervalue = true;
            break;
          }
          newValue[inputValue.subUnit.name] = value;
        }
      }
    }

    if (!inputDate) {
      Alert.alert("Date is required");
    } else if (hasNonNumbervalue) {
      Alert.alert("Value must be a number");
    } else if (!hasNonEmptyValue) {
      Alert.alert("Value is required");
    } else {
      const newDate = dateToDateList(inputDate);
      const today = dateToDateList(new Date());
      if (cmpDateList(newDate, today) > 0) {
        Alert.alert("Date cannot be in the future");
      } else if (cmpDateList(newDate, [2000, 0, 0]) < 0) {
        Alert.alert("Date must be from this millenium");
      } else {
        const note = noteInput === "" ? {} : { "note": noteInput };
        const newIndex = updateGoalDataPoint(goalName, newDataPoint ? undefined : dataPointIndex, {
          date: newDate,
          value: newValue,
          tags: inputTags,
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
    navigation.navigate("EditDataPoint", { goalName, dataPointIndex: newIndex, newDataPoint: true });
  };

  React.useEffect(() => {
    navigation.setOptions({
      title: newDataPoint ? 'New data point' : `${new Date(...dataPoint.date).toLocaleDateString(locale)} #${dataPointIndex + 1}`,
      headerRight: () => (
        <>
          <Button compact={true} onPress={saveDataPointWrapper}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
          <Button compact={true} onPress={duplicateDataPointWrapper}><Ionicons name="duplicate-outline" size={24} color={theme.colors.onSurface} /></Button>
          {dataPointIndex !== undefined && (
            <Button compact={true} onPress={deleteDataPointWrapper}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
          )}
        </>
      ),
    });
  }, [navigation, theme, goal, inputDate, ...inputValues.map((inputValue: any) => inputValue.value[0]), inputTags, noteInput]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView style={styles.content}>
        <View style={styles.pickerContainer}>
          <DatePickerInput
            locale={locale}
            value={inputDate}
            onChange={(d) => { setInputDate(d); }}
            inputMode="start"
            mode="outlined"
            label="Date"
          />
        </View>

        <View style={styles.inputContainer}>
          {inputValues.map((inputValue: { subUnit: SubUnit | null, value: [string, (text: string) => void] }) => (
            <TextInput
              key={inputValue.subUnit?.name ?? "value"}
              label={inputValue.subUnit ? `${inputValue.subUnit.name} [${inputValue.subUnit.symbol}]` : `Value ${goal.unit ? `[${goal.unit}]` : "-"}`}
              value={inputValue.value[0] ?? ""}
              onChangeText={text => inputValue.value[1](text)}
              keyboardType="numeric"
              mode="outlined"
              style={{
                marginBottom: 10,
              }}
            />
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

            {goal.tags.map((tag: any, index: number) => (
              <Chip
                key={tag.name}
                onPress={() => { toggleInputTag(tag.name); }}
                mode={inputTags.includes(tag.name) ? "flat" : "outlined"}
                style={{
                  marginRight: 8,
                  marginBottom: 8,
                }} >
                {tag.name}
              </Chip>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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