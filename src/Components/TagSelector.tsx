import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ActivityType } from "../Model/StoreTypes";

export const TagSelector = ({
  activity,
  inputTags,
  toggleInputTag,
  palette,
  justifyContent,
  theme,
}: {
  activity: ActivityType;
  inputTags: string[];
  toggleInputTag: (tag: string) => void;
  palette: string[];
  justifyContent: "flex-start" | "center" | "flex-end";
  theme: any;
}) => {
  return (
    activity.tags.length > 0 && (
      <View style={[styles.row, { justifyContent: justifyContent }]}>
        {activity.tags.map((tag: any) => {
          const selected = inputTags.includes(tag.name);
          return (
            <Pressable
              key={tag.name}
              onPress={() => toggleInputTag(tag.name)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              android_ripple={{ foreground: true }}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? palette[tag.color] : theme.colors.surface,
                  borderColor: selected ? "transparent" : theme.colors.outline,
                },
              ]}
            >
              {({ pressed }) => (
                <>
                  {pressed && <View style={styles.pressedOverlay} />}
                  <Text style={[styles.label, { color: selected ? theme.colors.surface : palette[tag.color] }]}>
                    {tag.name}
                  </Text>
                </>
              )}
            </Pressable>
          );
        })}
      </View>
    )
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontWeight: "500",
  },
  pressedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
});

export default TagSelector;
