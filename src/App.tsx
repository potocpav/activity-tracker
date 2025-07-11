import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Button,
} from "react-native";
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainPage from "./MainPage";
import LiveView from "./LiveView";
import DeviceModal from "./DeviceConnectionModal";


const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
        {/* <StatusBar
          connectedDevice={bleDevice.connectedDevice}
          onConnectPress={openModal}
          onDisconnectPress={bleDevice.disconnectDevice}
        />
       */}
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Group>
              <Stack.Screen
                name="Main Page"
                component={MainPage}
                options={{title: "Tindeq Analyzer"}}
              />
              <Stack.Screen 
                name="Live View" 
                component={LiveView} 
                options={{title: "Live View"}}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{presentation: 'modal'}}>
              <Stack.Screen 
                name="DeviceModal" 
                component={DeviceModal} 
                />
            </Stack.Group>

{/* Modal: {
      screenOptions: {
        presentation: 'modal',
      },
      screens: {
        MyModal: ModalScreen,
      },
    }, */}
          </Stack.Navigator>

        </NavigationContainer>



        {/* <DeviceModal
          closeModal={hideModal}
          visible={isModalVisible}
          connectToPeripheral={bleDevice.connectToDevice}
          devices={bleDevice.allDevices}
        /> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
});

export default App;
