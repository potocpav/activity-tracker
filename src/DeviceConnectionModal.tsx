import React, { FC, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from 'react-native-paper';
import { Device } from "react-native-ble-plx";
import useStore from "./Store";



type DeviceModalProps = {
  navigation: any;
};

const DeviceModal: FC<DeviceModalProps> = ({ navigation }) => {
  const theme = useTheme();
  const allDevices = useStore((state: any) => state.allDevices);
  const connectToDevice = useStore((state: any) => state.connectToDevice);

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToDevice={connectToDevice}
          navigation={navigation}
        />
      );
    },
    [connectToDevice]
  );

  return (
    <View style={[modalStyle.modalContent, { backgroundColor: theme.colors.surface }]}>
      <Text style={[modalStyle.modalTitleText, { color: theme.colors.onSurface }]}>
        Tap on a device to connect
      </Text>
      <Text style={[modalStyle.instructionText, { color: theme.colors.onSurfaceVariant }]}>
        Make sure the green light is blinking on your Tindeq device.
      </Text>
      <FlatList
        contentContainerStyle={modalStyle.modalFlatlistContiner}
        data={allDevices}
        renderItem={renderDeviceModalListItem}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity onPress={navigation.goBack} style={[modalStyle.closeButton, { backgroundColor: theme.colors.secondary }]}>
        <Text style={[modalStyle.closeButtonText, { color: theme.colors.onSecondary }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
};

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToDevice: (device: Device) => void;
  navigation: any;
};


const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
  const theme = useTheme();
  const { item, connectToDevice, navigation } = props;

  const connectAndCloseModal = useCallback(() => {
    connectToDevice(item.item);
    navigation.goBack();
  }, [navigation, connectToDevice, item.item]);

  return (
    <TouchableOpacity
      onPress={connectAndCloseModal}
      style={[modalStyle.ctaButton, { backgroundColor: theme.colors.primary }]}
    >
      <Text style={[modalStyle.ctaButtonText, { color: theme.colors.onPrimary }]}>
        {item.item.localName ?? item.item.name ?? item.item.id}
      </Text>
    </TouchableOpacity>
  );
};


const modalStyle = StyleSheet.create({
  modalContent: {
    padding: 20,
    // maxHeight: '70%',
    minHeight: '100%',
  },
  modalFlatlistContiner: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  instructionText: {
    fontSize: 14,
    marginBottom: 15,
    textAlign: 'center',
  },
  ctaButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 50,
    marginHorizontal: 10,
    marginBottom: 8,
    borderRadius: 8,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  closeButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    marginTop: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default DeviceModal;
