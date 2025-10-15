import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { View, Pressable } from "react-native";

export const ButtonRow = ({ children }: { children: React.ReactNode }) => (
  <View style={{ gap: 4, flexDirection: 'row', alignItems: 'center' }}>
    {children}
  </View>
);

export const Button = ({ onPress, onLongPress, children }: { onPress: () => void, onLongPress?: () => void, children: React.ReactNode }) => (
  <Pressable onPress={onPress} onLongPress={onLongPress} android_ripple={{ foreground: true }} style={{
      padding: 10,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    }}>
    {({ pressed }) => (
      <>
        {pressed && <View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          borderRadius: 20, 
          backgroundColor: 'rgba(128, 128, 128, 0.2)' 
          }} />}
        {children}
      </>
    )}
  </Pressable>
);

export const PlusIconButton = ({ onPress, onLongPress, color }: { onPress: () => void, onLongPress?: () => void, color: string }) => (
  <Button onPress={onPress} onLongPress={onLongPress}>
    <PlusIcon color={color} />
  </Button>
);

export const CheckButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button onPress={onPress}>
    <CheckIcon color={color} />
  </Button>
);

export const CheckPlusButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button onPress={onPress}>
    <CheckPlusIcon color={color} />
  </Button>
);

export const DeleteButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button onPress={onPress}>
    <DeleteIcon color={color} />
  </Button>
);

export const CloseButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button onPress={onPress}>
    <CloseIcon color={color} />
  </Button>
);

export const CopyButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button onPress={onPress}>
    <CopyIcon color={color} />
  </Button>
);

export const EditIconButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button onPress={onPress}>
    <EditIcon color={color} />
  </Button>
);

export const DotsIconButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
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
  <View style={{ position: 'relative' }}>
    <MaterialCommunityIcons name="check" size={24} color={color} />
    <View style={{ position: 'absolute', right: 0, bottom: 0 }}>
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