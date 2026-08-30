import React from "react";
import { View, Text } from "react-native";
import Menu from "./Menu";
import { numericStatValues, StatValue } from "../Model/StoreTypes";
import { valueToLabel } from "../Model/Activity";
import { ChevronDownIcon, Button } from "./Element";
import { Theme } from "../Model/Theme";

interface ValueMenuProps {
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  value: StatValue;
  onChange: (value: StatValue) => void;
  theme: Theme;
  valueList?: StatValue[];
}

const ValueMenu: React.FC<ValueMenuProps> = ({ menuVisible, setMenuVisible, value, onChange, theme, valueList }) => {
  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button onPress={() => setMenuVisible(true)}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={{ marginRight: 10, color: theme.onSurface }}>{valueToLabel(value)}</Text>
            <ChevronDownIcon color={theme.onSurface} />
          </View>
        </Button>
      }
    >
      {(valueList ?? numericStatValues).map((v: StatValue) => {
        return (
          <Menu.Item
            key={v}
            onPress={() => {
              setMenuVisible(false);
              onChange(v);
            }}
            title={valueToLabel(v)}
            trailingIcon={v === value ? "check" : undefined}
          />
        );
      })}
    </Menu>
  );
};

export default ValueMenu;
