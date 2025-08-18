import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  FlatList,
} from "react-native";
import { DataTable, Button, Divider } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, ActivityType, Tag, Unit } from "./StoreTypes";
import { dayCmp, findZeroSlice, renderTags } from "./ActivityUtil";
import TagMenu from "./TagMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getThemePalette, getThemeVariant } from "./Theme";
import { getTheme } from "./Theme";
import { SafeAreaView } from "react-native-safe-area-context";

const locale = NativeModules.I18nManager.localeIdentifier;

type ActivityDataProps = {
  navigation: any;
  route: any;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
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

const ITEM_HEIGHT = 60;

const ActivityData = ({ navigation, route }: ActivityDataProps) => {
  const { activityName, day } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);
  const themeVariant = getThemeVariant();
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
        headerStyle: {
          backgroundColor: themeVariant == 'light' ? theme.colors.primary : theme.colors.background,
        },
        headerTintColor: "#ffffff",
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Button compact={true} 
              onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, newDataPoint: true, newDataPointDate: day, tags: requiredTags })}>
              <AntDesign name="plus" size={24} color={"#ffffff"} />
            </Button>
          </View>
        ),
      });
    }, [navigation, theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={["left", "right"]}>
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
      <Divider />
      <FlatList
        style={styles.scrollView}
        data={filteredDataPoints}
        keyExtractor={([_, i]) => i.toString()}
        windowSize={2}
        ItemSeparatorComponent={() => <Divider />}
        getItemLayout={(_, index) => (
          { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
        )}
        renderItem={({ item: [dataPoint, i] }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
          >
              <View style={{ padding: 5, height: ITEM_HEIGHT }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                {day ? null : (
                  <View style={{ flex: 1 }}>
                    <Text style={{color: theme.colors.onSurface}}>{formatDate(new Date(...dataPoint.date))}</Text>
                  </View>
                )}
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{color: theme.colors.onSurface}}>{renderValue(dataPoint.value, activity.unit)}</Text>
                </View>
              </View>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>  
                <View style={{ flex: 1, alignItems: 'flex-start' }}>
                  <Text style={{color: theme.colors.onSurface}}>{dataPoint.note ? dataPoint.note : null}</Text></View>
                <View style={{ width: '50%', overflow: 'hidden', alignItems: 'flex-end' }}>
                  {renderTags(
                    activity.tags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name)),
                    theme,
                    palette,
                    false
                  )}
                </View>
              </View>
            </View>
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