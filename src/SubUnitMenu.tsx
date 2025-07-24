import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';

interface SubUnitMenuProps {
  subUnitNames: string[] | null;
  subUnitName: string | null;
  setSubUnitName: (name: string) => void;
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  themeColors: any;
}

const SubUnitMenu: React.FC<SubUnitMenuProps> = ({
  subUnitNames,
  subUnitName,
  setSubUnitName,
  menuVisible,
  setMenuVisible,
  themeColors,
}) => {
  if (!subUnitNames || subUnitNames.length === 0) return null;
  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button compact={true} onPress={() => setMenuVisible(true)} style={{ marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, color: themeColors.onSurfaceVariant }}>{subUnitName}</Text>
            <AntDesign name="down" size={16} color={themeColors.onSurfaceVariant} />
          </View>
        </Button>
      }
    >
      {subUnitNames.map((name: string) => (
        <Menu.Item
          key={name}
          onPress={() => {
            setMenuVisible(false);
            setSubUnitName(name);
          }}
          title={name}
          trailingIcon={subUnitName === name ? "check" : undefined}
        />
      ))}
    </Menu>
  );
};

export default SubUnitMenu; 