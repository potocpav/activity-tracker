import { Text } from "react-native";
import { TextInput } from "react-native-paper";
import { SubUnit } from "./StoreTypes";


export const UnitEditor = ({ unit, onChange }: { unit: SubUnit, onChange: (unit: SubUnit) => void }) => {
  switch (unit.type) {
    case "number":
      return (
        <TextInput
          label="Unit"
          value={unit.symbol}
          onChangeText={text => onChange({ ...unit, symbol: text })}
          mode="outlined"
        />
      );
    case "count":
      return (<Text>TODO: count editor</Text>);
    case "weight":
      return (<Text>TODO: weight editor</Text>);
    case "time":
      return (<Text>TODO: time editor</Text>);
    case "climbing_grade":
      return (<Text>TODO: climbing grade editor</Text>);
  }
}

export const ValueEditor = ({
  label,
  value,
  onChange,
}: {
  label: string,
  value: string,
  onChange: (value: string) => void,
}) => {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={text => onChange(text)}
      keyboardType="numeric"
      mode="outlined"
    />
  );
}