import React, { useRef } from "react";
import { FlatList, Modal, Text, View, useWindowDimensions } from "react-native";
import { List } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme, useWideDisplay } from "../Model/Theme";
import { Button, CloseButton } from "./Element";

// Full-screen climbing grade picker, opened from the read-only grade field in ValueEditor.
// Selecting a grade applies it and closes; the header's close button clears the value.

type GradeSelectionProps = {
  visible: boolean;
  options: string[];
  value: string;
  onSelect: (grade: string) => void;
  onDismiss: () => void;
};

const GradeSelection = ({ visible, options, value, onSelect, onDismiss }: GradeSelectionProps) => {
  const theme = useAppTheme();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const itemHeight = 50 * dimensions.fontScale;
  const numColumns = wideDisplay ? 4 : 2;

  // Open on the current grade, or in the middle of the scale when nothing is set yet.
  const itemIx = options.findIndex((o) => o === value);
  const scrollIx = itemIx === -1 ? options.length / 2 : itemIx;
  const initialRow = Math.max(0, Math.floor(scrollIx / numColumns));
  const listRef = useRef<FlatList<string>>(null);

  return (
    <Modal
      transparent={false}
      backdropColor={theme.colors.surface}
      onRequestClose={onDismiss}
      animationType="fade"
      visible={visible}
      onDismiss={onDismiss}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: theme.colors.elevation.level1,
            elevation: 2,
            flexDirection: "row",
            paddingVertical: 10,
            paddingRight: 10,
            alignItems: "center",
          }}
        >
          <Button onPress={onDismiss}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
          </Button>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, color: theme.colors.onSurface }}>Select Grade</Text>
          </View>
          <CloseButton
            onPress={() => {
              onSelect("");
              onDismiss();
            }}
            color={theme.colors.onSurface}
          />
        </View>
        <FlatList
          key={`grade-list-${numColumns}`}
          ref={listRef}
          getItemLayout={(_, index) => ({ length: itemHeight, offset: itemHeight * index, index })}
          onLayout={() => listRef.current?.scrollToIndex({ index: initialRow, viewPosition: 0.5, animated: false })}
          numColumns={numColumns}
          indicatorStyle="black"
          data={options}
          renderItem={({ item }) => (
            <List.Item
              right={value === item ? (props) => <List.Icon {...props} icon="check" /> : undefined}
              style={{ flex: 1, height: itemHeight }}
              key={item}
              onPress={() => {
                onSelect(item);
                onDismiss();
              }}
              title={item}
            />
          )}
        />
      </SafeAreaView>
    </Modal>
  );
};

export default GradeSelection;
