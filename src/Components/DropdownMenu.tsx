import React from "react";
import { Text } from "react-native";
import Menu from "./Menu";
import { ChevronDownIcon, Button } from "./Element";
import { Theme } from "../Model/Theme";

export interface DropdownMenuOption {
  key: string;
  label: string;
}

interface DropdownMenuProps {
  options: DropdownMenuOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  visible: boolean;
  setVisible: (visible: boolean) => void;
  label?: string;
  theme: Theme;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  options,
  selectedKey,
  onSelect,
  visible,
  setVisible,
  label,
  theme,
}) => {
  const selectedLabel = options.find((o) => o.key === selectedKey)?.label || label || "(select)";
  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button onPress={() => setVisible(true)}>
          <Text style={{ color: theme.onSurfaceVariant }}>{selectedLabel}</Text>
          <ChevronDownIcon color={theme.onSurfaceVariant} />
        </Button>
      }
    >
      {options.map(({ key, label }) => (
        <Menu.Item
          key={key}
          onPress={() => {
            setVisible(false);
            onSelect(key);
          }}
          title={label}
          trailingIcon={selectedKey === key ? "check" : undefined}
        />
      ))}
    </Menu>
  );
};

export default DropdownMenu;
