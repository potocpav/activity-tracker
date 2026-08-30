import React from "react";
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from "react-native";

interface SmallDialogProps {
  visible: boolean;
  onDismiss: () => void;
  theme: any;
  children: React.ReactNode;
}

const SmallDialogBase: React.FC<SmallDialogProps> = ({ visible, onDismiss, theme, children }) => (
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
      <View style={[styles.card, { backgroundColor: theme.colors.elevation.level3 }]}>{children}</View>
    </KeyboardAvoidingView>
  </Modal>
);

const SmallDialogActions = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.actions}>{children}</View>
);

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    maxWidth: 560,
    borderRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    elevation: 24,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    width: "100%",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingBottom: 16,
    paddingTop: 8,
  },
});

const SmallDialog = Object.assign(SmallDialogBase, { Actions: SmallDialogActions });

export default SmallDialog;
export { SmallDialog };
