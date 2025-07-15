import React, { useState, FC } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Chip, useTheme } from 'react-native-paper';
import { SubUnit, GoalType } from "./Store";
import { TextInput, Button } from "react-native-paper";
import useStore from "./Store";
import { DatePickerInput, DatePickerModal, TimePickerModal } from "react-native-paper-dates";
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
  const [inputTime, setInputTime] = useState<{hours: number, minutes: number} | undefined>({hours: dateTime.getHours(), minutes: dateTime.getMinutes()});
  const inputValues = typeof goal.unit === "string" ? [{subUnit: null, value: useState<string>(dataPoint.value?.toString() ?? "")}] : 
    goal.unit.map((u: SubUnit) => ({subUnit: u, value: useState<string>(dataPoint.value[u.name]?.toString() ?? "")}));
  const [inputTags, setInputTags] = useState<string[]>(dataPoint.tags);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);  

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

      if (inputDate && inputTime && hasNonEmptyValue && newValue !== null) {
        const newTime = new Date(inputDate?.getFullYear(), inputDate?.getMonth(), inputDate?.getDate(), inputTime?.hours, inputTime?.minutes).getTime();
        console.log("inputTags", inputTags);
        updateGoalDataPoint(goalName, newDataPoint ? undefined : dataPointIndex, {
          time: newTime,
          value: newValue,
          tags: inputTags,
        });
        navigation.goBack();
      } else {
        Alert.alert("Invalid input");
      }
    };

  const duplicateDataPointWrapper = () => {
    saveDataPointWrapper();
    navigation.navigate("EditDataPoint", { goalName, dataPointIndex: dataPointIndex, newDataPoint: true });
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
  }, [navigation, goal, inputDate, inputTime, ...inputValues.map((inputValue: any) => inputValue.value[0]), inputTags]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView style={styles.content}>
      <View style={styles.pickerContainer}>
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>Date: {inputDate ? inputDate.toLocaleDateString() : 'Not set'}</Text>
        <Button onPress={() => setDatePickerVisible(true)} uppercase={false} mode="outlined">
          Change
        </Button>
        <DatePickerModal
          locale="cs"
          mode="single"
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          date={inputDate}
          onConfirm={(d) => {setInputDate(d.date); setDatePickerVisible(false);}}
        />
      </View>

      <View style={styles.pickerContainer}>
        <Text style={[styles.label, { color: theme.colors.onSurface }]}>Time: {inputTime ? `${inputTime.hours}:${inputTime.minutes}` : 'Not set'}</Text>
          <Button 
            onPress={() => setTimePickerVisible(true)} 
            uppercase={false} 
            mode="outlined"
            style={{marginBottom: 10}}
          >
            Change
          </Button>
          <TimePickerModal
            locale="cs"
            visible={timePickerVisible}
            onDismiss={() => setTimePickerVisible(false)}
            onConfirm={(t) => {setInputTime(t); setTimePickerVisible(false);}}
            hours={12}
            minutes={14}
          />
        </View>

      <View style={styles.inputContainer}>
        {inputValues.map((inputValue: {subUnit: SubUnit | null, value: [string, (text: string) => void]}) => (
          <TextInput
            key={inputValue.subUnit?.name}
            label={inputValue.subUnit ? `${inputValue.subUnit.name} [${inputValue.subUnit.symbol}]` : `Value [${goal.unit}]`}
            value={inputValue.value[0] ?? ""}
            onChangeText={text => inputValue.value[1](text)}
            keyboardType="numeric"
            mode="outlined"
          />      
        ))}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.tagsContainer}>

            {goal.tags.map((tag: any, index: number) => (
              <Chip
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
  title: {
    fontSize: 20,
    fontWeight: "600",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
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
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 8,
  },
  textInput: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "500",
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default EditDataPoint;