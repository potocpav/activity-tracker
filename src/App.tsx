import React from "react";
import {
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Activities from "./Activities";
import useStore from "./Store";
import Activity from "./Activity";
import Settings from "./Settings";
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
import { SafeAreaProvider } from "react-native-safe-area-context";
import EditStat from "./EditStat";
import { enGB, registerTranslation } from 'react-native-paper-dates'

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

registerTranslation('en-GB', enGB)

const App = () => {
  const themeVariant = getThemeVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);

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
      {/* <StatusBar barStyle={themeVariant == 'light' ? "dark-content" : "light-content"}
        backgroundColor={theme.colors.surfaceVariant} /> */}
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
