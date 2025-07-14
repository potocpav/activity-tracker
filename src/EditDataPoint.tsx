import React, { useState, useEffect, FC } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { DataPoint, Unit, SubUnit, GoalType } from "./Store";
import { TextInput, Button } from "react-native-paper";
import useStore from "./Store";
import { DatePickerInput, DatePickerModal, TimePickerModal } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";

// type EditDataPointProps = {
//   visible: boolean;
//   onClose: () => void;
//   dataPoint: DataPoint | null;
//   goalId: string;
//   dataPointIndex: number;
//   unit: Unit;
// };

type EditDataPointProps = {
  navigation: any;
  route: any;
};

const EditDataPoint: FC<EditDataPointProps> = ({navigation, route}) => {
  const { goalId, dataPointIndex } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.id === goalId);
  const dataPoint = goal?.dataPoints[dataPointIndex];
  const dateTime = new Date(dataPoint.time);

  if (!dataPoint) {
    return <Text>Data point not found</Text>;
  }
  
  const updateGoalDataPoint = useStore((state: any) => state.updateGoalDataPoint);
  
  const [inputDate, setInputDate] = useState<CalendarDate | undefined>(dateTime);
  const [inputTime, setInputTime] = useState<{hours: number, minutes: number} | undefined>({hours: dateTime.getHours(), minutes: dateTime.getMinutes()});
  const [inputValue, setInputValue] = useState<string>(dataPoint.value.toString());
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
          <TextInput
            label={`Value [${goal.unit}]`}
            value={inputValue}
            onChangeText={text => setInputValue(text)}
            keyboardType="numeric"
            style={styles.textInput}
          />
        </View>


        <View style={styles.inputContainer}>
          <Text style={styles.label}>Tags: {dataPoint.tags.join(", ")}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={() => {
          const newValue = parseFloat(inputValue);
          if (inputDate && inputTime && !isNaN(newValue)) {
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
});

export default EditDataPoint;