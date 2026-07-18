import React from "react";
import {
  Text,
  View,
  Alert,
} from "react-native";
import { Menu } from 'react-native-paper';
import useStore from "../Model/Store";
import { DataPoint, ActivityType, Tag, dateListToDate, State, ActivityPath } from "../Model/StoreTypes";
import ActivitySummary from "./ActivitySummary";
import { File, Paths, EncodingType } from "expo-file-system";
import * as Sharing from 'expo-sharing';
import { useAppTheme, useThemeVariant } from "../Model/Theme";
import { SystemBars } from "react-native-edge-to-edge";
import Hint from "../Components/Hint";
import { BleScaleIcon, ButtonRow, DotsIconButton, EditIconButton, PlusIconButton, Button } from "../Components/Element";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type ActivityProps = {
  navigation: any;
  route: any;
};


const Activity: React.FC<ActivityProps> = ({ navigation, route }) => {
  const { activityPath } = route.params;
  const activity: ActivityType = useStore((state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]);

  return activity ? (
    <ActivityInner activity={activity} activityPath={activityPath} navigation={navigation} />
  ) : (
    <Text></Text>
  )
}

const renderCsv = (data: (string | number | null)[][]) => {
  return data.map((row) => {
    let rowStr = "";
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

const ActivityInner: React.FC<{ activity: ActivityType, activityPath: ActivityPath, navigation: any }> = ({ activity, activityPath, navigation }) => {
  const theme = useAppTheme(activity.color);
  const themeVariant = useThemeVariant();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const duplicateActivity = useStore((state: any) => state.duplicateActivity);
  const deleteActivity = useStore((state: any) => state.deleteActivity);
  const dismissHint = useStore((state: any) => state.dismissHint);

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
            deleteActivity(activityPath);
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
    const dataRows = activity.dataPoints.map((dp: DataPoint) => {
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
      file.write(csv, { encoding: EncodingType.UTF8 });

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
        <ButtonRow>
          {(() => {
            switch (activity.special?.type ?? null) {
              case "ble_scale":
                return (
                  <Button onPress={() => {
                    dismissHint("add_data_point");
                    navigation.navigate("BleScaleInput", { activityPath });
                  }}>
                    <BleScaleIcon color="white" />
                  </Button>
                );
              case null:
                return (<PlusIconButton onPress={() => {
                  dismissHint("add_data_point");
                  navigation.navigate("EditDataPoint", { activityPath, newDataPoint: true });
                }} color="white" />);
            }
          })()}
          <Button onPress={() => navigation.navigate("ActivityData", { activityPath })}>
            <MaterialCommunityIcons name="text" size={24} color="white" />
          </Button>
          <DotsIconButton onPress={() => setMenuVisible(!menuVisible)} color="white" />
        </ButtonRow>
      ),
    });
  }, [navigation, theme, menuVisible, activity]);

  return (
    <View style={{ flex: 1 }}>
      <SystemBars style={{ statusBar: "light", navigationBar: themeVariant == 'light' ? "dark" : "light" }} />
      <View style={{ position: 'absolute', top: 10, right: 0 }}>
        <Menu
          key={menuVisible ? "open" : "closed"}
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<View style={{ width: 1, height: 1 }} />}
        >
          <Menu.Item onPress={() => { setMenuVisible(false); navigation.navigate("EditActivity", { activityPath })}} leadingIcon="pencil" title="Edit" />
          <Menu.Item onPress={() => { setMenuVisible(false); exportActivityCsv() }} leadingIcon="file-export" title="Export" />
          <Menu.Item onPress={() => {
            setMenuVisible(false);
            duplicateActivity(activityPath);
            navigation.reset({ index: 0, routes: [{ name: 'Activities' }] });
          }} leadingIcon="content-copy" title="Duplicate" />
          <Menu.Item onPress={() => { setMenuVisible(false); deleteActivityWrapper() }} leadingIcon="delete" title="Delete" />
        </Menu>
      </View>
      {activity.dataPoints.length === 0 && <Hint hint="add_data_point" />}
      <ActivitySummary activityPath={activityPath} navigation={navigation} />
    </View>
  );
};

export default Activity;