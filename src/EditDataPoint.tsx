import React, { useState, FC } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SubUnit, GoalType } from "./Store";
import { TextInput, Button } from "react-native-paper";
import useStore from "./Store";
import { DatePickerInput, DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";

type EditDataPointProps = {
  navigation: any;
  route: any;
};

const EditDataPoint: FC<EditDataPointProps> = ({navigation, route}) => {
  const { goalId, dataPointIndex } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);
  
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
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);  

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Date: {inputDate ? inputDate.toLocaleDateString() : 'Not set'}</Text>
        <Button onPress={() => setDatePickerVisible(true)} uppercase={false} mode="outlined">
          Change
        </Button>
        <DatePickerModal
          locale="en"
          mode="single"
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          date={inputDate}
          onConfirm={(d) => {setInputDate(d.date); setDatePickerVisible(false);}}
        />
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Time: {inputTime ? `${inputTime.hours}:${inputTime.minutes}` : 'Not set'}</Text>
          <Button 
            onPress={() => setTimePickerVisible(true)} 
            uppercase={false} 
            mode="outlined"
            style={{marginBottom: 10}}
          >
            Change
          </Button>
          <TimePickerModal
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
            style={styles.textInput}
          />      
        ))}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tags: {dataPoint.tags.join(", ")}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        {dataPointIndex !== undefined && (
          <TouchableOpacity style={styles.deleteButton} onPress={() => {
            deleteGoalDataPoint(goalId, dataPointIndex);
            navigation.goBack();
          }}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.saveButton} onPress={() => {
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
            updateGoalDataPoint(goalId, dataPointIndex, {
              time: newTime,
              value: newValue,
              tags: dataPoint.tags,
            });
            navigation.goBack();
          } else {
            Alert.alert("Invalid input");
          }
        }}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333333",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: "#666666",
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
    color: "#333333",
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#666666",
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
    borderTopColor: "#e0e0e0",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#6c757d",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  saveButton: {
    flex: 1,
    backgroundColor: "#007AFF",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  deleteButton: {
    flex: 1,
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
});

export default EditDataPoint;