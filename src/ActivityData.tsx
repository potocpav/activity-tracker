import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  FlatList,
} from "react-native";
import { useTheme, DataTable, Button } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, ActivityType, Tag, TagFilter, Unit } from "./StoreTypes";
import { darkPalette, lightPalette } from "./Color";
import { dayCmp, findZeroSlice, renderTags } from "./ActivityUtil";
import TagMenu from "./TagMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import DraggableFlatList from "react-native-draggable-flatlist";
import { getThemePalette } from "./Theme";
import { getTheme } from "./Theme";
const locale = NativeModules.I18nManager.localeIdentifier;

type ActivityDataProps = {
  navigation: any;
  route: any;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
  // return date.toUTCString();
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const renderValueSummary = (value: any, unit: Unit) => {
  const suffix = unit === "" ? "" : " " + unit;
  if (value === null) {
    return "-"
  } else if (typeof value === "number" && typeof unit === "string") {
    return (
      `${Math.round(value * 100) / 100}${suffix}`
    );
  } else if (typeof value === "object" && Array.isArray(unit)) {
    // Handle complex units (like finger strength with mean, max, tut)
    var parts: string[] = [];
    unit.forEach((u: any) => {
      if (value[u.name] !== null) {
        const suffix = u.symbol === "" ? "" : " " + u.symbol;
        parts.push(`${value[u.name]}${suffix}`);
      } else {
        parts.push("-");
      }
    });
    return ( // Only render the first part always
      parts[0]
    );
  } else {
    return "-"
  }
};

export const renderValue = (value: any, unit: Unit) => {
  if (unit === null) {
    return "✓";
  } else if (typeof value === "number" && typeof unit === "string") {
    return `${Math.round(value * 100) / 100} ${unit}`;
  } else if (typeof value === "object" && Array.isArray(unit)) {
    // Handle complex units (like finger strength with mean, max, tut)
    const parts: string[] = [];
    unit.forEach((u: any) => {
      if (value[u.name] !== null && value[u.name] !== undefined) {
        parts.push(`${value[u.name]} ${u.symbol}`);
      }
    });
    return parts.join(", ");
  } else {
    return "n/a"
  }
};

const ITEM_HEIGHT = 50;

const ActivityData = ({ navigation, route }: ActivityDataProps) => {
  const { activityName, day } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);
  const palette = getThemePalette();

  // Tag filter state
  const [tags, setTags] = useState<{ name: string; state: "yes" | "no" }[]>([]);
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  // Filtering logic
  const requiredTags = tags.filter((t) => t.state === "yes").map(t => t.name);
  const negativeTags = tags.filter((t) => t.state === "no").map(t => t.name);
  
  let dps: [DataPoint, number][] = activity.dataPoints.map((o: DataPoint, i: number) => [o, i]);
  // filter only daily points
  if (day) {
    const daySlice = findZeroSlice(dps, (dp) => dayCmp(dp[0], day));
    const dayDataAndIndex = dps.slice(...daySlice);
    dps = dayDataAndIndex;
  }

  const filteredDataPoints: [DataPoint, number][] = dps
    .filter(([dataPoint, _]: [DataPoint, number]) => {
      const hasAllRequired = requiredTags.every(tag => (dataPoint.tags ?? []).includes(tag));
      const hasAnyNegative = negativeTags.some(tag => (dataPoint.tags ?? []).includes(tag));
      return hasAllRequired && !hasAnyNegative;
    })
    .slice()
    .reverse()


    React.useEffect(() => {
      navigation.setOptions({
        title: activity.name,
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Button compact={true} 
              onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, newDataPoint: true, newDataPointDate: day, tags: requiredTags })}>
              <AntDesign name="plus" size={24} color={theme.colors.onSurface} />
            </Button>
          </View>
        ),
      });
    }, [navigation, theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {activity.tags.length > 0 && (
        <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start' }}>
          <TagMenu
            activity={activity}
            tags={tags}
            onChange={(tags) => setTags(tags)}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            activityTags={activity.tags}
          />
        </View>
      )}
      <DataTable>
        <DataTable.Header>
          { day ? null : (
            <DataTable.Title>Date</DataTable.Title>
          )}
          <DataTable.Title>Tags</DataTable.Title>
          <DataTable.Title>Note</DataTable.Title>
          <DataTable.Title numeric>Value</DataTable.Title>
        </DataTable.Header>
      </DataTable>
      <FlatList
        style={styles.scrollView}
        data={filteredDataPoints}
        keyExtractor={([_, i]) => i.toString()}
        windowSize={2}
        getItemLayout={(_, index) => (
          { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
        )}
        renderItem={({ item: [dataPoint, i] }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
          >
            <DataTable.Row style={{ height: ITEM_HEIGHT }}>
              {day ? null : (
                <DataTable.Cell>{formatDate(new Date(...dataPoint.date))}</DataTable.Cell>
              )}
              <DataTable.Cell>{renderTags(activity.tags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name)), theme, palette)}</DataTable.Cell>
              <DataTable.Cell>{dataPoint.note ? dataPoint.note : null}</DataTable.Cell>
              <DataTable.Cell numeric>{renderValue(dataPoint.value, activity.unit)}</DataTable.Cell>
            </DataTable.Row>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default ActivityData; 