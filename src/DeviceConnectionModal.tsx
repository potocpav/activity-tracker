import React, { FC, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";
import useBle from "./Ble";



type DeviceModalProps = {
  navigation: any;
  route: any;
};

const DeviceModal: FC<DeviceModalProps> = ({navigation, route}) => {
  const allDevices = useBle((state: any) => state.allDevices);
  const connectToDevice = useBle((state: any) => state.connectToDevice);

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
    <View style={modalStyle.modalContent}>
      <Text style={modalStyle.modalTitleText}>
        Tap on a device to connect
      </Text>
      <Text style={modalStyle.instructionText}>
        Make sure the green light is blinking on your Tindeq device.
      </Text>
      <FlatList
        contentContainerStyle={modalStyle.modalFlatlistContiner}
        data={allDevices}
        renderItem={renderDeviceModalListItem}
        showsVerticalScrollIndicator={false}
      />
      <TouchableOpacity onPress={navigation.goBack} style={modalStyle.closeButton}>
        <Text style={modalStyle.closeButtonText}>Cancel</Text>
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
  const { item, connectToDevice, navigation } = props;

  const connectAndCloseModal = useCallback(() => {
    connectToDevice(item.item);
    navigation.goBack();
  }, [navigation, connectToDevice, item.item]);

  return (
    <TouchableOpacity
      onPress={connectAndCloseModal}
      style={modalStyle.ctaButton}
    >
      <Text style={modalStyle.ctaButtonText}>
        {item.item.localName ?? item.item.name ?? item.item.id}
      </Text>
    </TouchableOpacity>
  );
};


const modalStyle = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    // maxHeight: '70%',
    minHeight: '100%',
  },
  modalFlatlistContiner: {
    flexGrow: 1,
    paddingVertical: 10,
  },
  modalCellOutline: {
    borderWidth: 1,
    borderColor: "black",
    alignItems: "center",
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
  },
  modalTitleText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: '#333333',
  },
  instructionText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    textAlign: 'center',
  },
  ctaButton: {
    backgroundColor: "#FF6060",
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
    color: "white",
  },
  closeButton: {
    backgroundColor: '#6c757d',
    justifyContent: "center",
    alignItems: "center",
    height: 44,
    marginTop: 10,
    borderRadius: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});

export default DeviceModal;
