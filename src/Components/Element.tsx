import { Button } from "react-native-paper";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from "react-native";

export const ButtonRow = ({ children }: { children: React.ReactNode }) => (
  <View style={{ gap: 6, flexDirection: 'row', alignItems: 'center' }}>
    {children}
  </View>
);

export const PlusIconButton = ({ onPress, onLongPress, color }: { onPress: () => void, onLongPress?: () => void, color: string }) => (
  <Button compact={true} onPress={onPress} onLongPress={onLongPress}>
    <PlusIcon color={color} />
  </Button>
);

export const CheckButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <CheckIcon color={color} />
  </Button>
);

export const CheckPlusButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <CheckPlusIcon color={color} />
  </Button>
);

export const DeleteButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <DeleteIcon color={color} />
  </Button>
);

export const CloseButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <CloseIcon color={color} />
  </Button>
);

export const CopyButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <CopyIcon color={color} />
  </Button>
);

export const EditIconButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <EditIcon color={color} />
  </Button>
);

export const DotsIconButton = ({ onPress, color }: { onPress: () => void, color: string }) => (
  <Button compact={true} onPress={onPress}>
    <DotsIcon color={color} />
  </Button>
);

export const ChevronDownIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="chevron-down" size={23} color={color} />
  </View>
);

export const DotsIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="dots-vertical" size={24} color={color} />
  </View>
);

export const CopyIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="content-copy" size={20} color={color} />
  </View>
);

export const CloseIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="close" size={24} color={color} />
  </View>
);

export const DeleteIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="delete" size={22} color={color} />
  </View>
);

export const CheckIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="check" size={23} color={color} />
  </View>
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
  <View>
    <MaterialCommunityIcons name="pencil" size={24} color={color} />
  </View>
);

export const MinusIcon = ({ color }: { color: string }) => (
  <View>
    <MaterialCommunityIcons name="minus" size={24} color={color} />
  </View>
);