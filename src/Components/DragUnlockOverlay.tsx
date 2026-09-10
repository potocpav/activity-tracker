import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  interpolateColor,
  makeMutable,
  useAnimatedReaction,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useAppTheme, withAlpha } from "../Model/Theme";
import { useAuthenticated } from "../Model/useAuthenticated";

/** Finger travel, in pixels, that completes the drag */
const DRAG_DISTANCE = 170;
const CHIP_SIZE = 48;
const RING_SIZE = 76;
const ICON_SIZE = 26;
/** Where the icon rests before the drag: just above the top edge of the screen */
const CHIP_START_Y = -CHIP_SIZE / 2;
/**
 * The target ring, one drag length below the icon's start, so the pull maps roughly
 * one to one overall even though the icon eases into it.
 */
const RING_Y = CHIP_START_Y + DRAG_DISTANCE;
/**
 * How sharply the icon eases into the ring. The icon covers `1 - e^-FOLLOW` of the way
 * there over a full drag, leaving it a few pixels short of the centre; pulling further
 * closes the rest of the gap without ever quite crossing it.
 */
const FOLLOW = 3;
// The overlay dims the screen while dragging, so its own content is always drawn
// against a dark backdrop, whatever the theme is.
const ON_SCRIM = "#FFFFFF";

const RETURN_SPRING = { damping: 18, stiffness: 220 };
const BURST_EASING = Easing.out(Easing.quad);

/**
 * The state of the unlock drag, shared between the button that starts it and the
 * overlay that draws it. Module level, like the authentication flag itself: only one
 * drag can be in flight, and the two sides live in different parts of the tree.
 *
 * The icon only ever moves down the middle of the screen, so a single vertical
 * position, in overlay coordinates, describes the whole drag.
 */
const drag = {
  /** Centre of the dragged icon, measured from the top of the overlay */
  y: makeMutable(CHIP_START_Y),
  /** 0 while the drag is too short to trigger, 1 once it is far enough */
  progress: makeMutable(0),
  /** Fades the overlay in for the duration of the drag */
  visible: makeMutable(0),
  /** A ring expanding out of the drop point, run once per completed drag */
  burst: makeMutable(1),
  /** Whether a finger is on the button; drives the icon the overlay picks */
  touching: makeMutable(false),
  /** Whether the drag itself is in progress, as opposed to a plain press */
  active: makeMutable(false),
};

/**
 * Where the icon sits after the finger has travelled `translationY` down the screen:
 * out of the top edge quickly at first, then slower and slower as it nears the ring,
 * which it approaches without reaching.
 */
const chipY = (translationY: number) => {
  "worklet";
  const pulled = Math.max(0, translationY);
  return CHIP_START_Y + (RING_Y - CHIP_START_Y) * (1 - Math.exp((-FOLLOW * pulled) / DRAG_DISTANCE));
};

/** Whether a drag is on screen, including the moment it is released. */
export const isDragging = () => drag.visible.value > 0;

/** Dims the settings button while the lock it pulls out is on screen. */
export const useSocketStyle = () =>
  useAnimatedStyle(() => ({
    opacity: interpolate(drag.visible.value, [0, 1], [1, 0.3]),
    transform: [{ scale: interpolate(drag.visible.value, [0, 1], [1, 0.85]) }],
  }));

/**
 * The gesture that pulls the lock icon down from the top of the screen, calling
 * `onDragDown` if it is released past `DRAG_DISTANCE`. Dragging is off when
 * `onDragDown` is omitted.
 *
 * Only the vertical travel counts: the icon stays centred horizontally, and it trails
 * the finger rather than tracking it, easing into the target ring.
 */
export const useDragUnlockGesture = (onDragDown?: () => void) =>
  useMemo(
    () =>
      Gesture.Pan()
        .enabled(onDragDown !== undefined)
        // Only a downward drag: everything else is left to the button and the header
        .activeOffsetY(8)
        .failOffsetY(-8)
        .failOffsetX([-16, 16])
        .onBegin(() => {
          drag.touching.set(true);
        })
        .onStart((e) => {
          drag.active.set(true);
          drag.y.set(chipY(e.translationY));
          drag.progress.set(Math.max(0, Math.min(1, e.translationY / DRAG_DISTANCE)));
          drag.burst.set(1);
          drag.visible.set(withTiming(1, { duration: 120 }));
        })
        .onUpdate((e) => {
          drag.y.set(chipY(e.translationY));
          drag.progress.set(Math.max(0, Math.min(1, e.translationY / DRAG_DISTANCE)));
        })
        .onFinalize(() => {
          drag.touching.set(false);
          if (!drag.active.value) {
            // A press, or a gesture that never got going: nothing to wind back
            return;
          }
          drag.active.set(false);
          if (drag.progress.value >= 1) {
            if (onDragDown !== undefined) {
              scheduleOnRN(onDragDown);
            }
            drag.burst.set(0);
            drag.burst.set(withTiming(1, { duration: 450, easing: BURST_EASING }));
            drag.visible.set(withTiming(0, { duration: 260 }));
          } else {
            // Dropped short: the icon slides back up out of the screen
            drag.y.set(withSpring(CHIP_START_Y, RETURN_SPRING));
            drag.progress.set(withTiming(0, { duration: 200 }));
            drag.visible.set(withTiming(0, { duration: 200 }));
          }
        }),
    [onDragDown],
  );

/**
 * Draws the unlock drag: the dragged icon, the ring marking how far it has to go, and
 * the scrim over the app behind it.
 *
 * Mounted once, above the navigator, so the icon can be pulled out of the top of the
 * screen and over the header. It never takes touches, and stays invisible until a drag
 * starts.
 */
const DragUnlockOverlay = () => {
  const theme = useAppTheme();
  const authenticated = useAuthenticated();

  // The drag either locks or unlocks, and says so with the icon it carries. Picked
  // when the finger lands, so completing the drag does not swap the icon out from
  // under the animation that follows.
  const [touching, setTouching] = useState(false);
  const [icon, setIcon] = useState<"lock" | "lock-open-variant">("lock-open-variant");
  useAnimatedReaction(
    () => drag.touching.value,
    (isTouching, previous) => {
      if (isTouching !== previous) {
        scheduleOnRN(setTouching, isTouching);
      }
    },
  );
  useEffect(() => {
    if (touching) {
      setIcon(authenticated ? "lock" : "lock-open-variant");
    }
    // Deliberately not run on `authenticated`: the icon is frozen for the whole drag
  }, [touching]);

  // Worklets cannot call back into `withAlpha`, so the colors it derives are mixed
  // here and only the finished strings are closed over.
  const ringIdleColor = withAlpha(ON_SCRIM, 0.5);
  const ringFill = withAlpha(theme.primary, 0.25);
  const ringFillClear = withAlpha(theme.primary, 0);

  const scrimStyle = useAnimatedStyle(() => ({
    opacity: drag.visible.value * interpolate(drag.progress.value, [0, 1], [0.25, 0.55]),
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: drag.visible.value * interpolate(drag.progress.value, [0, 0.15], [0, 1], Extrapolation.CLAMP),
    borderColor: interpolateColor(drag.progress.value, [0.85, 1], [ringIdleColor, theme.primary]),
    backgroundColor: interpolateColor(drag.progress.value, [0.85, 1], [ringFillClear, ringFill]),
    transform: [{ scale: interpolate(drag.progress.value, [0, 1], [0.8, 1], Extrapolation.CLAMP) }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: drag.visible.value * interpolate(drag.progress.value, [0.85, 1], [0, 1], Extrapolation.CLAMP),
  }));

  const chipStyle = useAnimatedStyle(() => ({
    opacity: drag.visible.value,
    backgroundColor: interpolateColor(drag.progress.value, [0.85, 1], [theme.surface, theme.primary]),
    transform: [
      { translateY: drag.y.value },
      { scale: interpolate(drag.progress.value, [0, 1], [0.85, 1.2], Extrapolation.CLAMP) },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(drag.progress.value, [0.85, 1], [theme.onSurface, theme.onPrimary]),
  }));

  const burstStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drag.burst.value, [0, 1], [0.7, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: drag.y.value },
      { scale: interpolate(drag.burst.value, [0, 1], [0.8, 2.6], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <View pointerEvents="none" importantForAccessibility="no-hide-descendants" style={styles.overlay}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000000" }, scrimStyle]} />
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={[styles.burst, { borderColor: theme.primary }, burstStyle]} />
      <Animated.View style={[styles.label, labelStyle]}>
        <Text style={{ color: ON_SCRIM, fontSize: 15 }}>
          {icon === "lock" ? "Release to lock" : "Release to unlock"}
        </Text>
      </Animated.View>
      <Animated.View style={[styles.chip, { borderColor: theme.outlineVariant }, chipStyle]}>
        <AnimatedIcon name={icon} size={ICON_SIZE} style={iconStyle} />
      </Animated.View>
    </View>
  );
};

const AnimatedIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Above the navigator, and above the elevation of the native header with it
    elevation: 1000,
    zIndex: 1000,
  },
  ring: {
    position: "absolute",
    // Centred on the screen, at a fixed height: the icon comes to it, not the reverse
    left: "50%",
    marginLeft: -RING_SIZE / 2,
    top: RING_Y - RING_SIZE / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  burst: {
    position: "absolute",
    left: "50%",
    marginLeft: -RING_SIZE / 2,
    // `translateY` then places the centre, not the top edge
    top: -RING_SIZE / 2,
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 2,
  },
  label: {
    position: "absolute",
    left: 0,
    right: 0,
    top: RING_Y + RING_SIZE / 2 + 12,
    alignItems: "center",
  },
  chip: {
    position: "absolute",
    left: "50%",
    marginLeft: -CHIP_SIZE / 2,
    top: -CHIP_SIZE / 2,
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: CHIP_SIZE / 2,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
  },
});

export default DragUnlockOverlay;
