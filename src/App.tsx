import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from "react-native";
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import MainPage from "./MainPage";
import LiveView from "./LiveView";
import Goals from "./Goals";
import Goal from "./Goal";
import DeviceModal from "./DeviceConnectionModal";
import EditDataPoint from "./EditDataPoint";
import EditGoal from "./EditGoal";
import {
  PaperProvider,
  MD3LightTheme,
  adaptNavigationTheme,
} from 'react-native-paper';

const { LightTheme } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
});

// Add missing fonts property to fix the TypeScript error
const navigationTheme = {
  ...LightTheme,
  fonts: {
    regular: {
      fontFamily: 'System',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'System',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'System',
      fontWeight: '900' as const,
    },
  },
};

const App = () => {
  const Stack = createNativeStackNavigator();

  return (
    <PaperProvider theme={MD3LightTheme}>
      <StatusBar barStyle="dark-content" backgroundColor="#f2f2f2" />
      <SafeAreaView style={styles.container}>
        <NavigationContainer theme={navigationTheme}>
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
              <Stack.Screen 
                name="Goal" 
                component={Goal} 
                options={{title: "Goal Details"}}
                />
            </Stack.Group>
            <Stack.Group screenOptions={{presentation: 'modal'}}>
              <Stack.Screen 
                name="ConnectDevice" 
                component={DeviceModal} 
                options={{title: "Connect to a Device"}}
                />
              <Stack.Screen 
                name="EditDataPoint" 
                component={EditDataPoint} 
                options={{title: "Edit Data Point"}}
                />
              <Stack.Screen 
                name="EditGoal" 
                component={EditGoal} 
                options={{title: "Edit Goal"}}
                />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f2f2f2",
  },
});

export default App;
