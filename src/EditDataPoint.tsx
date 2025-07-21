import React, { useState, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
} from "react-native";
import { Chip, useTheme, TextInput, Button } from 'react-native-paper';
import { SubUnit, GoalType } from "./Store";
import useStore from "./Store";
import { DatePickerInput } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
type EditDataPointProps = {
  navigation: any;
  route: any;
};

const EditDataPoint: FC<EditDataPointProps> = ({navigation, route}) => {
  const theme = useTheme();
  const { goalName, dataPointIndex, newDataPoint } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  
  const dataPoint = dataPointIndex !== undefined ? goal?.dataPoints[dataPointIndex] : {
    time: new Date().getTime(), 
    value: typeof goal.unit === "string" ? 
      null : 
      Object.fromEntries(goal.unit.map((u: SubUnit) => [u.name, null])), 
    tags: []
  };
  

  const dateTime = new Date(dataPoint.time);
  if (!dataPoint) {
    return <Text>Data point not found</Text>;
  }
  
  const updateGoalDataPoint = useStore((state: any) => state.updateGoalDataPoint);
  const deleteGoalDataPoint = useStore((state: any) => state.deleteGoalDataPoint);
  const [inputDate, setInputDate] = useState<CalendarDate | undefined>(dateTime);
  const [noteInput, setNoteInput] = useState<string>(dataPoint.note ?? "");
  const inputValues = typeof goal.unit === "string" ? [{subUnit: null, value: useState<string>(dataPoint.value?.toString() ?? "")}] : 
    goal.unit.map((u: SubUnit) => ({subUnit: u, value: useState<string>(dataPoint.value[u.name]?.toString() ?? "")}));
  const [inputTags, setInputTags] = useState<string[]>(dataPoint.tags);
  
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
      if (typeof goal.unit === "string") {
        newValue = parseFloat(inputValues[0].value[0]);
        if (isNaN(newValue)) {
          Alert.alert("Invalid input");
          newValue = null;
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
              Alert.alert("Invalid input");
              newValue = null;
              break;
            }
            newValue[inputValue.subUnit.name] = value;
          }
        }
      }

      if (inputDate && hasNonEmptyValue && newValue !== null) {
        const newTime = new Date(inputDate?.getFullYear(), inputDate?.getMonth(), inputDate?.getDate()).getTime();
        const note = noteInput === "" ? {} : {"note": noteInput};
        const newIndex = updateGoalDataPoint(goalName, newDataPoint ? undefined : dataPointIndex, {
          time: newTime,
          value: newValue,
          tags: inputTags,
          ...note,
        });
        navigation.goBack();
        return newIndex
      } else {
        Alert.alert("Invalid input");
      }
    };

  const duplicateDataPointWrapper = () => {
    const newIndex = saveDataPointWrapper();
    ToastAndroid.show('Data point saved', ToastAndroid.SHORT);
    navigation.navigate("EditDataPoint", { goalName, dataPointIndex: newIndex, newDataPoint: true });
  };
  
  React.useEffect(() => {
    navigation.setOptions({
      title: `${inputDate ? inputDate.toLocaleDateString() : 'Not set'} #${newDataPoint ? 'New' : dataPointIndex + 1}`,
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
          locale="cs"
          value={inputDate}
          onChange={(d) => {setInputDate(d);}}
          inputMode="start"
          mode="outlined"
          label="Date"
        />
      </View>

      <View style={styles.inputContainer}>
        {inputValues.map((inputValue: {subUnit: SubUnit | null, value: [string, (text: string) => void]}) => (
          <TextInput
            key={inputValue.subUnit?.name ?? "value"}
            label={inputValue.subUnit ? `${inputValue.subUnit.name} [${inputValue.subUnit.symbol}]` : `Value ${goal.unit ? `[${goal.unit}]` : "-"}`}
            value={inputValue.value[0] ?? ""}
            onChangeText={text => inputValue.value[1](text)}
            keyboardType="numeric"
            mode="outlined"
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