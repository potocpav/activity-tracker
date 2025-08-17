import { useTheme } from 'react-native-paper';
import useStore from './Store';
import { darkPalette, lightPalette } from './Color';
import { ActivityType } from './StoreTypes';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';


export const useWideDisplay = () : boolean => {
  const dimensions = useWindowDimensions();
  return dimensions.width > 600;
}

export const getThemeVariant = () : "dark" | "light" => {
  const themeSettings = useStore((state: any) => state.theme);
  const systemScheme = useColorScheme();
  if (themeSettings === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  } else {
    return themeSettings;
  }
}

export const getThemePalette = () : string[] => {
  const themeVariant = getThemeVariant();
  return themeVariant === "dark" ? darkPalette : lightPalette;
}

export const getTheme = (activity?: ActivityType) : MD3Theme => {
  const palette = getThemePalette();
  if (activity) {
    const theme = useTheme();
    return {
      ...theme,
      colors: {
        ...theme.colors,
        primary: palette[activity.color],
      },
    };
  } else {
    return useTheme();
  }
};