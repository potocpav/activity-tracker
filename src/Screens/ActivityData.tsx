import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  Pressable,
} from "react-native";
import { Button, Divider } from 'react-native-paper';
import useStore from "../Model/Store";
import { DataPoint, ActivityType, Tag, DateList, dateListToDate, Unit } from "../Model/StoreTypes";
import { cmpDateList, dayCmp, findZeroSlice, formatDate } from "../Model/Activity";
import { renderTags } from "../Components/Tags";
import TagMenu from "../Components/TagMenu";
import { renderLongFormValue } from "../Model/Unit";
import AntDesign from '@expo/vector-icons/AntDesign';
import { getThemePalette, getThemeVariant } from "../Model/Theme";
import { getTheme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Hint from "../Components/Hint";
import Inset from "../Components/SafeAreaInset";


type ActivityDataProps = {
  navigation: any;
  route: any;
};

const ITEM_HEIGHT = 60;

const ActivityData = ({ navigation, route }: ActivityDataProps) => {
  const { activityName, day } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity.color);
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
      title: day ? formatDate(dateListToDate(day)) : "All data",
      headerStyle: themeVariant == 'light' ? { backgroundColor: theme.colors.primary } : undefined,
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


  const renderValue = (value: null | number | Record<string, number>, unit: Unit): React.ReactNode => {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {unit.type === "none" ? (
          <Text style={{ color: theme.colors.onSurface }}>✓</Text>
        ) : typeof value === "number" && unit.type === "single" ? (
          <Text style={{ color: theme.colors.onSurface }}>{renderLongFormValue(value, unit.unit)}</Text>
        ) : typeof value === "object" && unit.type === "multiple" ? (
            unit.values.map((u: any) => {
              if (value !== null && value[u.name] !== null && value[u.name] !== undefined) {
                return (
                  <View key={u.name} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: theme.colors.onSurface }} numberOfLines={1} adjustsFontSizeToFit>
                      {renderLongFormValue(value[u.name], u.unit)}
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
      <View style={{gap: 6, flex: 1}}>
        <View style={styles.activityNoteTags}>
          <Text numberOfLines={1} style={{ color: theme.colors.onSurface }}>{dataPoint.note ?? ""}</Text>
        </View>
        <View style={styles.activityNoteTags}>
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
        <View style={styles.activityContent}>
          <View style={styles.activityValues}>
            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
            <Text numberOfLines={1} adjustsFontSizeToFit 
              style={{ color: theme.colors.onSurface, fontSize: 40 }}>
                ✓
            </Text>
            </View>
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
        <View style={styles.activityContent}>
          <View style={styles.activityValues}>
            {renderValue(dataPoint.value ?? null, activity.unit)}
          </View>
          <View style={{flex: 1}}>
            {renderNoteAndTags(dataPoint)}
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={"light"} />
      {sections.length === 0 ? (
        <EmptyPagePlaceholder title="No data" subtext="Tap the + button to create a data point" />
      ) : (
      <SectionList
        style={styles.scrollView}
        sections={sections}
        keyExtractor={([_, i]) => i.toString()}
        windowSize={11}
        ListFooterComponent={() => (
          <Inset type="bottom" />
        )}
        renderSectionHeader={({ section: { date } }) => (
          <View style={ styles.sectionHeader}>
            <Text style={{ color: theme.colors.onSurface }}>{formatDate(dateListToDate(date as DateList))}</Text>
          </View>
        )}
        renderItem={({ item: [dataPoint, i] }) => activity.unit.type === "none" ? renderValueless(dataPoint, i) : renderWithValue(dataPoint, i)}
      />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.elevation.background,
  },
  sectionHeader: {
    padding: 5,
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
    backgroundColor: theme.colors.elevation.level2,
    margin: 4,
    borderRadius: 15,
    elevation: 2,
  },
  activityContent: {
    flexDirection: 'row',
    padding: 0,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    gap: 6,
  },
  activityValues: {
    width: ITEM_HEIGHT * 1.3, 
    backgroundColor: theme.colors.elevation.level5,
    borderRadius: 15,
    elevation: 5,
    alignItems: 'center', 
    justifyContent: 'center'
  },
  activityNoteTags: {
    flex: 1,
    paddingVertical: 3,
    paddingHorizontal: 6,
    // backgroundColor: theme.colors.elevation.level5,
    // elevation: 3,
  },
});

export default ActivityData; 