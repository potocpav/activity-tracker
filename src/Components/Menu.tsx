import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  useWindowDimensions,
} from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme, useThemeVariant } from "../Model/Theme";

// Drop-in replacement for react-native-paper's <Menu> / <Menu.Item>, covering the
// subset of the API this app uses. A Modal holds the popup, the anchor is measured
// in window coordinates, and the popup is placed against it with screen-edge flipping.

const SCREEN_MARGIN = 8;
const MIN_WIDTH = 200;
const MAX_WIDTH = 320;
const ITEM_HEIGHT = 48;

type Rect = { x: number; y: number; width: number; height: number };
type Position = { top: number; left?: number; right?: number };

interface MenuItemProps {
  onPress?: () => void;
  title: React.ReactNode;
  leadingIcon?: string;
  trailingIcon?: string;
  titleStyle?: StyleProp<TextStyle>;
  disabled?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ onPress, title, leadingIcon, trailingIcon, titleStyle, disabled }) => {
  const theme = useAppTheme();
  const contentColor = disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurfaceVariant;
  return (
    <Pressable onPress={onPress} disabled={disabled} android_ripple={{ foreground: true }} style={styles.item}>
      {({ pressed }) => (
        <>
          {pressed && <View style={styles.pressedOverlay} />}
          {leadingIcon !== undefined && (
            <MaterialCommunityIcons name={leadingIcon as any} size={24} color={contentColor} />
          )}
          <View style={styles.itemTitle}>
            {typeof title === "string" || typeof title === "number" ? (
              <Text
                numberOfLines={1}
                style={[
                  { fontSize: 16, color: disabled ? theme.colors.onSurfaceDisabled : theme.colors.onSurface },
                  titleStyle,
                ]}
              >
                {title}
              </Text>
            ) : (
              title
            )}
          </View>
          {trailingIcon !== undefined && (
            <MaterialCommunityIcons name={trailingIcon as any} size={24} color={contentColor} />
          )}
        </>
      )}
    </Pressable>
  );
};

interface MenuProps {
  visible: boolean;
  onDismiss: () => void;
  anchor: React.ReactNode;
  children: React.ReactNode;
}

const MenuBase: React.FC<MenuProps> = ({ visible, onDismiss, anchor, children }) => {
  const theme = useAppTheme();
  const themeVariant = useThemeVariant();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [anchorRect, setAnchorRect] = useState<Rect | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const appear = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setAnchorRect(null);
      setPosition(null);
      appear.setValue(0);
      return;
    }
    anchorRef.current?.measureInWindow((x, y, width, height) => setAnchorRect({ x, y, width, height }));
  }, [visible]);

  useEffect(() => {
    if (position !== null) {
      Animated.timing(appear, { toValue: 1, duration: 120, useNativeDriver: true }).start();
    }
  }, [position]);

  const maxHeight = screenHeight - insets.top - insets.bottom - 2 * SCREEN_MARGIN;

  // Placed once per opening, from the first measured size, so the popup does not
  // drift when its content changes while open (e.g. tag icons toggling on/off).
  const onMenuLayout = (event: LayoutChangeEvent) => {
    if (anchorRect === null || position !== null) return;
    const { width, height } = event.nativeEvent.layout;

    const topLimit = insets.top + SCREEN_MARGIN;
    const bottomLimit = screenHeight - insets.bottom - SCREEN_MARGIN;
    let top = anchorRect.y + anchorRect.height;
    if (top + height > bottomLimit) top = anchorRect.y - height;
    top = Math.max(topLimit, Math.min(top, bottomLimit - height));

    const leftLimit = insets.left + SCREEN_MARGIN;
    const rightLimit = screenWidth - insets.right - SCREEN_MARGIN;
    if (anchorRect.x + width <= rightLimit) {
      setPosition({ top, left: Math.max(leftLimit, anchorRect.x) });
    } else {
      // Pin the popup's right edge to the anchor's right edge instead.
      const right = screenWidth - (anchorRect.x + anchorRect.width);
      setPosition({
        top,
        right: Math.max(insets.right + SCREEN_MARGIN, Math.min(right, screenWidth - leftLimit - width)),
      });
    }
  };

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        {anchor}
      </View>
      <Modal
        backdropColor={"rgba(0, 0, 0, 0.0)"}
        visible={visible}
        onRequestClose={onDismiss}
        statusBarTranslucent
        navigationBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        {anchorRect !== null && (
          <Animated.View
            onLayout={onMenuLayout}
            style={[
              styles.shadow,
              {
                backgroundColor: theme.colors.elevation.level2,
                maxHeight,
                top: position?.top ?? 0,
                left: position?.left,
                right: position?.right,
                opacity: appear,
                transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }],
              },
            ]}
          >
            <View style={styles.surface}>
              <ScrollView bounces={false} contentContainerStyle={styles.content}>
                {children}
              </ScrollView>
            </View>
          </Animated.View>
        )}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  shadow: {
    position: "absolute",
    minWidth: MIN_WIDTH,
    maxWidth: MAX_WIDTH,
    borderRadius: 4,
    elevation: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  surface: {
    borderRadius: 4,
    overflow: "hidden",
  },
  content: {
    paddingVertical: 8,
  },
  item: {
    minHeight: ITEM_HEIGHT,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  itemTitle: {
    flex: 1,
    justifyContent: "center",
  },
  pressedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(128, 128, 128, 0.2)",
  },
});

const Menu = Object.assign(MenuBase, { Item: MenuItem });

export default Menu;
export { Menu, MenuItem };
