import React from "react";
import { Text } from "react-native";
import Menu from "./Menu";
import { ChevronDownIcon, Button } from "./Element";
import { Theme } from "../Model/Theme";

interface SubUnitMenuProps {
  subUnitNames: string[] | null;
  subUnitName: string | null;
  setSubUnitName: (name: string) => void;
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  theme: Theme;
}

const SubUnitMenu: React.FC<SubUnitMenuProps> = ({
  subUnitNames,
  subUnitName,
  setSubUnitName,
  menuVisible,
  setMenuVisible,
  theme,
}) => {
  if (!subUnitNames || subUnitNames.length === 0) return null;
  return (
    <Menu
      visible={menuVisible}
      onDismiss={() => setMenuVisible(false)}
      anchor={
        <Button onPress={() => setMenuVisible(true)}>
          <Text style={{ color: theme.onSurface }}>{subUnitName}</Text>
          <ChevronDownIcon color={theme.onSurface} />
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
