import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
} from "react-native";
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainPage from "./MainPage";
import LiveView from "./LiveView";
import Goals from "./Goals";
import DeviceModal from "./DeviceConnectionModal";


const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <SafeAreaView style={styles.container}>
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
              <Stack.Screen 
                name="Goals" 
                component={Goals} 
                options={{title: "Goals"}}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{presentation: 'modal'}}>
              <Stack.Screen 
                name="ConnectDevice" 
                component={DeviceModal} 
                options={{title: "Connect to a Device"}}
                />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
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
