import React from "react";
import { Text } from "react-native";
import { Menu } from "react-native-paper";
import { ChevronDownIcon, Button } from "./Element";

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
  themeColors: any;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({
  options,
  selectedKey,
  onSelect,
  visible,
  setVisible,
  label,
  themeColors,
}) => {
  const selectedLabel = options.find((o) => o.key === selectedKey)?.label || label || "(select)";
  return (
    <Menu
      key={visible ? "open" : "closed"}
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button onPress={() => setVisible(true)}>
          <Text style={{ color: themeColors.onSurfaceVariant }}>{selectedLabel}</Text>
          <ChevronDownIcon color={themeColors.onSurfaceVariant} />
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
