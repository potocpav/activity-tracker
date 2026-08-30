import { useRef, useImperativeHandle } from "react";
import { View, Text, StyleProp, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  withSequence,
  withTiming,
  withRepeat,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useAppTheme } from "../Model/Theme";

type InputWrapperProps = {
  children: React.ReactNode;
  key?: string;
  error?: string | null;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  ref?: React.RefObject<InputWrapperRef> | ((el: InputWrapperRef) => void);
};

export type InputWrapperRef =
  | undefined
  | {
      highlightError: () => void;
    };

const TIME = 100;
const OFFSET = 2;

export const InputWrapper = ({ children, key, error, hint, containerStyle, ref }: InputWrapperProps) => {
  const theme = useAppTheme();
  const offset = useSharedValue<number>(0);

  useImperativeHandle(
    ref,
    () => ({
      highlightError: () => {
        offset.set(
          withSequence(
            // start from -OFFSET
            withTiming(-OFFSET, { duration: TIME / 2 }),
            // shake between -OFFSET and OFFSET 5 times
            withRepeat(withTiming(OFFSET, { duration: TIME }), 3, true),
            // go back to 0 at the end
            withTiming(0, { duration: TIME / 2 }),
          ),
        );
      },
    }),
    [offset],
  );

  const animatedRef = useRef<Animated.View>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  return (
    <Animated.View key={key} ref={animatedRef} style={[animatedStyle, containerStyle]}>
      {children}
      {hint && <Text style={{ fontSize: 12, opacity: 0.6 }}>{hint}</Text>}
      {error && (
        <Animated.View>
          <Text style={{ fontSize: 12, color: theme.error }}>{error}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
};

export default InputWrapper;
