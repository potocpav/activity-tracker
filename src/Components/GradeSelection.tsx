import React, { useRef } from "react";
import { FlatList, StyleSheet, useWindowDimensions } from "react-native";
import { List } from "react-native-paper";
import { MD3Theme } from "react-native-paper/lib/typescript/types";
import { useAppTheme, useWideDisplay } from "../Model/Theme";
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
          color="white"
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
          <List.Item
            style={[styles.item, value === item ? styles.selectedItem : styles.unselectedItem]}
            titleStyle={value === item ? styles.selectedItemTitle : styles.unselectedItemTitle}
            key={item}
            onPress={() => {
              onSelect(item);
              onDismiss();
            }}
            title={item}
          />
        )}
      />
    </FullScreenDialog>
  );
};

const getStyles = (theme: MD3Theme, itemHeight: number) =>
  StyleSheet.create({
    item: {
      flex: 1,
      height: itemHeight,
    },
    selectedItem: {
      backgroundColor: theme.colors.primary,
    },
    unselectedItem: {
      backgroundColor: theme.colors.surface,
    },
    selectedItemTitle: {
      color: theme.colors.onPrimary,
    },
    unselectedItemTitle: {
      color: theme.colors.onSurface,
    },
  });

export default GradeSelection;
