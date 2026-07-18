import { useTheme } from 'react-native-paper';
import useStore from './Store';
import { darkPalette, lightPalette } from './Color';
import { useColorScheme, useWindowDimensions } from 'react-native';
import { MD3Theme } from 'react-native-paper/lib/typescript/types';


export const useWideDisplay = () : boolean => {
  const dimensions = useWindowDimensions();
  return dimensions.width > 600;
}

export const useThemeVariant = () : "dark" | "light" => {
  const themeSettings = useStore((state: any) => state.theme);
  const systemScheme = useColorScheme();
  if (themeSettings === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  } else {
    return themeSettings;
  }
}

export const useThemePalette = () : string[] => {
  const themeVariant = useThemeVariant();
  return themeVariant === "dark" ? darkPalette : lightPalette;
}

export const useAppTheme = (primaryColor?: number) : MD3Theme => {
  const palette = useThemePalette();
  const theme = useTheme();
  if (primaryColor !== undefined) {
    return {
      ...theme,
      colors: {
        ...theme.colors,
        primary: palette[primaryColor],
      },
    };
  }
  return theme;
};