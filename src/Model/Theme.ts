import useStore from "./Store";
import { darkPalette, lightPalette } from "./Color";
import { useColorScheme, useWindowDimensions } from "react-native";

// Restate a "#RRGGBB" color with an alpha channel appended.
export const withAlpha = (color: string, alpha: number): string =>
  color.slice(0, 7) +
  Math.round(alpha * 255)
    .toString(16)
    .padStart(2, "0");

// The app's colors, flat: a theme holds nothing but colors and the variant it belongs
// to, so there is nothing to nest them under. The values are the Material Design 3
// baseline palette, previously reached through react-native-paper's MD3 themes.
export type Theme = {
  variant: "light" | "dark";
  primary: string;
  onPrimary: string;
  secondary: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  onSurfaceDisabled: string;
  outline: string;
  outlineVariant: string;
  error: string;
  // The themed header bar: the activity's color (or the plain primary) in the light
  // theme, a neutral dark surface in the dark themes. Its content is white throughout,
  // so a themed header needs no per-variant conditions at the call site.
  header: string;
  onHeader: string;
  // Tinted surfaces for content sitting above the background, per MD3's elevation
  // overlays: progressively lighter in both variants.
  elevation1: string;
  elevation2: string;
  elevation3: string;
};

export const lightTheme: Theme = {
  variant: "light",
  primary: "#6750A4",
  onPrimary: "#FFFFFF",
  secondary: "#625B71",
  background: "#FFFBFE",
  surface: "#FFFBFE",
  surfaceVariant: "#E7E0EC",
  onSurface: "#1C1B1F",
  onSurfaceVariant: "#49454F",
  onSurfaceDisabled: "#1C1B1F61",
  outline: "#79747E",
  outlineVariant: "#CAC4D0",
  error: "#B3261E",
  header: "#6750A4",
  onHeader: "#FFFFFF",
  elevation1: "#F7F3F9",
  elevation2: "#F3EDF6",
  elevation3: "#EEE8F4",
};

export const darkTheme: Theme = {
  variant: "dark",
  primary: "#D0BCFF",
  onPrimary: "#381E72",
  secondary: "#CCC2DC",
  background: "#1C1B1F",
  surface: "#1C1B1F",
  surfaceVariant: "#49454F",
  onSurface: "#E6E1E5",
  onSurfaceVariant: "#CAC4D0",
  onSurfaceDisabled: "#E6E1E561",
  outline: "#938F99",
  outlineVariant: "#49454F",
  error: "#F2B8B5",
  header: "#2C2831",
  onHeader: "#FFFFFF",
  elevation1: "#25232A",
  elevation2: "#2C2831",
  elevation3: "#312C38",
};

// Dark theme with pure black backgrounds, for AMOLED screens.
export const blackTheme: Theme = {
  ...darkTheme,
  background: "#000000",
  surface: "#000000",
  surfaceVariant: "#000000",
  header: "#000000",
  elevation1: "#000000",
  elevation2: "#222222",
};

export const useWideDisplay = (): boolean => {
  const dimensions = useWindowDimensions();
  return dimensions.width > 600;
};

const useVariant = (): "light" | "dark" => {
  const themeSettings = useStore((state: any) => state.theme);
  const systemScheme = useColorScheme();
  if (themeSettings === "system") {
    return systemScheme === "dark" ? "dark" : "light";
  } else {
    return themeSettings;
  }
};

export const useThemePalette = (): string[] => {
  return useVariant() === "dark" ? darkPalette : lightPalette;
};

export const useAppTheme = (primaryColor?: number): Theme => {
  const palette = useThemePalette();
  const variant = useVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);
  const theme = variant === "light" ? lightTheme : blackBackground ? blackTheme : darkTheme;
  if (primaryColor !== undefined) {
    // A themed screen wears the activity's color, but only where the header is colored
    // at all: the dark themes keep their neutral header.
    const primary = palette[primaryColor];
    return { ...theme, primary, header: variant === "light" ? primary : theme.header };
  }
  return theme;
};
