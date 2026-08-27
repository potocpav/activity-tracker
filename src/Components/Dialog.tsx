import React from "react";
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from "react-native";

// Plain react-native replacement for react-native-paper's <Dialog>, covering the
// subset of the API this app uses. A Modal with a see-through backdrop, a full-screen
// Pressable behind the card to dismiss on an outside tap, and the card centered on top.
// The KeyboardAvoidingView lives here because the screen's own one does not reach into
// the Modal's separate native window.

interface DialogProps {
  visible: boolean;
  onDismiss: () => void;
  theme: any;
  children: React.ReactNode;
}

const DialogBase: React.FC<DialogProps> = ({ visible, onDismiss, theme, children }) => (
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

const DialogContent = ({ children }: { children: React.ReactNode }) => <View style={styles.content}>{children}</View>;

const DialogActions = ({ children }: { children: React.ReactNode }) => <View style={styles.actions}>{children}</View>;

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

const Dialog = Object.assign(DialogBase, { Content: DialogContent, Actions: DialogActions });

export default Dialog;
export { Dialog };
