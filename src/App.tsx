import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from "react-native";
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { Button } from "react-native-paper";
import MainPage from "./MainPage";
import LiveView from "./LiveView";
import Goals from "./Goals";
import Goal from "./Goal";
import DeviceModal from "./DeviceConnectionModal";
import EditDataPoint from "./EditDataPoint";
import EditGoal from "./EditGoal";
import { useTheme } from "react-native-paper";
import Ionicons from '@expo/vector-icons/Ionicons';
import AntDesign from '@expo/vector-icons/AntDesign';
import {
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Simple theme toggle - change this to false for dark theme
const USE_LIGHT_THEME = true;

const { LightTheme, DarkTheme: PaperDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
});

// Add missing fonts property to fix the TypeScript error
const navigationTheme = USE_LIGHT_THEME ? {
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
} : {
  ...PaperDarkTheme,
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
  const theme = useTheme();
  return (
    <PaperProvider theme={USE_LIGHT_THEME ? MD3LightTheme : MD3DarkTheme}>
      <GestureHandlerRootView>
      <StatusBar barStyle={USE_LIGHT_THEME ? "dark-content" : "light-content"} backgroundColor={USE_LIGHT_THEME ? "#f2f2f2" : "#121212"} />
      <SafeAreaView style={[styles.container, { backgroundColor: USE_LIGHT_THEME ? "#f2f2f2" : "#121212" }]}>
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
      </GestureHandlerRootView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
