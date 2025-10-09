import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons'; 
import { numericStatValues, StatValue } from "../Model/StoreTypes";
import { valueToLabel } from "../Model/Activity";
import { ChevronDownIcon } from "./Element";

interface ValueMenuProps {
  menuVisible: boolean
  setMenuVisible: (visible: boolean) => void
  value: StatValue
  onChange: (value: StatValue) => void
  themeColors: any
  valueList?: StatValue[]
}

const ValueMenu: React.FC<ValueMenuProps> = ({
  menuVisible,
  setMenuVisible,
  value,
  onChange,
  themeColors,
  valueList,
}) => {
  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button compact={true} onPress={() => setMenuVisible(true)} style={{ marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, color: themeColors.onSurfaceVariant }}>
              {valueToLabel(value)}
            </Text>
            <ChevronDownIcon color={themeColors.onSurfaceVariant} />
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
          />
        );
      })}
    </Menu>
  );
};

export default ValueMenu; 