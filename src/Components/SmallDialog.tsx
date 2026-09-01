import React from "react";
import { KeyboardAvoidingView, Modal, Pressable, StyleSheet, View } from "react-native";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme } from "../Model/Theme";

interface SmallDialogProps {
  visible: boolean;
  onDismiss: () => void;
  theme: any;
  children: React.ReactNode;
}

const SmallDialogBase: React.FC<SmallDialogProps> = ({ visible, onDismiss, theme, children }) => {
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, insets);
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
      {/* <SafeAreaView style={{ flex: 1 }}> */}
      <KeyboardAvoidingView style={styles.centered} behavior="padding" pointerEvents="box-none">
        <View style={[styles.card, { backgroundColor: theme.elevation3 }]}>{children}</View>
      </KeyboardAvoidingView>
      {/* </SafeAreaView> */}
    </Modal>
  );
};

const SmallDialogActions = ({ children }: { children: React.ReactNode }) => (
  <View style={actionsStyles.actions}>{children}</View>
);

const getStyles = (theme: Theme, insets: EdgeInsets) => StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: insets.top + 24,
    paddingBottom: insets.bottom + 24,
    paddingLeft: insets.left + 24,
    paddingRight: insets.right + 24,
  },
  card: {
    maxWidth: 560,
    maxHeight: "80%",
    borderRadius: 28,
    padding: 24,
    paddingBottom: 16,
    elevation: 24,
    width: "100%",
  },
});

const actionsStyles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingTop: 8,
  },
});

const SmallDialog = Object.assign(SmallDialogBase, { Actions: SmallDialogActions });

export default SmallDialog;
export { SmallDialog };
