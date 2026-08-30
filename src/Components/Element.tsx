import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { View, Pressable, StyleProp, StyleSheet, Switch as RNSwitch, Text, ViewStyle } from "react-native";
import { useAppTheme } from "../Model/Theme";

// Theme colors are "#RRGGBB"; restate one with an alpha channel appended.
const withAlpha = (color: string, alpha: number): string =>
  color.slice(0, 7) +
  Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");

export const Divider = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const theme = useAppTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: theme.outlineVariant }, style]} />;
};

export const Switch = ({ value, onValueChange }: { value: boolean; onValueChange: (value: boolean) => void }) => {
  const theme = useAppTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      thumbColor={value ? theme.primary : theme.variant === "dark" ? "#bdbdbd" : "#fafafa"}
      trackColor={{
        true: withAlpha(theme.primary, 0.4),
        false: theme.variant === "dark" ? "#616161" : "rgb(178, 175, 177)",
      }}
    />
  );
};

export const RadioButton = ({
  label,
  selected,
  onPress,
  style,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) => {
  const theme = useAppTheme();
  const color = selected ? theme.primary : theme.onSurfaceVariant;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      android_ripple={{ foreground: true }}
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 8,
          paddingHorizontal: 16,
        },
        style,
      ]}
    >
      <Text style={{ flexGrow: 1, flexShrink: 1, fontSize: 16, lineHeight: 24, color: theme.onSurface }}>{label}</Text>
      <View
        style={{
          width: 20,
          height: 20,
          margin: 8,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: color,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />}
      </View>
    </Pressable>
  );
};

export const ButtonRow = ({ children }: { children: React.ReactNode }) => (
  <View style={{ gap: 4, flexDirection: "row", alignItems: "center" }}>{children}</View>
);

export const Button = ({
  onPress,
  onLongPress,
  style,
  children,
}: {
  onPress: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) => (
  <Pressable
    onPress={onPress}
    onLongPress={onLongPress}
    android_ripple={{ foreground: true }}
    style={[
      {
        padding: 10,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        // keeps the ripple inside the rounded shape
        overflow: "hidden",
      },
      style,
    ]}
  >
    {children}
  </Pressable>
);

export const ColorButton = ({ color, onPress }: { color: number; onPress: () => void }) => {
  const theme = useAppTheme(color);
  return (
    <Button onPress={onPress} style={{ padding: 0 }}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: theme.primary,
          borderWidth: 1,
          borderColor: theme.outline,
        }}
      />
    </Button>
  );
};

export const PlusIconButton = ({
  onPress,
  onLongPress,
  color,
}: {
  onPress: () => void;
  onLongPress?: () => void;
  color: string;
}) => (
  <Button onPress={onPress} onLongPress={onLongPress}>
    <PlusIcon color={color} />
  </Button>
);

export const CheckButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <CheckIcon color={color} />
  </Button>
);

export const CheckPlusButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <CheckPlusIcon color={color} />
  </Button>
);

export const DeleteButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <DeleteIcon color={color} />
  </Button>
);

export const CloseButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <CloseIcon color={color} />
  </Button>
);

export const CopyButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <CopyIcon color={color} />
  </Button>
);

export const EditIconButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <EditIcon color={color} />
  </Button>
);

export const DotsIconButton = ({ onPress, color }: { onPress: () => void; color: string }) => (
  <Button onPress={onPress}>
    <DotsIcon color={color} />
  </Button>
);

export const ChevronDownIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="chevron-down" size={23} color={color} />
);

export const DotsIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="dots-vertical" size={24} color={color} />
);

export const CopyIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="content-copy" size={20} color={color} />
);

export const CloseIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="close" size={24} color={color} />
);

export const DeleteIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="delete" size={22} color={color} />
);

export const CheckIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="check" size={23} color={color} />
);

export const BleScaleIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="bluetooth" size={22} color={color} />
);

export const CheckPlusIcon = ({ color }: { color: string }) => (
  <View style={{ position: "relative" }}>
    <MaterialCommunityIcons name="check" size={24} color={color} />
    <View style={{ position: "absolute", right: 0, bottom: 0 }}>
      <MaterialCommunityIcons name="plus-circle" size={12} color={color} />
    </View>
  </View>
);

export const DoubleCheckIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="check" size={23} color={color} />
    <View style={{ position: "absolute", top: 0, left: 5, opacity: 0.5 }}>
      <MaterialCommunityIcons name="check" size={23} color={color} />
    </View>
  </View>
);

export const PlusIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="plus" size={26} color={color} />
  </View>
);

export const EditIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="pencil" size={24} color={color} />
);

export const MinusIcon = ({ color }: { color: string }) => (
  <MaterialCommunityIcons name="minus" size={24} color={color} />
);
