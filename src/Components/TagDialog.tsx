import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import ColorPicker from "./ColorPicker";
import SmallDialog from "./SmallDialog";
import InputWrapper, { InputWrapperRef } from "./InputWrapper";
import { ButtonRow, CheckButton, ColorButton, DeleteButton } from "./Element";
import TextField from "./TextField";

// Tag rename / recolor dialog. The color picker lives inside this Dialog's Modal so
// it is layered above the dialog rather than beside it.

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
    <SmallDialog visible={visible} onDismiss={onDismiss} theme={theme}>
      <View style={styles.content}>
        <InputWrapper error={nameError} ref={nameInputRef}>
          <TextField label="Tag Name" defaultValue={nameInput} onChangeText={onChangeName} />
        </InputWrapper>
        <View>
          <ColorButton color={color} onPress={() => setColorPickerVisible(true)} />
        </View>
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
      </View>
      <SmallDialog.Actions>
        <ButtonRow>
          <DeleteButton onPress={onDelete} color={theme.colors.onSurface} />
          <CheckButton onPress={onUpdate} color={theme.colors.onSurface} />
        </ButtonRow>
      </SmallDialog.Actions>
    </SmallDialog>
  );
};

const styles = StyleSheet.create({
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
});

export default TagDialog;
