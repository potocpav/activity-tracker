import React from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
} from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LiveView from "./LiveView";
import Activities from "./Activities";
import useStore from "./Store";
import Activity from "./Activity";
import Settings from "./Settings";
import DeviceModal from "./DeviceConnectionModal";
import EditDataPoint from "./EditDataPoint";
import EditActivity from "./EditActivity";
import ThemeSelectionDialog from "./ThemeSelectionDialog";
import {
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import ActivityData from "./ActivityData";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getTheme, getThemeVariant } from "./Theme";

const { LightTheme, DarkTheme: PaperDarkTheme } = adaptNavigationTheme({
  reactNavigationLight: DefaultTheme,
  reactNavigationDark: DarkTheme,
});

const MD3BlackTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: "#000000",
    surface: "#000000",
    surfaceVariant: "#000000",
  },
};

const App = () => {
  const Stack = createNativeStackNavigator(); 
  const themeVariant = getThemeVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);

  // Add missing fonts property to fix the TypeScript error
  const navigationTheme = themeVariant == 'light' ? {
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
    colors: blackBackground ? {
      ...PaperDarkTheme.colors,
      background: "#000000",
      surface: "#000000",
      surfaceVariant: "#000000",
      card: "#000000",
    } : PaperDarkTheme.colors,
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

  return (
    <PaperProvider theme={themeVariant == 'light' ? MD3LightTheme : blackBackground ? MD3BlackTheme : MD3DarkTheme}>
      <GestureHandlerRootView>
        <StatusBar barStyle={
          themeVariant == 'light' 
          ? "dark-content" 
          : "light-content"
          } backgroundColor={
            themeVariant == 'light' 
            ? "#f2f2f2" 
            : blackBackground 
            ? "#000000" 
            : "#121212"
            } />
        <SafeAreaView style={[styles.container, { backgroundColor: themeVariant == 'light' ? "#f2f2f2" : blackBackground ? "#000000" : "#121212" }]}>
          <NavigationContainer theme={navigationTheme}>
            <Stack.Navigator
              screenOptions={themeVariant == 'dark' && blackBackground ? {
                headerStyle: {
                  backgroundColor: "#000000",
                },
                // headerTintColor: theme == 'light' ? "#000000" : "#ffffff",
              } : {
                // headerStyle: {
                //   backgroundColor: "#ff0000",
                // },
                // headerTintColor: "#ffffff",
              }
            }
            >
              <Stack.Group>
                <Stack.Screen
                  name="Activities"
                  component={Activities}
                  options={{ title: "Activities" }}
                />
                <Stack.Screen
                  name="Live View"
                  component={LiveView}
                  options={{ title: "Live View" }}
                />
                <Stack.Screen
                  name="Activity"
                  component={Activity}
                />
                <Stack.Screen
                  name="ActivityData"
                  component={ActivityData}
                  options={{ title: "Data Points" }}
                />
                <Stack.Screen
                  name="Settings"
                  component={Settings}
                  options={{ title: "Settings" }}
                />
              </Stack.Group>
              <Stack.Group screenOptions={{ presentation: 'modal' }}>
                <Stack.Screen
                  name="ConnectDevice"
                  component={DeviceModal}
                  options={{ title: "Connect to a Device" }}
                />
                <Stack.Screen
                  name="EditDataPoint"
                  component={EditDataPoint}
                  options={{ title: "Edit Data Point" }}
                />
                <Stack.Screen
                  name="EditActivity"
                  component={EditActivity}
                  options={{ title: "Edit Activity" }}
                />
                <Stack.Screen
                  name="ThemeSelection"
                  component={ThemeSelectionDialog}
                  options={{ title: "Select Theme" }}
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
