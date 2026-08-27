import React from "react";
import { View } from "react-native";
import { TextInput } from "react-native-paper";
import Dialog from "./Dialog";
import { ButtonRow, CheckButton, CopyButton, DeleteButton } from "./Element";

// Shared "rename this thing" dialog behind the graph and calendar headers: a name
// field plus delete / clone / confirm. Delete is hidden when onDelete is omitted,
// which is how the callers keep the last graph or calendar from being removed.

interface RenameDialogProps {
  visible: boolean;
  onDismiss: () => void;
  label: string;
  nameInput: string;
  onChangeName: (name: string) => void;
  onDelete?: () => void;
  onClone: () => void;
  onConfirm: () => void;
  theme: any;
}

const RenameDialog: React.FC<RenameDialogProps> = ({
  visible,
  onDismiss,
  label,
  nameInput,
  onChangeName,
  onDelete,
  onClone,
  onConfirm,
  theme,
}) => (
  <Dialog visible={visible} onDismiss={onDismiss} theme={theme}>
    <Dialog.Content>
      <View style={{ flex: 1 }}>
        <TextInput label={label} defaultValue={nameInput} onChangeText={onChangeName} mode="outlined" />
      </View>
    </Dialog.Content>
    <Dialog.Actions>
      <ButtonRow>
        {onDelete !== undefined && <DeleteButton onPress={onDelete} color={theme.colors.onSurface} />}
        <CopyButton onPress={onClone} color={theme.colors.onSurface} />
        <CheckButton onPress={onConfirm} color={theme.colors.onSurface} />
      </ButtonRow>
    </Dialog.Actions>
  </Dialog>
);

export default RenameDialog;
