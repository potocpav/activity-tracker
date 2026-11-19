import React from "react";
import { StatusBar } from "expo-status-bar";
import { NavigationBar } from "expo-navigation-bar";

type BarStyle = "light" | "dark";

type Props = {
  // "light" = light icons (for dark backgrounds), "dark" = dark icons.
  style: BarStyle | { statusBar: BarStyle; navigationBar: BarStyle };
};

// Sets the style of the status bar and the Android navigation bar. Like the
// underlying components, the most recently mounted instance wins.
export function SystemBars({ style }: Props) {
  const statusBar = typeof style === "string" ? style : style.statusBar;
  const navigationBar = typeof style === "string" ? style : style.navigationBar;
  return (
    <>
      <StatusBar style={statusBar} />
      <NavigationBar style={navigationBar} />
    </>
  );
}
