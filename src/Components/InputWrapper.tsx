import { useEffect, useRef } from "react";
import { View, Text } from "react-native";
import Animated, { useSharedValue, withSequence, withTiming, withRepeat, useAnimatedStyle, FadeIn, FadeOut, FadeInUp, FadeOutUp } from "react-native-reanimated";
import { getTheme } from "../Model/Theme";

type InputWrapperProps = {
  children: React.ReactNode;
  key?: string;
  error?: string | null;
  hint?: string;
  ref?: React.RefObject<InputWrapperRef> | ((el: InputWrapperRef) => void);
}

export type InputWrapperRef = undefined | {
  highlightError: () => void;
}

const TIME = 100;
const OFFSET = 2;

export const InputWrapper = ({ children, key, error, hint, ref }: InputWrapperProps) => {
  const theme = getTheme();
  const offset = useSharedValue<number>(0);
  
  
  if (ref !== undefined) {
    const el = {
      highlightError: () => {
        offset.value = withSequence(
          // start from -OFFSET
          withTiming(-OFFSET, { duration: TIME / 2 }),
          // shake between -OFFSET and OFFSET 5 times
          withRepeat(withTiming(OFFSET, { duration: TIME }), 3, true),
          // go back to 0 at the end
          withTiming(0, { duration: TIME / 2 })
        );
      },
    };
    if (typeof ref === 'function') {
      ref(el);
    } else {
      ref.current = el;
    }
  }



  const animatedRef = useRef<Animated.View>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));


  return (
    <Animated.View key={key} ref={animatedRef} style={[animatedStyle, { flex: 1 }]} >
      <View style={{ flex: 1 }}>
        {children}
        {hint && (
          <Text style={{ fontSize: 12, opacity: 0.6 }}>
          {hint}
        </Text>
        )}
        {error && (
          <Animated.View>
            <Text style={{ fontSize: 12, color: theme.colors.error }}>
              {error}
            </Text>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

export default InputWrapper;