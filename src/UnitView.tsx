import { Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Dialog, Portal, TextInput, Button, RadioButton } from "react-native-paper";
import { SubUnit } from "./StoreTypes";
import { useState } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getTheme } from "./Theme";
import { renderUnit } from "./Unit";

type ChosenUnit = "number" | "count" | "weight_kg" | "weight_lb" | "time_seconds" | "time_hours" | "climbing_grade_uiaa" | "climbing_grade_french" | "climbing_grade_font" | "climbing_grade_v_scale";

const subUnitToChosenUnit = (subUnit: SubUnit): ChosenUnit | null => {
  switch (subUnit.type) {
    case "number":
      return "number";
    case "count":
      return "count";
    case "weight":
      switch (subUnit.unit) {
        case "kg":
          return "weight_kg";
        case "lb":
          return "weight_lb";
      }
    case "time":
      switch (subUnit.unit) {
        case "seconds":
          return "time_seconds";
        case "hours":
          return "time_hours";
      }
    case "climbing_grade":
      return subUnit.grade === "uiaa" ? "climbing_grade_uiaa" : subUnit.grade === "french" ? "climbing_grade_french" : subUnit.grade === "font" ? "climbing_grade_font" : "climbing_grade_v_scale";
    default:
      return null;
  }
}

const toUnit = (chosenUnit: ChosenUnit): SubUnit => {
  switch (chosenUnit) {
    case "number":
      return { type: "number", symbol: "" };
    case "count":
      return { type: "count" };
    case "weight_kg":
      return { type: "weight", unit: "kg" };
    case "weight_lb":
      return { type: "weight", unit: "lb" };
    case "time_seconds":
      return { type: "time", unit: "seconds" };
    case "time_hours":
      return { type: "time", unit: "hours" };
    case "climbing_grade_uiaa":
      return { type: "climbing_grade", grade: "uiaa" };
    case "climbing_grade_french":
      return { type: "climbing_grade", grade: "french" };
    case "climbing_grade_font":
      return { type: "climbing_grade", grade: "font" };
    case "climbing_grade_v_scale":
      return { type: "climbing_grade", grade: "v-scale" };
  }
}


export const UnitEditor = ({ unit, onChange }: { unit: SubUnit, onChange: (unit: SubUnit) => void }) => {
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const [unitInput, setUnitInput] = useState(unit);
  const [chosenUnit, setChosenUnit] = useState<ChosenUnit | null>(subUnitToChosenUnit(unit));
  const theme = getTheme();
  
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <TextInput
        style={{ flex: 1 }}
        label="Unit"
        value={renderUnit(unitInput)}
        editable={false}
        mode="outlined"
      />
      <Button onPress={() => setUnitDialogVisible(true)}>
        <AntDesign name="edit" size={24} color={theme.colors.onSurface} />
      </Button>
      <Portal>
        <Dialog style={{ maxHeight: "90%" }} visible={unitDialogVisible} onDismiss={() => setUnitDialogVisible(false)}>
          <Dialog.Title style={{ fontSize: 20 }}>Select Unit</Dialog.Title>
          <Dialog.ScrollArea style={{ borderWidth: 0, borderColor: theme.colors.outlineVariant, margin: 0 }}>
            <ScrollView>
              <RadioButton.Group 
                onValueChange={value => setUnitInput(toUnit(value as ChosenUnit))}
                value={subUnitToChosenUnit(unitInput) ?? ""}>
                <RadioButton.Item label="Number" value="number" />
                {unitInput.type === "number" && 
                  <TextInput 
                    label="Symbol" 
                    value={unitInput.symbol} 
                    onChangeText={text => setUnitInput({ ...unitInput, symbol: text })} 
                    mode="outlined"
                    style={{ marginLeft: 16 }}
                  />
                }
                <RadioButton.Item label="Count" value="count" />
                <RadioButton.Item label="Weight (kg)" value="weight_kg" />
                <RadioButton.Item label="Weight (lb)" value="weight_lb" />
                {/* <RadioButton.Item label="Time (seconds)" value="time_seconds" /> */}
                <RadioButton.Item label="Time (hours)" value="time_hours" />
                <RadioButton.Item label="Climbing Grade (UIAA)" value="climbing_grade_uiaa" />
                {/* <RadioButton.Item label="Climbing Grade (French)" value="climbing_grade_french" /> */}
                {/* <RadioButton.Item label="Climbing Grade (Font)" value="climbing_grade_font" /> */}
                <RadioButton.Item label="Climbing Grade (V-Scale)" value="climbing_grade_v_scale" />
              </RadioButton.Group>
            </ScrollView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setUnitDialogVisible(false)}>
              <AntDesign name="close" size={24} color={theme.colors.onSurface} />
            </Button>
            <Button onPress={() => {
              setUnitDialogVisible(false);
              if (chosenUnit) {
                onChange(unitInput);
              }
            }}>
              <AntDesign name="check" size={24} color={theme.colors.onSurface} />
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

export const ValueEditor = ({
  unit,
  label,
  value,
  onChange,
}: {
  unit: SubUnit,
  label: string,
  value: string,
  onChange: (value: string) => void,
}) => {
  switch (unit.type) {
    case "time":
      return <TextInput
        label={label}
        value={value}
        onChangeText={text => onChange(text)}
        mode="outlined"
      />
    default:
      return <TextInput
        label={label}
        value={value}
        onChangeText={text => onChange(text)}
        keyboardType="numeric"
        mode="outlined"
      />
  }
  
}