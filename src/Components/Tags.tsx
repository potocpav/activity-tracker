import { Tag } from "../Model/StoreTypes";
import { View, Text, StyleSheet } from "react-native";

// TODO: make into a component
export const RenderTags = ({ tags, theme, palette }: { tags: Tag[]; theme: any; palette: string[] }) => {
  if (tags.length === 0) return null;
  return (
    <View style={styles.tagsContainer}>
      {tags.map((tag, index) => (
        <View key={index} style={[styles.tag, { backgroundColor: palette[tag.color], borderColor: theme.surface }]}>
          <Text style={[styles.tagText, { color: theme.surface }]}>{tag.name}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  tag: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
