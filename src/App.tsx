import React from "react";
import {
  StyleSheet,
  View,
  Appearance,
} from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Activities from "./Screens/Activities";
import useStore from "./Model/Store";
import Activity from "./Screens/Activity";
import Settings from "./Screens/Settings";
import EditDataPoint from "./Screens/EditDataPoint";
import BleScaleInput from "./Screens/BleScaleInput";
import EditActivity from "./Screens/EditActivity";
import ThemeSelectionDialog from "./Screens/ThemeSelectionDialog";
import {
  PaperProvider,
  MD3LightTheme,
  MD3DarkTheme,
  adaptNavigationTheme,
} from 'react-native-paper';
import ActivityData from "./Screens/ActivityData";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { getTheme, getThemeVariant } from "./Model/Theme";
import { SafeAreaProvider } from "react-native-safe-area-context";
import EditStat from "./Screens/EditStat";
import BleConnectionModal from "./Components/BleConnectionModal";
import "expo-font";

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
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: "#000000",
    },
  },
};

const App = () => {
  const themeVariant = getThemeVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);
  Appearance.setColorScheme(themeVariant);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={themeVariant == 'light' ? MD3LightTheme : blackBackground ? MD3BlackTheme : MD3DarkTheme}>
        <SubApp />
      </PaperProvider>
    </SafeAreaProvider>
  );
};

const SubApp = () => {
  const Stack = createNativeStackNavigator(); 
  const theme = getTheme();
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
    <GestureHandlerRootView>
      <View style={[styles.container]}>
        <NavigationContainer theme={navigationTheme}>
          <Stack.Navigator
            screenOptions={themeVariant == 'dark' && blackBackground ? {
              headerStyle: {
                backgroundColor: theme.colors.surface,
              },
            } :  themeVariant == 'light' 
              ? { headerStyle: { backgroundColor: theme.colors.surfaceVariant } } 
              : {}
          }
          >
            <Stack.Group>
              <Stack.Screen
                name="Activities"
                component={Activities}
                options={{ title: "Activities" }}
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
                name="EditDataPoint"
                component={EditDataPoint}
                options={{ title: "Edit Data Point" }}
              />
              <Stack.Screen
                name="BleScaleInput"
                component={BleScaleInput}
                options={{ title: "Progressor" }}
              />
              <Stack.Screen
                name="BleConnectionModal"
                component={BleConnectionModal}
                options={{ title: "Connect Device" }}
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
              <Stack.Screen
                name="EditStat"
                component={EditStat}
                options={{ title: "Edit Stat" }}
              />
            </Stack.Group>
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
