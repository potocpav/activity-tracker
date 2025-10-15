import React, { useState, ReactElement } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  Pressable,
  Alert,
} from "react-native";
import useStore from "../Model/Store";
import { DataPoint, ActivityType, Tag, DateList, dateListToDate, Unit, SubUnit } from "../Model/StoreTypes";
import { cmpDateList, dayCmp, findZeroSlice, formatDate } from "../Model/Activity";
import { RenderTags } from "../Components/Tags";
import TagMenu from "../Components/TagMenu";
import { renderLongFormNumber, renderLongFormValue } from "../Model/Unit";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getThemePalette, getThemeVariant } from "../Model/Theme";
import { getTheme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Inset from "../Components/SafeAreaInset";
import { ButtonRow, DeleteIcon, Button } from "../Components/Element";
import { Divider } from "react-native-paper";


type ActivityDataProps = {
  navigation: any;
  route: any;
};

const ITEM_HEIGHT = 60;

export const DataPointCardContainer = (props: {
  children: React.ReactNode[],
  tags: ReactElement<any, any> | undefined,
  note: React.ReactNode | undefined,
  theme: any,
  onPress?: () => void,
  style?: any,
}) => {
  return (
    <Pressable
      onPress={props.onPress}
      android_ripple={{ color: props.theme.colors.outline, foreground: false }}
      style={[{
        padding: 6,
        backgroundColor: props.theme.colors.elevation.level2,
        margin: 4,
        borderRadius: 15,
        elevation: 2,
        gap: 4,
        justifyContent: 'center',
      }, props.style]}
    >
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        {props.children}
      </View>
      {(props.tags || props.note) && <Divider />}
      {props.tags && (
        <View key="tags" style={{ marginHorizontal: 0, marginTop: 1 }}>
          {props.tags}
        </View>
      )}
      {props.note && (
        <View key="note" style={{ marginHorizontal: 5 }}>
          {props.note}
        </View>
      )}
    </Pressable>
  );
}

export const LabeledValue = (props: {
  label: string,
  children: React.ReactNode,
  theme: any,
}) => {
  return (
    <View key={props.label} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ padding: 2 }}>
        <Text style={{ color: props.theme.colors.onSurface, fontSize: 12 }}>{props.label}</Text>
      </View>
      <View style={{ padding: 2, paddingBottom: 4 }}>
        {props.children}
      </View>
    </View>
  );
};

export const TextValue = (props: {
  children: string,
  theme: any,
}) => {
  return (
    <Text style={{ color: props.theme.colors.onSurface, fontSize: 20, fontWeight: 'bold' }}>{props.children}</Text>
  );
}

export const DataPointCard = (
  { activity, i, repNumber = undefined, theme, palette, navigation }:
    { activity: ActivityType, i: number, repNumber?: number, theme: any, palette: any, navigation: any }
) => {
  const styles = getStyles(theme);
  const dataPoint = activity.dataPoints[i];

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
      <View style={{ gap: 6, flex: 1 }}>
        <View style={styles.activityNoteTags}>
          <Text numberOfLines={1} style={{ color: theme.colors.onSurface }}>{dataPoint.note ?? ""}</Text>
        </View>
        <View style={styles.activityNoteTags}>
          <RenderTags 
            tags={activity.tags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name))}
            theme={theme} 
            palette={palette} 
            wrap={false} />
        </View>
      </View>
    );
  }

  const renderValueless = () => {
    return (
      <Pressable
        onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
        android_ripple={{ color: theme.colors.outline, foreground: false }}
        style={styles.activityCard}
      >
        <View style={styles.activityContent}>
          <View style={styles.activityValues}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
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

  const renderSingleValue = () => (
    <Pressable
      onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
      android_ripple={{ color: theme.colors.outline, foreground: false }}
      style={styles.activityCard}
    >
      <View style={styles.activityContent}>
        <View style={styles.activityValues}>
          {renderValue(dataPoint.value ?? null, activity.unit)}
        </View>
        <View style={{ flex: 1 }}>
          {renderNoteAndTags(dataPoint)}
        </View>
      </View>
    </Pressable>
  );

  const renderMultipleValues = () => {
    let renderedValues: React.ReactNode[] = [];

    if (repNumber !== undefined) {
        renderedValues.push(
          <LabeledValue label="Rep" theme={theme}>
            <TextValue theme={theme}>{repNumber.toString()}</TextValue>
          </LabeledValue>
        );
    }
    if (activity.unit.type === "multiple") {
      activity.unit.values.forEach(({ name, unit }) => {
        const value = (dataPoint.value as any)[name];
        const renderedValue = value !== undefined ? renderLongFormValue(value, unit) : "-";
        renderedValues.push(
          <LabeledValue label={name} theme={theme}>
            <TextValue theme={theme}>
              {renderedValue}
            </TextValue>
          </LabeledValue>
        )
      });
    }
    return (
      <DataPointCardContainer
        onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i })}
        tags={dataPoint.tags && (
          <RenderTags 
            tags={activity.tags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name))}  
            theme={theme} 
            palette={palette} 
            wrap={false} 
            />
        )}
        note={dataPoint.note && (
            <Text style={{ color: theme.colors.onSurface }}>{dataPoint.note}</Text>
        )}
        theme={theme}
      >
        {renderedValues}
      </DataPointCardContainer>
    );
  }

  switch (activity.unit.type) {
    case "none":
      return renderValueless();
    case "single":
      return renderSingleValue();
    case "multiple":
      return renderMultipleValues();
  }
}

const ActivityData = ({ navigation, route }: ActivityDataProps) => {
  const { activityName, day } = route.params;
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const deleteActivityDataPoints = useStore((state: any) => state.deleteActivityDataPoints);
  const theme = getTheme(activity.color);
  const themeVariant = getThemeVariant();

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
        <ButtonRow>
          {filteredDataPoints.length > 0 && day && <Button onPress={() => {
            Alert.alert("Delete all listed data?", "This action cannot be undone.", [
              {
                text: "Cancel",
                style: "cancel"
              },
              {
                text: "Delete",
                style: "destructive",
                onPress: () => {
                  deleteActivityDataPoints(activityName, filteredDataPoints.map(([_, i]) => i));
                }
              }
            ])
          }}>
            <DeleteIcon color="white" />
          </Button>}
          {activity.tags.length > 0 && (
            <TagMenu
              activity={activity}
              tags={tags}
              onChange={(tags) => setTags(tags)}
              menuVisible={tagsMenuVisible}
              setMenuVisible={setTagsMenuVisible}
              activityTags={activity.tags}
              button={(setMenuVisible) =>
                <Button onPress={() => setMenuVisible()}>
                  <MaterialCommunityIcons name="filter" size={24} color="white" />
                </Button>
              }
            />
          )}
          <Button
            onPress={() => navigation.navigate("EditDataPoint", { activityName: activity.name, newDataPoint: true, newDataPointDate: day, tags: requiredTags })}>
            <MaterialCommunityIcons name="plus" size={26} color={"#ffffff"} />
          </Button>
        </ButtonRow>
      ),
    });
  }, [navigation, theme, tagsMenuVisible, tags, activity]);

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={{ statusBar: "light", navigationBar: themeVariant == 'light' ? "dark" : "light" }} />
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
            <View style={styles.sectionHeader}>
              <Text style={{ color: theme.colors.onSurface }}>{formatDate(dateListToDate(date as DateList))}</Text>
            </View>
          )}
          renderItem={({ item: [dataPoint, i] }) =>
            <DataPointCard
              activity={activity}
              i={i}
              theme={theme}
              palette={palette}
              navigation={navigation}
            />
          }
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