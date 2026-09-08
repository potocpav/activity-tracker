import React from "react";
import { Text, View } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { SystemBars } from "react-native-edge-to-edge";
import { Button } from "./Element";
import useStore from "../Model/Store";
import { ActivityType, State } from "../Model/StoreTypes";
import { useAppTheme } from "../Model/Theme";
import { useAuthenticated, authenticate } from "../Model/useAuthenticated";
import { SafeAreaView } from "react-native-safe-area-context";

// Stands in for a locked activity until the user authenticates. Shows none of the
// activity's data, only the way to unlock it.
const LockedActivity: React.FC<{ activity: ActivityType; navigation: any }> = ({ activity, navigation }) => {
  const theme = useAppTheme(activity.color);

  React.useEffect(() => {
    navigation.setOptions({
      title: "Locked",
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.onHeader,
      headerRight: () => null,
    });
  }, [navigation, theme, activity]);

  return (
    <SafeAreaView
      edges={["left", "right", "bottom"]}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 20, gap: 30 }}
    >
      <View style={{ alignItems: "center", gap: 10 }}>
        <SystemBars style={{ statusBar: "light", navigationBar: theme.variant == "light" ? "dark" : "light" }} />
        <MaterialCommunityIcons name="lock" size={64} color={theme.onSurfaceVariant} />
        <Text style={{ fontSize: 24, fontWeight: "bold", color: theme.onSurfaceVariant }}>Locked</Text>
        <Text style={{ fontSize: 16, color: theme.onSurfaceVariant, textAlign: "center" }}>
          Authenticate to open this activity.
        </Text>
      </View>
      <Button
        onPress={() => authenticate()}
        style={{ borderWidth: 1, borderColor: theme.outline, paddingHorizontal: 20 }}
      >
        <MaterialCommunityIcons name="lock-open-variant" size={20} color={theme.onSurface} />
        <Text style={{ color: theme.onSurface, fontSize: 16 }}>Unlock</Text>
      </Button>
    </SafeAreaView>
  );
};

/**
 * Wraps a screen that shows a single activity, taken from `route.params.activityPath`.
 * While that activity is locked and the user has not authenticated, the unlock prompt
 * is rendered instead, so the screen itself never sees the activity's data.
 *
 * Apply it once, where the screen is exported, so the wrapped component keeps a stable
 * identity across renders.
 */
export const withActivityLock = <P extends { navigation: any; route: any }>(Screen: React.ComponentType<P>) => {
  const Wrapped = (props: P) => {
    const activityPath = props.route.params?.activityPath;
    const activity: ActivityType | undefined = useStore((state: State) =>
      activityPath ? state.activities[activityPath.tabId]?.activities[activityPath.activityId] : undefined,
    );
    const authenticated = useAuthenticated();

    if (activity?.locked && !authenticated) {
      return <LockedActivity activity={activity} navigation={props.navigation} />;
    }
    return <Screen {...props} />;
  };
  Wrapped.displayName = `withActivityLock(${Screen.displayName ?? Screen.name})`;
  return Wrapped;
};

export default LockedActivity;
