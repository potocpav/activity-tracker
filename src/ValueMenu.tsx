import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';
import { allStatValues, StatValue } from "./StoreTypes";
import { valueToLabel } from "./ActivityUtil";

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
            <AntDesign name="down" size={16} color={themeColors.onSurfaceVariant} />
          </View>
        </Button>
      }
    >
      {(valueList ?? allStatValues).map((v: StatValue) => {
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