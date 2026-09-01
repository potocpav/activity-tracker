import React, { useRef } from "react";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import { useAppTheme, useWideDisplay, Theme } from "../Model/Theme";
import { CloseButton } from "./Element";
import FullScreenDialog from "./FullScreenDialog";

// Full-screen climbing grade picker, opened from the read-only grade field in ValueEditor.
// Selecting a grade applies it and closes; the header's close button clears the value.

type GradeSelectionProps = {
  visible: boolean;
  options: string[];
  value: string;
  activityColor: number;
  onSelect: (grade: string) => void;
  onDismiss: () => void;
};

const GradeSelection = ({ visible, options, value, activityColor, onSelect, onDismiss }: GradeSelectionProps) => {
  const theme = useAppTheme(activityColor);
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const itemHeight = 50 * dimensions.fontScale;
  const numColumns = wideDisplay ? 4 : 2;
  const styles = getStyles(theme, itemHeight);

  // Open on the current grade, or in the middle of the scale when nothing is set yet.
  const itemIx = options.findIndex((o) => o === value);
  const scrollIx = itemIx === -1 ? options.length / 2 : itemIx;
  const initialRow = Math.max(0, Math.floor(scrollIx / numColumns));
  const listRef = useRef<FlatList<string>>(null);

  return (
    <FullScreenDialog
      visible={visible}
      title="Select Grade"
      activityColor={activityColor}
      onDismiss={onDismiss}
      headerRight={
        <CloseButton
          onPress={() => {
            onSelect("");
            onDismiss();
          }}
          color={theme.onHeader}
        />
      }
    >
      <FlatList
        key={`grade-list-${numColumns}`}
        ref={listRef}
        getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
        onLayout={() => listRef.current?.scrollToIndex({ index: initialRow, viewPosition: 0.5, animated: true })}
        numColumns={numColumns}
        indicatorStyle="black"
        data={options}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.item, value === item ? styles.selectedItem : styles.unselectedItem]}
            key={item}
            android_ripple={{ foreground: true, color: theme.elevation3 }}
            onPress={() => {
              onSelect(item);
              onDismiss();
            }}
          >
            <Text style={value === item ? styles.selectedItemTitle : styles.unselectedItemTitle}>{item}</Text>
          </Pressable>
        )}
      />
    </FullScreenDialog>
  );
};

const getStyles = (theme: Theme, itemHeight: number) =>
  StyleSheet.create({
    item: {
      flex: 1,
      height: itemHeight,
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    selectedItem: {
      backgroundColor: theme.primary,
    },
    unselectedItem: {
      backgroundColor: theme.surface,
    },
    selectedItemTitle: {
      fontSize: 16,
      color: theme.onPrimary,
    },
    unselectedItemTitle: {
      fontSize: 16,
      color: theme.onSurface,
    },
  });

export default GradeSelection;
