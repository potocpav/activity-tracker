import { useMemo, useState } from "react";
import { View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAppTheme } from "../Model/Theme";

// A row of stars, each one filled, half filled or empty. Tap a star to rate up to it, or
// drag along the row; the very left of the row rates no stars at all. With `halfStars`,
// the left half of a star gives the half rating.
//
// The stars share the width they are given, shrinking when there are many of them, so a
// row of ten still fits on a phone.

const GAP = 6;
const MAX_SLOT = 44;
// The strip at the very left, as a fraction of a star's slot, that rates zero stars: a
// drag can run the rating all the way down, while a tap on a star still gives that star.
const ZERO_ZONE = 0.25;

type StarRatingProps = {
  stars: number;
  halfStars: boolean;
  // null: no rating, which is not the same as a rating of zero stars.
  value: number | null;
  onChange: (value: number) => void;
  activityColor?: number;
};

export const StarRating = ({ stars, halfStars, value, onChange, activityColor }: StarRatingProps) => {
  const theme = useAppTheme(activityColor);
  const [width, setWidth] = useState(0);

  const slot = Math.min(MAX_SLOT, width / stars);
  const size = slot - GAP;
  const rating = value === null ? 0 : Math.min(stars, Math.max(0, value));
  // Zero stars and no rating draw the same empty row, so the stars of an unrated row are
  // dimmer than the ones of a row rated zero.
  const emptyColor = value === null ? theme.outlineVariant : theme.outline;

  const gesture = useMemo(() => {
    const setFromX = (x: number) => {
      const slot = Math.min(MAX_SLOT, width / stars);
      if (slot <= 0) {
        return;
      }
      if (x < slot * ZERO_ZONE) {
        onChange(0);
        return;
      }
      const star = Math.floor(x / slot);
      const inLeftHalf = x - star * slot < slot / 2;
      const rating = halfStars && inLeftHalf ? star + 0.5 : star + 1;
      onChange(Math.min(stars, Math.max(0, rating)));
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
  }, [stars, halfStars, width, onChange]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{ flexDirection: "row", alignItems: "center", height: MAX_SLOT }}
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        accessibilityRole="adjustable"
        accessibilityValue={{ min: 0, max: stars, now: rating }}
      >
        {width > 0 &&
          [...Array(stars).keys()].map((star) => (
            <View key={star} style={{ width: slot, alignItems: "center" }}>
              <MaterialCommunityIcons
                name={rating >= star + 1 ? "star" : rating >= star + 0.5 ? "star-half-full" : "star-outline"}
                size={size}
                color={rating >= star + 0.5 ? theme.primary : emptyColor}
              />
            </View>
          ))}
      </View>
    </GestureDetector>
  );
};

export default StarRating;
