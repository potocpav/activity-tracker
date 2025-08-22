import React from "react";
import { View, Text } from "react-native";
import { Menu, Button } from 'react-native-paper';
import AntDesign from '@expo/vector-icons/AntDesign';
import { Tag, ActivityType } from "./StoreTypes";
import { getTheme, getThemePalette } from "./Theme";

interface TagMenuProps {
  activity: ActivityType;
  tags: { name: string; state: "yes" | "no" }[];
  onChange: (tags: { name: string; state: "yes" | "no" }[]) => void;
  menuVisible: boolean;
  setMenuVisible: (visible: boolean) => void;
  activityTags: Tag[];
  button?: (setMenuVisible: () => void) => React.ReactNode;
}

const TagMenu: React.FC<TagMenuProps> = ({
  tags,
  onChange,
  menuVisible,
  setMenuVisible,
  activityTags,
  button,
}) => {
  const theme = getTheme();
  const palette = getThemePalette();
  return (
    activityTags.length > 0 && (
      <Menu
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          button ? button(() => setMenuVisible(true)) :
          <Button compact={true} onPress={() => setMenuVisible(true)} style={{ 
            padding: 5,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ marginRight: 10, color: theme.colors.onSurfaceVariant }}>
                <AntDesign name="tag" size={16} color={theme.colors.onSurfaceVariant} />
                {tags.length === 0 ? '' : '*'}
              </Text>
              <AntDesign name="down" size={16} color={theme.colors.onSurfaceVariant} />
            </View>
          </Button>
        }
      >
        {activityTags.map((tag: Tag) => {
          const state = tags.find((t) => t.name === tag.name)?.state ?? "maybe";
          let icon = undefined;
          let title = tag.name;
          if (state === 'yes') icon = 'check';
          else if (state === 'no') icon = 'close';
          const newState : "yes" | "no" | "maybe" = state === 'maybe' ? 'yes' : state === 'yes' ? 'no' : 'maybe';
          let newTags;
          if (newState === 'maybe') {
            newTags = tags.filter((t) => t.name !== tag.name);
          } else if (tags.find((t) => t.name === tag.name)) {
            newTags = tags.map((t) => t.name === tag.name ? {
              ...t,
              state: newState
            } : t);
          } else {
            newTags = [...tags, { name: tag.name, state: newState }];
          }
          return (
            <Menu.Item
              key={tag.name}
              onPress={() => onChange(newTags)}
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