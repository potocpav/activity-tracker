import React, { useState } from "react";
import { TextInput } from "react-native-paper";
import ColorPicker from "./ColorPicker";
import Dialog from "./Dialog";
import InputWrapper, { InputWrapperRef } from "./InputWrapper";
import { ButtonRow, CheckButton, ColorButton, DeleteButton } from "./Element";

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
    <Dialog visible={visible} onDismiss={onDismiss} theme={theme}>
      <Dialog.Content>
        <InputWrapper error={nameError} ref={nameInputRef}>
          <TextInput label="Tag Name" defaultValue={nameInput} onChangeText={onChangeName} mode="outlined" />
        </InputWrapper>
        <ColorButton color={color} onPress={() => setColorPickerVisible(true)} />
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
      </Dialog.Content>
      <Dialog.Actions>
        <ButtonRow>
          <DeleteButton onPress={onDelete} color={theme.colors.onSurface} />
          <CheckButton onPress={onUpdate} color={theme.colors.onSurface} />
        </ButtonRow>
      </Dialog.Actions>
    </Dialog>
  );
};

export default TagDialog;
