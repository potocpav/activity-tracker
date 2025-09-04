import { Text } from "react-native";
import { TextInput } from "react-native-paper";
import { CompositeUnit, SubUnit, SubUnit2 } from "./StoreTypes";

export const renderLongFormNumber = (value: number): string => {
  return `${Math.round(value * 10) / 10}`;
}

export const renderShortFormNumber = (value: number): string => {
  return `${Math.round(value * 10) / 10}`;
}

export const renderLongFormValue = (value: number, unit: SubUnit2): string => {
  switch (unit.type) {
    case "number":
      let suffix1 = unit.symbol === "" ? "" : " " + unit.symbol;
      return renderLongFormNumber(value) + suffix1;
    case "count":
      return renderLongFormNumber(value);
    case "weight":
      return `${renderLongFormNumber(value)} ${unit.unit}`;
    case "time":
      let suffix2;
      if (unit.unit === "seconds") {
        suffix2 = "s";
      } else if (unit.unit === "minutes") {
        suffix2 = "m";
      } else if (unit.unit === "hours") {
        suffix2 = "h";
      }
      return `${renderLongFormNumber(value)} ${suffix2}`;
    case "climbing_grade":
      return `${renderLongFormNumber(value)} ${unit.grade}`;
  }
}

export const UnitEditor = ({ unit, onChange }: { unit: SubUnit2, onChange: (unit: SubUnit2) => void }) => {
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
      return (<Text>TODO: count editor</Text>);
    case "time":
      return (<Text>TODO: count editor</Text>);
    case "climbing_grade":
      return (<Text>TODO: count editor</Text>);
  }
}
