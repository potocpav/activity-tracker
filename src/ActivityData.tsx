import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  Pressable,
} from "react-native";
import { Button, Divider } from 'react-native-paper';
import useStore from "./Store";
import { DataPoint, ActivityType, Tag, Unit, DateList } from "./StoreTypes";
import { cmpDateList, dayCmp, findZeroSlice, renderTags, formatDate } from "./ActivityUtil";
import TagMenu from "./TagMenu";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getThemePalette, getThemeVariant } from "./Theme";
import { getTheme } from "./Theme";
import { SafeAreaView } from "react-native-safe-area-context";


type ActivityDataProps = {
  navigation: any;
  route: any;
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

const ITEM_HEIGHT = 60;

const ActivityData = ({ navigation, route }: ActivityDataProps) => {
  const { activityName, day } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);
  const themeVariant = getThemeVariant();
  const blackBackground = useStore((state: any) => state.blackBackground);
  const blackTheme = themeVariant == 'dark' && blackBackground;
  
  const palette = getThemePalette();
  const styles = getStyles(theme);

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

  const sections = filteredDataPoints.reduce((acc: any, [dataPoint, i]) => {
    const lastDate = acc[acc.length - 1]?.date ?? null;
    if (lastDate && cmpDateList(dataPoint.date, lastDate) == 0) {
      acc[acc.length - 1].data.push([dataPoint, i]);
    } else {
      acc.push({
        date: dataPoint.date,
        data: [[dataPoint, i]],
      });
    }
    return acc;
  }, []);

  React.useEffect(() => {
    navigation.setOptions({
      title: activity.name,
      headerStyle: {
        backgroundColor: themeVariant == 'light' ? theme.colors.primary : theme.colors.background,
      },
      headerTintColor: "#ffffff",
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {activity.tags.length > 0 && (
              <TagMenu
                activity={activity}
                tags={tags}
                onChange={(tags) => setTags(tags)}
                menuVisible={tagsMenuVisible}
                setMenuVisible={setTagsMenuVisible}
                activityTags={activity.tags}
                button= {(setMenuVisible) => 
                <Button compact={true} onPress={() => setMenuVisible()}>
                  <AntDesign name="filter" size={24} color={"#ffffff"} />
                </Button>
                }
              />
          )}
          <Button compact={true}
            onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, newDataPoint: true, newDataPointDate: day, tags: requiredTags })}>
            <AntDesign name="plus" size={24} color={"#ffffff"} />
          </Button>
        </View>
      ),
    });
  }, [navigation, theme, tagsMenuVisible, tags, activity]);


  const renderValue = (value: any, unit: Unit): React.ReactNode => {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {unit === null ? (
          <Text style={{ color: theme.colors.onSurface }}>✓</Text>
        ) : typeof value === "number" && typeof unit === "string" ? (
          <Text style={{ color: theme.colors.onSurface }}>{`${Math.round(value * 100) / 100} ${unit}`}</Text>
        ) : typeof value === "object" && Array.isArray(unit) ? (
            unit.map((u: any) => {
              if (value[u.name] !== null && value[u.name] !== undefined) {
                return (
                  <View key={u.name} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: theme.colors.onSurface }} numberOfLines={1} adjustsFontSizeToFit>
                      {`${value[u.name]} ${u.symbol}`}
                    </Text>
                  </View>
                )
              }
            })
        ) : (
          <Text>n/a</Text>
        )}
      </View>
    );
  };

  const renderNoteAndTags = (dataPoint: DataPoint) => {
    return (
      <View style={{gap: 4}}>
        <View style={{}}>
          <Text numberOfLines={1} style={{ color: theme.colors.onSurface }}>{dataPoint.note ?? ""}</Text>
        </View>
        <View style={{}}>
          {renderTags(
            activity.tags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name)),
            theme,
            palette,
            false
          )}
        </View>
      </View>
    );
  }

  const renderValueless = (dataPoint: DataPoint, i: number) => {
    return (
      <Pressable
        onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
        android_ripple={{ color: theme.colors.outline, foreground: false }}
        style={styles.activityCard}
      >
        <View style={{ padding: 5, height: ITEM_HEIGHT, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: ITEM_HEIGHT - 10, alignItems: 'center' }}>
            <Text numberOfLines={1} adjustsFontSizeToFit style={{ color: theme.colors.onSurface, fontSize: 70 }}>✓</Text>
          </View>
          {renderNoteAndTags(dataPoint)}
        </View>
      </Pressable>
    );
  };

  const renderWithValue = (dataPoint: DataPoint, i: number) => {
    return (
      <Pressable
        onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
        android_ripple={{ color: theme.colors.outline, foreground: false }}
        style={styles.activityCard}
      >
        <View style={{ padding: 5, height: ITEM_HEIGHT, flexDirection: 'row', gap: 10 }}>
          <View style={{ width: ITEM_HEIGHT * 1.2, alignItems: 'center' }}>
            {renderValue(dataPoint.value, activity.unit)}
          </View>
          {renderNoteAndTags(dataPoint)}
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SectionList
        style={styles.scrollView}
        sections={sections}
        ItemSeparatorComponent={() => (blackTheme ? <Divider /> : null)}
        keyExtractor={([_, i]) => i.toString()}
        windowSize={2}
        renderSectionHeader={({ section: { date } }) => (
          <View style={blackTheme ? styles.sectionHeaderBlackTheme : styles.sectionHeader}>
            <Text style={{ color: theme.colors.onSurface }}>{formatDate(new Date(...(date as DateList)))}</Text>
          </View>
        )}
        renderItem={({ item: [dataPoint, i] }) => activity.unit === null ? renderValueless(dataPoint, i) : renderWithValue(dataPoint, i)}
      />
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 2,
  },
  sectionHeader: {
    padding: 5,
  },
  sectionHeaderBlackTheme: {
    padding: 5,
    borderTopWidth: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.outline,
  },
  headerMenu: {
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',

    backgroundColor: theme.colors.elevation.level2,
    elevation: 2,
    borderRadius: 2,
    marginBottom: 2,
  },
  scrollView: {
    flex: 1,
  },
  listContainer: {
    padding: 2,
  },
  activityCard: {
    padding: 4,
    backgroundColor: theme.colors.elevation.level1,
    margin: 2,
    borderRadius: 2,
    elevation: 1,
  },
});

export default ActivityData; 