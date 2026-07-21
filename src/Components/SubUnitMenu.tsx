import React from "react";
import { Text } from "react-native";
import { Menu } from "react-native-paper";
import { ChevronDownIcon, Button } from "./Element";

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
      key={menuVisible ? "open" : "closed"}
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button onPress={() => setMenuVisible(true)}>
          <Text style={{ color: themeColors.onSurface }}>{subUnitName}</Text>
          <ChevronDownIcon color={themeColors.onSurface} />
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
