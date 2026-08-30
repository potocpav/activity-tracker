import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import useStore from "./Store";
import { darkPalette, lightPalette } from "./Color";
import { useColorScheme, useWindowDimensions } from "react-native";
import { MD3Theme } from "react-native-paper/lib/typescript/types";

// Dark theme with pure black backgrounds, for AMOLED screens.
const MD3BlackTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    background: "#000000",
    surface: "#000000",
    surfaceVariant: "#000000",
    elevation: {
      ...MD3DarkTheme.colors.elevation,
      level1: "#000000",
      level2: "#222222",
    },
  },
};

export const useWideDisplay = (): boolean => {
  const dimensions = useWindowDimensions();
  return dimensions.width > 600;
};

export const useThemeVariant = (): "dark" | "light" => {
  const themeSettings = useStore((state: any) => state.theme);
  const systemScheme = useColorScheme();
  if (themeSettings === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  } else {
    return themeSettings;
  }
};

export const useThemePalette = (): string[] => {
  const themeVariant = useThemeVariant();
  return themeVariant === "dark" ? darkPalette : lightPalette;
};

export const useAppTheme = (primaryColor?: number): MD3Theme => {
  const palette = useThemePalette();
  const themeVariant = useThemeVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);
  const theme = themeVariant === "light" ? MD3LightTheme : blackBackground ? MD3BlackTheme : MD3DarkTheme;
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
