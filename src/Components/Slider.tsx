import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAppTheme, Theme, withAlpha } from "../Model/Theme";

// A slider over a discrete range: every step is a tick, and the thumb only ever rests on
// one of them. Tap anywhere on the track to jump there, or drag the thumb.
//
// Dragging only takes over once the finger has moved sideways, so the slider can sit
// inside a vertically scrolling screen without swallowing the scroll.

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;
const TICK_SIZE = 4;
const HEIGHT = 40;
// Above this many steps the ticks are noise rather than a guide, so they are left out.
const MAX_TICKS = 21;

type SliderProps = {
  min: number;
  max: number;
  step?: number;
  // null: nothing chosen yet. The thumb rests at the minimum, and the track stays unfilled.
  value: number | null;
  onChange: (value: number) => void;
  activityColor?: number;
};

export const Slider = ({ min, max, step = 1, value, onChange, activityColor }: SliderProps) => {
  const theme = useAppTheme(activityColor);
  const styles = getStyles(theme);
  const [width, setWidth] = useState(0);

  const steps = step === 0 ? 0 : Math.round((max - min) / step);
  const travel = Math.max(0, width - THUMB_SIZE);
  const chosen = value !== null;
  const clamped = Math.min(max, Math.max(min, value ?? min));
  const fraction = max === min ? 0 : (clamped - min) / (max - min);

  const gesture = useMemo(() => {
    const setFromX = (x: number) => {
      const reachable = Math.max(0, width - THUMB_SIZE);
      const fraction = reachable === 0 ? 0 : Math.min(1, Math.max(0, (x - THUMB_SIZE / 2) / reachable));
      onChange(min + Math.round((fraction * (max - min)) / step) * step);
    };
    return Gesture.Race(
      Gesture.Tap()
        .runOnJS(true)
        .onEnd((e) => setFromX(e.x)),
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-8, 8])
        .onStart((e) => setFromX(e.x))
        .onUpdate((e) => setFromX(e.x)),
    );
  }, [min, max, step, width, onChange]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.container}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityValue={{ min, max, now: clamped }}
      >
        <View style={styles.track}>
          <View style={[styles.activeTrack, { width: chosen ? fraction * travel : 0 }]} />
        </View>
        {steps > 0 &&
          steps <= MAX_TICKS &&
          [...Array(steps + 1).keys()].map((tick) => {
            const covered = chosen && tick / steps <= fraction;
            return (
              <View
                key={tick}
                style={[
                  styles.tick,
                  {
                    left: THUMB_SIZE / 2 - TICK_SIZE / 2 + (tick / steps) * travel,
                    backgroundColor: covered ? withAlpha(theme.onPrimary, 0.7) : theme.outline,
                  },
                ]}
              />
            );
          })}
        <View
          style={[styles.thumb, { left: fraction * travel, backgroundColor: chosen ? theme.primary : theme.outline }]}
        />
      </View>
    </GestureDetector>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      height: HEIGHT,
      justifyContent: "center",
    },
    track: {
      height: TRACK_HEIGHT,
      marginHorizontal: THUMB_SIZE / 2,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: theme.outlineVariant,
    },
    activeTrack: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: theme.primary,
    },
    tick: {
      position: "absolute",
      top: (HEIGHT - TICK_SIZE) / 2,
      width: TICK_SIZE,
      height: TICK_SIZE,
      borderRadius: TICK_SIZE / 2,
    },
    thumb: {
      position: "absolute",
      top: (HEIGHT - THUMB_SIZE) / 2,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      elevation: 2,
    },
  });

export default Slider;
