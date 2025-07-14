import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { DataPoint, Unit, SubUnit } from "./Store";
import useStore from "./Store";

type EditDataPointProps = {
  visible: boolean;
  onClose: () => void;
  dataPoint: DataPoint | null;
  goalId: string;
  dataPointIndex: number;
  unit: Unit;
};

const EditDataPoint: React.FC<EditDataPointProps> = ({
  visible,
  onClose,
  dataPoint,
  goalId,
  dataPointIndex,
  unit,
}) => {
  const [value, setValue] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");
  
  const updateGoalDataPoint = useStore((state: any) => state.updateGoalDataPoint);

  useEffect(() => {
    if (dataPoint) {
      // Handle complex value types
      if (typeof dataPoint.value === "object" && dataPoint.value !== null) {
        if (Array.isArray(unit)) {
          // Handle complex units (like finger strength with mean, max, tut)
          const valueParts: string[] = [];
          unit.forEach((u: SubUnit) => {
            if (dataPoint.value[u.name] !== null && dataPoint.value[u.name] !== undefined) {
              valueParts.push(`${dataPoint.value[u.name]}`);
            }
          });
          setValue(valueParts.join(", "));
        } else {
          setValue(JSON.stringify(dataPoint.value));
        }
      } else {
        setValue(String(dataPoint.value));
      }
      
      setTags(dataPoint.tags.join(", "));
      
      const dateObj = new Date(dataPoint.time);
      setDate(dateObj.toISOString().split('T')[0]);
      setTime(dateObj.toTimeString().split(' ')[0]);
    }
  }, [dataPoint, unit]);

  const handleSave = () => {
    if (!dataPoint) return;

    try {
      // Parse the value based on unit type
      let parsedValue: any = value;
      
      if (typeof unit === "string") {
        // Simple unit - try to parse as number
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          parsedValue = numValue;
        }
      } else if (Array.isArray(unit)) {
        // Complex unit - parse multiple values
        const valueParts = value.split(",").map((v: string) => v.trim());
        parsedValue = {};
        unit.forEach((u: SubUnit, index: number) => {
          if (valueParts[index]) {
            const numValue = parseFloat(valueParts[index]);
            if (!isNaN(numValue)) {
              parsedValue[u.name] = numValue;
            }
          }
        });
      }

      // Parse tags
      const parsedTags = tags
        .split(",")
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);

      // Parse date and time
      const dateTimeString = `${date}T${time}`;
      const parsedTime = new Date(dateTimeString);
      
      if (isNaN(parsedTime.getTime())) {
        Alert.alert("Invalid Date", "Please enter a valid date and time.");
        return;
      }

      const updatedDataPoint: DataPoint = {
        time: parsedTime,
        value: parsedValue,
        tags: parsedTags,
      };

      updateGoalDataPoint(goalId, dataPointIndex, updatedDataPoint);
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to save data point. Please check your input.");
    }
  };

  const renderValueInput = () => {
    if (typeof unit === "string") {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Value ({unit})</Text>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder={`Enter value in ${unit}`}
            keyboardType="numeric"
          />
        </View>
      );
    } else if (Array.isArray(unit)) {
      return (
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Values</Text>
          <Text style={styles.helperText}>
            Enter values separated by commas: {unit.map((u: SubUnit) => u.symbol).join(", ")}
          </Text>
          <TextInput
            style={styles.textInput}
            value={value}
            onChangeText={setValue}
            placeholder="e.g., 10, 15, 20"
            keyboardType="numeric"
          />
        </View>
      );
    }
    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit Data Point</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {renderValueInput()}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Tags</Text>
            <Text style={styles.helperText}>Enter tags separated by commas</Text>
            <TextInput
              style={styles.textInput}
              value={tags}
              onChangeText={setTags}
              placeholder="e.g., morning, strong, easy"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Date</Text>
            <TextInput
              style={styles.textInput}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Time</Text>
            <TextInput
              style={styles.textInput}
              value={time}
              onChangeText={setTime}
              placeholder="HH:MM:SS"
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
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