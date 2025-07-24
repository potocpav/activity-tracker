import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';

export type Value = "Count" | "Max" | "Mean" | "Sum"

interface ValueMenuProps {
  menuVisible: boolean
  setMenuVisible: (visible: boolean) => void
  value: Value
  setValue: (value: Value) => void
  themeColors: any
}

const valueList: Value[] = ["Count", "Max", "Mean", "Sum"]

const ValueMenu: React.FC<ValueMenuProps> = ({
  menuVisible,
  setMenuVisible,
  value,
  setValue,
  themeColors,
}) => {
  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button compact={true} onPress={() => setMenuVisible(true)} style={{ marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, color: themeColors.onSurfaceVariant }}>
              {value}
            </Text>
            <AntDesign name="down" size={16} color={themeColors.onSurfaceVariant} />
          </View>
        </Button>
      }
    >
      {valueList.map((v: Value) => {
        return (
          <Menu.Item
            key={v}
            onPress={() => {
              setMenuVisible(false);
              setValue(v);
            }}
            title={v}
          />
        );
      })}
    </Menu>
  );
};

export default ValueMenu; 