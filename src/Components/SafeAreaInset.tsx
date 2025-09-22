import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Inset = ({ type }: { type: "top" | "bottom" }) => {
    const insets = useSafeAreaInsets();
    return <View style={{height: insets[type]}} />;
  };

export default Inset;
export { Inset };
