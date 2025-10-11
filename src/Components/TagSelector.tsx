import React from "react";
import {
  View,
  Text,
} from "react-native";
import { Chip, MD3Theme } from 'react-native-paper';
import { ActivityType } from "../Model/StoreTypes";

export const TagSelector = ({ activity, inputTags, toggleInputTag, palette, theme }:
  {
    activity: ActivityType,
    inputTags: string[],
    toggleInputTag: (tag: string) => void,
    palette: string[],
    theme: MD3Theme,
  }) => {
  return (activity.tags.length > 0 && (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {activity.tags.map((tag: any, index: number) => (
        <Chip
          key={tag.name}
          onPress={() => { toggleInputTag(tag.name); }}
          mode={inputTags.includes(tag.name) ? "flat" : "outlined"}
          style={{
            backgroundColor: inputTags.includes(tag.name) ? palette[tag.color] : theme.colors.surface,
          }}
          textStyle={{
            color: inputTags.includes(tag.name) ? theme.colors.surface : palette[tag.color],
          }}
        >
          {tag.name}
        </Chip>
      ))}
    </View>)
  );
}

export default TagSelector;