import React from "react";
import { StyleSheet, View } from "react-native";
import SmallDialog from "./SmallDialog";
import { ButtonRow, CheckButton, CopyButton, DeleteButton } from "./Element";
import TextField from "./TextField";

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
  <SmallDialog visible={visible} onDismiss={onDismiss} theme={theme}>
    <TextField label={label} defaultValue={nameInput} onChangeText={onChangeName} />
    <SmallDialog.Actions>
      <ButtonRow>
        {onDelete !== undefined && <DeleteButton onPress={onDelete} color={theme.onSurface} />}
        <CopyButton onPress={onClone} color={theme.onSurface} />
        <CheckButton onPress={onConfirm} color={theme.onSurface} />
      </ButtonRow>
    </SmallDialog.Actions>
  </SmallDialog>
);

export default RenameDialog;
