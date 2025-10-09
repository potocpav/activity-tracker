import React from "react";
import { View, Text } from "react-native";
import { Menu } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tag, ActivityType } from "../Model/StoreTypes";
import { getTheme, getThemePalette } from "../Model/Theme";
import { ChevronDownIcon, Button } from "./Element";

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
  activity,
  tags,
  onChange,
  menuVisible,
  setMenuVisible,
  activityTags,
  button,
}) => {
  const theme = getTheme(activity.color);
  const palette = getThemePalette();
  return (
    activityTags.length > 0 && (
      <Menu
        key={menuVisible ? "open" : "closed"}
        visible={menuVisible}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          button ? button(() => setMenuVisible(true)) :
            <Button onPress={() => setMenuVisible(true)}>
              {tags.length === 0 ?
                <MaterialCommunityIcons name="tag-outline" size={18} color={theme.colors.onSurface} /> :
                <MaterialCommunityIcons name="tag" size={18} color={theme.colors.primary} />
              }
              <ChevronDownIcon color={theme.colors.onSurface} />
            </Button>
        }
      >
        {activityTags.map((tag: Tag) => {
          const state = tags.find((t) => t.name === tag.name)?.state ?? "maybe";
          let icon = undefined;
          let title = tag.name;
          if (state === 'yes') icon = 'check';
          else if (state === 'no') icon = 'close';
          const newState: "yes" | "no" | "maybe" = state === 'maybe' ? 'yes' : state === 'yes' ? 'no' : 'maybe';
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