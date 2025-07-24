import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Tag } from "./StoreTypes";

interface TagMenuProps {
  tags: { name: string; state: "yes" | "no" | "maybe" }[];
  setTags: (tags: { name: string; state: "yes" | "no" | "maybe" }[]) => void;
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  goalTags: Tag[];
  palette: string[];
  themeColors: any;
}

const TagMenu: React.FC<TagMenuProps> = ({
  tags,
  setTags,
  menuVisible,
  setMenuVisible,
  goalTags,
  palette,
  themeColors,
}) => {
  return (
    goalTags.length > 0 && (
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <Button compact={true} onPress={() => setMenuVisible(true)} style={{ marginRight: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 10, color: themeColors.onSurfaceVariant }}>
                <AntDesign name="filter" size={16} color={themeColors.onSurfaceVariant} />
                {(() => {
                  const yesTags = tags.filter(t => t.state === 'yes').map(t => t.name);
                  const noTags = tags.filter(t => t.state === 'no').map(t => t.name);
                  if (yesTags.length === 0 && noTags.length === 0)
                    return '';
                  else
                    return '*';
                })()}
              </Text>
              <AntDesign name="down" size={16} color={themeColors.onSurfaceVariant} />
            </View>
          </Button>
        }
      >
        {goalTags.map((tag: Tag) => {
          const state = tags.find((t) => t.name === tag.name)?.state;
          let icon = undefined;
          let title = tag.name;
          if (state === 'yes') icon = 'check';
          else if (state === 'no') icon = 'close';
          return (
            <Menu.Item
              key={tag.name}
              onPress={() => {
                setTags(tags.map((t) => t.name === tag.name ? {
                  ...t,
                  state: t.state === 'maybe' ? 'yes' : t.state === 'yes' ? 'no' : 'maybe'
                } : t));
              }}
              title={title}
              trailingIcon={icon}
              titleStyle={{ color: palette[tag.color] }}
            />
          );
        })}
      </Menu>
    )
  );
};

export default TagMenu; 