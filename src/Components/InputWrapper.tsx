import { useRef } from "react";
import { View, Text } from "react-native";
import Animated, { useSharedValue, withSequence, withTiming, withRepeat, useAnimatedStyle } from "react-native-reanimated";

type InputWrapperProps = {
  children: React.ReactNode;
  key?: string;
  error?: string | null;
  hint?: string;
  ref?: React.RefObject<{ highlightError: () => void } | undefined>;
}

const offset = useSharedValue<number>(0);
const TIME = 250;
const OFFSET = 4;

export const InputWrapper = ({ children, key, error, hint, ref }: InputWrapperProps) => {
  if (ref !== undefined) {
    ref.current = {
      highlightError: () => {
        offset.value = withSequence(
          // start from -OFFSET
          withTiming(-OFFSET, { duration: TIME / 2 }),
          // shake between -OFFSET and OFFSET 5 times
          withRepeat(withTiming(OFFSET, { duration: TIME }), 5, true),
          // go back to 0 at the end
          withTiming(0, { duration: TIME / 2 })
        );
      },
    };
  }

  const animatedRef = useRef<Animated.View>(null);
  

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));


  return (
    <Animated.View key={key} ref={animatedRef} style={animatedStyle} >
      <View style={{ marginHorizontal: 16 }}>
        {children}
        {hint && (
          <Text style={{ fontSize: 12, opacity: 0.6 }}>
          {hint}
        </Text>
        )}
        {error && (
          <Text style={{ fontSize: 12, color: "red" }}>
            {error}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

export default InputWrapper;