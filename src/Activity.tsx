import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ToastAndroid,
} from "react-native";
import { Menu, Button } from 'react-native-paper';
import useStore from "./Store";
import {DataPoint, ActivityType, Tag, dateListToDate} from "./StoreTypes";
import AntDesign from '@expo/vector-icons/AntDesign';
import ActivitySummary from "./ActivitySummary";
import { File, Paths } from "expo-file-system/next";
import * as Sharing from 'expo-sharing';
import { getTheme, getThemeVariant } from "./Theme";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";

type ActivityProps = {
  navigation: any;
  route: any;
};


const Activity: React.FC<ActivityProps> = ({ navigation, route }) => {
  const { activityName } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);

  return activity ? (
    <ActivityInner activity={activity} navigation={navigation} />
  ) : (
    <Text></Text>
  )
}

const renderCsv = (data: (string | number | null)[][]) => {
  return data.map((row) => {
    var rowStr = "";
    row.forEach((cell, ix) => {
      if (typeof cell === "string") {
        const escaped = cell.replace(/"/g, "\"\"");
        rowStr += `"${escaped}"`;
      } else if (typeof cell === "number") {
        rowStr += cell.toString(); // no quoting for numbers
      } else if (cell === null) {
        // null is empty cell
      }
      if (ix < row.length - 1) {
        rowStr += ",";
      }
    });
    return rowStr;
  }).join("\r\n");
}

const ActivityInner: React.FC<{ activity: ActivityType, navigation: any }> = ({ activity, navigation }) => {
  const activityName = activity.name;
  const theme = getTheme(activity);
  const themeVariant = getThemeVariant();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const duplicateActivity = useStore((state: any) => state.duplicateActivity);
  const deleteActivity = useStore((state: any) => state.deleteActivity);

  if (!activity) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.onSurfaceVariant }]}>Activity not found</Text>
        </View>
      </View>
    );
  }

  const deleteActivityWrapper = () => {
    Alert.alert(
      `Delete "${activity.name}"`,
      "Are you sure you want to delete this activity? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteActivity(activity.name);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Activities' }],
            });
          }
        }
      ]
    );
  }

  const exportActivityCsv = async () => {
    const valueNames = (() => {
      switch (activity.unit.type) {
        case "none":
          return [];
        case "single":
          // TODO: add unit name
          return ["Value"];
        case "multiple":
          return activity.unit.values.map(u => u.name);
      }
    })();
    const tagNames = activity.tags.map((t: Tag) => t.name);
    const headerRow = ["Date", ...valueNames, ...tagNames];
    var dataRows = activity.dataPoints.map((dp: DataPoint) => {
      const values = (() => {
        switch (activity.unit.type) {
          case "none":
            return [];
          case "single":
            return [typeof dp.value === "number" ? dp.value : null];
          case "multiple":
            return activity.unit.values.map(u => (typeof dp.value === "object" ? (dp.value as any)[u.name] ?? null : null));
        }
      })();
      const tags = (() => {
        return activity.tags.map((t: Tag) => (dp.tags ?? []).includes(t.name) ? 1 : null);
      })();
      return [dateListToDate(dp.date).toISOString().split('T')[0], ...values, ...tags];
    });
    const csv = renderCsv([headerRow, ...dataRows]);

    // save to file and share
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const file = new File(Paths.cache, `activity-${dateStr}.csv`);

    try {
      if (file.exists) {
        file.delete();
      }
      file.create(); // can throw an error if the file already exists or no permission to create it
      file.write(csv);

      await Sharing.shareAsync(file.uri, {
        dialogTitle: 'Export Activity',
        mimeType: 'text/csv',
      });
    } catch (error) {
      console.error(error);
    }
  }

  React.useEffect(() => {
    navigation.setOptions({
      title: activity.name,
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
      headerTintColor: "#ffffff",
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button compact={true} 
            onPress={() => navigation.navigate("EditDataPoint", { activityName, newDataPoint: true })}>
            <AntDesign name="plus" size={24} color={"#ffffff"} />
          </Button>
          <Button compact={true} onPress={() => navigation.navigate("EditActivity", { activityName })}>
            <AntDesign name="edit" size={24} color={"#ffffff"} />
          </Button>
          <Button compact={true} onPress={() => setMenuVisible(!menuVisible)}>
            <AntDesign name="bars" size={24} color={"#ffffff"} />
          </Button>
        </View>
      ),
    });
  }, [navigation, theme, menuVisible]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surface }]} edges={["left", "right"]}>
      <SystemBars style={"light"} />
      <View style={{ position: 'absolute', top: 10, right: 0 }}>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={{ width: 1, height: 1 }} />}
        >
          <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate("ActivityData", { activityName }) }} title="Data" />
          <Menu.Item onPress={() => { setMenuVisible(false); exportActivityCsv() }} title="Export" />
          <Menu.Item onPress={() => { 
            setMenuVisible(false); 
            duplicateActivity(activity.name);
            navigation.reset({
              index: 0,
              routes: [{ name: 'Activities' }],
            });
          }} title="Duplicate" />
          <Menu.Item onPress={() => { setMenuVisible(false); deleteActivityWrapper() }} title="Delete" />
        </Menu>
      </View>
      <ActivitySummary activityName={activityName} navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});

export default Activity; 