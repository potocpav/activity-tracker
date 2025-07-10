import React, { FC, useCallback } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  Modal,
  SafeAreaView,
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Device } from "react-native-ble-plx";

type DeviceModalListItemProps = {
  item: ListRenderItemInfo<Device>;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

type DeviceModalProps = {
  devices: Device[];
  visible: boolean;
  connectToPeripheral: (device: Device) => void;
  closeModal: () => void;
};

const DeviceModalListItem: FC<DeviceModalListItemProps> = (props) => {
  const { item, connectToPeripheral, closeModal } = props;

  const connectAndCloseModal = useCallback(() => {
    connectToPeripheral(item.item);
    closeModal();
  }, [closeModal, connectToPeripheral, item.item]);

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

const DeviceModal: FC<DeviceModalProps> = (props) => {
  const { devices, visible, connectToPeripheral, closeModal } = props;

  const renderDeviceModalListItem = useCallback(
    (item: ListRenderItemInfo<Device>) => {
      return (
        <DeviceModalListItem
          item={item}
          connectToPeripheral={connectToPeripheral}
          closeModal={closeModal}
        />
      );
    },
    [closeModal, connectToPeripheral]
  );

  return (
    <Modal
      style={modalStyle.modalContainer}
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View style={modalStyle.overlay}>
        <View style={modalStyle.modalContent}>
          <Text style={modalStyle.modalTitleText}>
            Tap on a device to connect
          </Text>
          <FlatList
            contentContainerStyle={modalStyle.modalFlatlistContiner}
            data={devices}
            renderItem={renderDeviceModalListItem}
            showsVerticalScrollIndicator={false}
          />
          <TouchableOpacity onPress={closeModal} style={modalStyle.closeButton}>
            <Text style={modalStyle.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '70%',
    minHeight: 300,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
