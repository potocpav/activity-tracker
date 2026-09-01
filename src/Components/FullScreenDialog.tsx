import React from "react";
import { KeyboardAvoidingView, Modal, StyleSheet, Text, View } from "react-native";
import { EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme, Theme } from "../Model/Theme";
import { Button } from "./Element";

// Full-screen modal with a colored header: a back button, a title, and an optional
// action on the right (confirm, clear, ...). The children fill the rest of the screen.
// Used by GradeSelection and by UnitView's unit picker.
//
// A Modal renders in a native view tree of its own, outside the app's gesture root, so it
// brings its own: without it, gesture-handler widgets among the children (the rating
// slider and stars, say) never see a touch.

type FullScreenDialogProps = {
  visible: boolean;
  title: string;
  activityColor?: number;
  headerRight?: React.ReactNode;
  onDismiss: () => void;
  children: React.ReactNode;
};

const FullScreenDialog = ({
  visible,
  title,
  activityColor,
  headerRight,
  onDismiss,
  children,
}: FullScreenDialogProps) => {
  const theme = useAppTheme(activityColor);
  const insets = useSafeAreaInsets();
  const styles = getStyles(theme, insets);

  return (
    <Modal
      transparent={false}
      backdropColor={theme.surface}
      onRequestClose={onDismiss}
      animationType="fade"
      visible={visible}
      onDismiss={onDismiss}
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
    >
      <GestureHandlerRootView style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={-20}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Button onPress={onDismiss}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.onHeader} />
              </Button>
              <View style={styles.titleContainer}>
                <Text style={styles.title}>{title}</Text>
              </View>
              {headerRight}
            </View>
          </View>
          <View style={styles.content}>{children}</View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const getStyles = (theme: Theme, insets: EdgeInsets) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      backgroundColor: theme.header,
      flexDirection: "row",
      paddingTop: insets.top,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      elevation: 2,
      zIndex: 100,
    },
    headerContent: {
      flex: 1,
      flexDirection: "row",
      paddingVertical: 6,
      paddingLeft: 6,
      paddingRight: 16,
      alignItems: "center",
      gap: 15,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 20,
      color: theme.onHeader,
    },
    content: {
      flex: 1,
      paddingLeft: insets.left,
      paddingRight: insets.right,
      paddingBottom: insets.bottom,
    },
  });

export default FullScreenDialog;
