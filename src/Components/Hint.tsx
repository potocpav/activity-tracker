import { Text, StyleSheet, View, useWindowDimensions } from "react-native";
import { useEffect, useRef, useLayoutEffect, useState } from "react";
import { getTheme } from "../Theme";
import { MD3Theme, Button } from "react-native-paper";
import Animated, { FadeIn, measure } from "react-native-reanimated";
import { Svg, Rect, Circle, Path } from "react-native-svg";
import { HintType } from "../StoreTypes";
import useStore from "../Store";


const Hint = ({ hint, arrowPos }: { hint: HintType, arrowPos: number }) => {
  const theme = getTheme();
  const styles = getStyles(theme);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const showHint = useStore((state: any) => state.showHints && state.activeHints.includes(hint));
  const dismissHint = useStore((state: any) => state.dismissHint);

  const TOP = 10;
  const R = 10;
  const ARROW_W = 10;
  const ARROW_LIM = R * 2;
  const W = width - (ARROW_LIM + ARROW_W) * 2;

  let hintText;
  switch (hint) {
    case "add_data_point":
      hintText = [
        "Add a data point by clicking the + button above.",
      ];
      break;
  }

  return (
    showHint && (
    <Animated.View
      entering={FadeIn.delay(1000).duration(500)}
      style={[
        styles.hintContainer
      ]}>
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
      <View style={{padding: 10}}>
      {hintText.map((h, i) => (
        <Text key={i} style={styles.hintText}>{i === 0 ? (<Text style={{ fontWeight: 'bold' }}>Hint:</Text>) : ""} {h}</Text>
      ))}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', opacity: 0.7 }}>
      <Button mode="contained" onPress={() => {dismissHint(hint)}}>Dismiss</Button>
      </View>
    </Animated.View>
    )
  );
};

const getStyles = (theme: MD3Theme) => StyleSheet.create({
  hintContainer: {
    // backgroundColor: theme.colors.primary,
    padding: 5,
    borderRadius: 10,
    margin: 10,
    elevation: 5,
    gap: 5,
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  hintText: {
    color: theme.colors.surface,
  },
});

export default Hint;