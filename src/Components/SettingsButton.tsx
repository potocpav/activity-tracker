import React from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { isDragging, useDragUnlockGesture, useSocketStyle } from "./DragUnlockOverlay";
import { useAppTheme } from "../Model/Theme";

const ICON_SIZE = 24;
// Matches the padding of `Button`, so the settings button lines up with its neighbours
const BUTTON_SIZE = ICON_SIZE + 2 * 10;

/**
 * The cog button of the activity list. Tapping it opens the settings; dragging it down
 * pulls a lock icon out of it and across the screen, unlocking the locked activities
 * (or locking them again) when it is dragged far enough. `DragUnlockOverlay` draws the
 * drag itself.
 */
const SettingsButton = ({
  onPress,
  onDragDown,
  color,
}: {
  onPress: () => void;
  /** Called when the button is dragged far enough down. Dragging is off when omitted. */
  onDragDown?: () => void;
  color: string;
}) => {
  const theme = useAppTheme();
  const gesture = useDragUnlockGesture(onDragDown);
  const socketStyle = useSocketStyle();

  return (
    <GestureDetector gesture={gesture}>
      <Pressable
        // The drag ends on the same touch a press would; the pressable is cancelled
        // when the drag takes over, and this keeps a stray press out too.
        onPress={() => !isDragging() && onPress()}
        accessibilityRole="button"
        accessibilityLabel="Settings"
        accessibilityHint={onDragDown !== undefined ? "Drag down to unlock activities" : undefined}
        android_ripple={{ foreground: true, color: theme.elevation3 }}
        style={{
          width: BUTTON_SIZE,
          height: BUTTON_SIZE,
          borderRadius: BUTTON_SIZE / 2,
          alignItems: "center",
          justifyContent: "center",
          // keeps the ripple inside the rounded shape
          overflow: "hidden",
        }}
      >
        <Animated.View style={socketStyle}>
          <MaterialCommunityIcons name="cog" size={ICON_SIZE} color={color} />
        </Animated.View>
      </Pressable>
    </GestureDetector>
  );
};

export default SettingsButton;
