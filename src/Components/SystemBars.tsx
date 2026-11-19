import { useEffect, useRef } from "react";
import { StatusBar, StatusBarProps } from "react-native";
import { NavigationBar } from "expo-navigation-bar";

type BarStyle = "light" | "dark";

type Props = {
  // "light" = light icons (for dark backgrounds), "dark" = dark icons.
  style: BarStyle | { statusBar: BarStyle; navigationBar: BarStyle };
};

// Sets the style of the status bar and the Android navigation bar. The most
// recently mounted instance wins.
export function SystemBars({ style }: Props) {
  const statusBar = typeof style === "string" ? style : style.statusBar;
  const navigationBar = typeof style === "string" ? style : style.navigationBar;
  useStatusBarStyle(statusBar);
  return <NavigationBar style={navigationBar} />;
}

// React Native's <StatusBar> (and expo-status-bar, which wraps it) is a class
// component, and react-native-screens' freezing (enableFreeze) runs its
// componentWillUnmount/componentDidMount when a screen is frozen/unfrozen. That
// re-pushes a screen deep in the stack on top when it unfreezes, so going back
// shows its style instead of the current screen's. Passive effects are not
// re-run by freezing, so drive the same stack from useEffect instead.
function useStatusBarStyle(style: BarStyle) {
  const barStyle: StatusBarProps["barStyle"] = style == "light" ? "light-content" : "dark-content";
  const entryRef = useRef<ReturnType<typeof StatusBar.pushStackEntry> | null>(null);

  useEffect(() => {
    entryRef.current = StatusBar.pushStackEntry({ barStyle });
    return () => {
      if (entryRef.current) StatusBar.popStackEntry(entryRef.current);
      entryRef.current = null;
    };
    // Mount/unmount only; style changes are handled below without changing stack order.
  }, []);

  useEffect(() => {
    if (entryRef.current) entryRef.current = StatusBar.replaceStackEntry(entryRef.current, { barStyle });
  }, [barStyle]);
}
