import React, { useState } from "react";
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from "react-native";
import { TextInput } from "react-native-paper";
import ColorPicker from "./ColorPicker";
import InputWrapper, { InputWrapperRef } from "./InputWrapper";
import { ButtonRow, CheckButton, ColorButton, DeleteButton } from "./Element";

// Plain react-native replacement for the react-native-paper <Dialog> this used to be:
// a Modal with a see-through backdrop, a full-screen Pressable behind the card to
// dismiss on an outside tap, and the card itself centered on top. The color picker
// lives inside this Modal so it is layered above the dialog rather than beside it.

interface TagDialogProps {
  visible: boolean;
  onDismiss: () => void;
  nameInput: string;
  onChangeName: (name: string) => void;
  nameError: string | null;
  nameInputRef: React.RefObject<InputWrapperRef>;
  color: number;
  onChangeColor: (colorIx: number) => void;
  onDelete: () => void;
  onUpdate: () => void;
  palette: string[];
  theme: any;
}

const TagDialog: React.FC<TagDialogProps> = ({
  visible,
  onDismiss,
  nameInput,
  onChangeName,
  nameError,
  nameInputRef,
  color,
  onChangeColor,
  onDelete,
  onUpdate,
  palette,
  theme,
}) => {
  const [colorPickerVisible, setColorPickerVisible] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      backdropColor={"rgba(0, 0, 0, 0.0)"}
      onRequestClose={onDismiss}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      <KeyboardAvoidingView style={styles.centered} behavior="padding" pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: theme.colors.elevation.level3 }]}>
          <View style={styles.content}>
            <InputWrapper error={nameError} ref={nameInputRef}>
              <TextInput label="Tag Name" defaultValue={nameInput} onChangeText={onChangeName} mode="outlined" />
            </InputWrapper>
            <ColorButton color={color} onPress={() => setColorPickerVisible(true)} />
          </View>
          <View style={styles.actions}>
            <ButtonRow>
              <DeleteButton onPress={onDelete} color={theme.colors.onSurface} />
              <CheckButton onPress={onUpdate} color={theme.colors.onSurface} />
            </ButtonRow>
          </View>
        </View>
      </KeyboardAvoidingView>
      <ColorPicker
        visible={colorPickerVisible}
        palette={palette}
        selectedColor={color}
        onSelect={(colorIx) => {
          onChangeColor(colorIx);
          setColorPickerVisible(false);
        }}
        onDismiss={() => setColorPickerVisible(false)}
        theme={theme}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    borderRadius: 28,
    paddingTop: 24,
    elevation: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
  },
});

export default TagDialog;
