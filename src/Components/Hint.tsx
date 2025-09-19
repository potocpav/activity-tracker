import { Text, StyleSheet, View } from "react-native";
import { useState } from "react";
import { getTheme } from "../Model/Theme";
import { MD3Theme, Button } from "react-native-paper";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Svg, Path } from "react-native-svg";
import { HintType, hintDependencyChains } from "../Model/StoreTypes";
import useStore from "../Model/Store";
import { useSafeAreaInsets, EdgeInsets } from "react-native-safe-area-context";

const hintInfo = (hint: HintType) => {
  switch (hint) {
    case "hello":
      return {
        text: [
          "Welcome to Activity Tracker! These hints will help you use the app.",
          "You can disable hints in the settings.",
        ],
        arrowPos: 1.0,
      };
    case "add_data_point":
      return {
        text: [
          "Add a data point by clicking the + button above.",
        ],
        arrowPos: 0.7,
      };
    case "calendar_introduction":
      return {
        text: [
          "Calendar allows you to add and edit data for each day.",
        ],
        arrowPos: 0.5,
      };
    case "duplicate_calendar":
      return {
        text: [
          "You can duplicate a calendar by clicking the + button above.",
        ],
        arrowPos: 1.0,
      };
    case "rename_calendar":
      return {
        text: [
          "You can rename or delete a calendar by clicking the calendar name.",
        ],
        arrowPos: 0.0,
      };
    case "quick_check_daily_activity":
      return {
        text: [
          "You can quickly note your daily activity by long-pressing on a day in the calendar.",
        ],
        arrowPos: 1.0,
      };
    case "overview_edit_hint":
      return {
        text: [
          "You can edit overview stats by clicking them.",
          "First stat is shown in the activity list."
        ],
        arrowPos: 0.5,
      };
    case "quickly_add_point":
      return {
        text: [
          "You can quickly add data by clicking the button on the right.",
        ],
        arrowPos: 1.0,
      };
    case "reorder_activities":
      return {
        text: [
          "You can reorder activities by long-pressing and dragging an activity.",
        ],
        arrowPos: 0.5,
      };
    case "edit_activity_introduction":
      return {
        text: [
          "Activities can always be edited later. Don't be afraid to experiment.",
        ],
        arrowPos: 0.2,
      };
    case "activity_value_help":
      return {
        text: [
          "There are three types of measurements:",
          "1. None - no numbers are recorded, just the date. Examples: flossing, went exercising, etc.",
          "2. Single - one number is recorded. Examples: body weight, number of pull-ups, etc.",
          "3. Multiple - performance is measured by multiple numbers. For example, for running - time and distance.",
        ],
        arrowPos: 0.5,
      };
    case "save_data_point":
      return {
        text: [
          "When ready, save the data point (✓), or save and immediately start editing a new one (✓+).",
        ],
        arrowPos: 1.0,
      };
  }
};


const Hint = ({ hint, inline }: { hint: HintType, inline?: boolean }) => {
  const insets = useSafeAreaInsets();
  const theme = getTheme();
  const styles = getStyles(theme, insets);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const showHints = useStore((state: any) => state.showHints);
  const activeHints = useStore((state: any) => state.activeHints);
  const dismissHint = useStore((state: any) => state.dismissHint);

  let nextActiveHints = hintDependencyChains.map((chain: HintType[]) =>
    chain.filter((h: HintType) =>
      activeHints.includes(h)).slice(0, 1))
    .flat(Infinity);
  let showHint = showHints && nextActiveHints.includes(hint);

  const TOP = 10;
  const R = 10;
  const ARROW_W = 10;
  const ARROW_LIM = R * 2;
  const W = width - (ARROW_LIM + ARROW_W) * 2;

  const { text, arrowPos } = hintInfo(hint);

  return (
    showHint && (
      <View style={{ position: 'relative' }}>
        <Animated.View
          entering={FadeIn.delay(500).duration(500)}
          exiting={FadeOut.duration(300)}
          style={[
            styles.hintContainer,
            inline ? {} : { position: 'absolute' }]
          }>

          <View
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            onLayout={(l) => {
              setWidth(l.nativeEvent.layout.width);
              setHeight(l.nativeEvent.layout.height);
            }}
          >
            <Svg style={{ position: 'absolute', top: -TOP, left: 0 }} height={height + TOP} width={width} viewBox={`0 0 ${width} ${height + TOP}`}>
              {/* <Rect x="0" y={TOP} width={width} height={height} rx="10" ry="10"
            stroke={theme.colors.onSurface} strokeWidth="1" fill={theme.colors.primary} /> */}

              <Path
                d={`M0,${TOP + R} A${R},${R} 0 0 1 ${R},${TOP} L${W * arrowPos + ARROW_LIM},${TOP} L${W * arrowPos + ARROW_LIM + ARROW_W},${0} L${W * arrowPos + ARROW_LIM + ARROW_W * 2},${TOP} L${width - R},${TOP} A${R},${R} 0 0 1 ${width},${TOP + R} L${width},${height + TOP - R} A${R},${R} 0 0 1 ${width - R},${height + TOP} L${R},${height + TOP} A${R},${R} 0 0 1 0,${height + TOP - R} Z`}
                fill={theme.colors.primary}
                strokeWidth={1}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <View style={{ padding: 10, gap: 5 }}>
            {text.map((h, i) => (
              <Text style={styles.hintText} key={i}>{h}</Text>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            <Button mode="text" textColor={theme.colors.surface} onPress={() => { dismissHint(hint) }}>Dismiss</Button>
          </View>
        </Animated.View>
      </View>
    )
  );
};

const getStyles = (theme: MD3Theme, insets: EdgeInsets) => StyleSheet.create({
  hintContainer: {
    // backgroundColor: theme.colors.primary,
    padding: 5,
    borderRadius: 10,
    margin: 10,
    elevation: 5,
    left: insets.left,
    right: insets.right,
    zIndex: 1000,
  },
  hintText: {
    color: theme.colors.surface,
  },
});

export default Hint;