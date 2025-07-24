import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';

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
  const selectedLabel = options.find(o => o.key === selectedKey)?.label || label || "(select)";
  return (
    <Menu
      visible={visible}
      onDismiss={() => setVisible(false)}
      anchor={
        <Button compact={true} onPress={() => setVisible(true)} style={{ 
          backgroundColor: themeColors.surface,
          borderRadius: 4,
          padding: 5,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: themeColors.outline,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ marginRight: 10, color: themeColors.onSurfaceVariant }}>{selectedLabel}</Text>
            <AntDesign name="down" size={16} color={themeColors.onSurfaceVariant} />
          </View>
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