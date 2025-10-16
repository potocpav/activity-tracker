import React, { useState, ReactElement } from "react";
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  Alert,
} from "react-native";
import useStore from "../Model/Store";
import { DataPoint, ActivityType, Tag, DateList, dateListToDate } from "../Model/StoreTypes";
import { cmpDateList, dayCmp, findZeroSlice, formatDate } from "../Model/Activity";
import { RenderTags } from "../Components/Tags";
import TagMenu from "../Components/TagMenu";
import { renderLongFormValue } from "../Model/Unit";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { getThemePalette, getThemeVariant } from "../Model/Theme";
import { getTheme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Inset from "../Components/SafeAreaInset";
import { ButtonRow, DeleteIcon, Button } from "../Components/Element";
import { Divider } from "react-native-paper";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated, { useAnimatedReaction, useAnimatedStyle, useSharedValue, withDecay, withSpring, cancelAnimation, ReduceMotion } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";


type ActivityDataProps = {
  navigation: any;
  route: any;
};

const ITEM_HEIGHT = 60;

export const DataPointCardMultiContainer = (props: {
  children: React.ReactNode[],
  tags: ReactElement<any, any> | undefined,
  note: React.ReactNode | undefined,
  theme: any,
  onPress?: () => void,
  onDelete?: () => void,
  style?: any,
}) => {
  const position = useSharedValue(0);
  const isPanning = useSharedValue(false);
  const THRESHOLD = 200;
  const TOLERANCE = 10;

  const panGesture = Gesture.Pan().activeOffsetX([-TOLERANCE, TOLERANCE]).failOffsetY([-TOLERANCE, TOLERANCE])
    .onStart((e) => {
      position.value = e.translationX;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      position.value = e.translationX;
    })
    .onEnd((event) => {
      position.value = withDecay({
        velocity: event.velocityX,
        rubberBandEffect: true,
        reduceMotion: ReduceMotion.Never,
        clamp: [0, 0],
      });
      isPanning.value = false;
    });

  useAnimatedReaction(() => ({
    position: position.value,
    isPanning: isPanning.value,
  }), (value, oldValue) => {
    if (Math.abs(value.position) > THRESHOLD && ((Math.abs(oldValue?.position ?? 0) <= THRESHOLD && !value.isPanning) || (!value.isPanning && oldValue?.isPanning))) {
      if (props.onDelete) {
        cancelAnimation(position);
        position.value = withSpring(1000 * Math.sign(value.position));
        scheduleOnRN(props.onDelete);
      }
    }
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPress={props.onPress}
          android_ripple={{ color: props.theme.colors.onSurfaceVariant, foreground: true }}
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
          <View key="children" style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            {props.children}
          </View>
          {(props.tags || props.note) && <Divider key="divider" />}
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
      </Animated.View>
    </GestureDetector>
  );
}


export const DataPointCardSingleContainer = (props: {
  children: React.ReactNode,
  tags: ReactElement<any, any> | undefined,
  note: React.ReactNode | undefined,
  theme: any,
  onPress?: () => void,
  style?: any,
}) => {
  return (
    <Pressable
      onPress={props.onPress}
      android_ripple={{ color: props.theme.colors.onSurfaceVariant, foreground: true }}
      style={[{
        padding: 6,
        backgroundColor: props.theme.colors.elevation.level2,
        margin: 4,
        borderRadius: 15,
        elevation: 2,
        gap: 4,
        justifyContent: 'center',
        flexDirection: 'row',
      }, props.style]}
    >
      <View key="children" style={{ width: ITEM_HEIGHT * 1.5, flexDirection: 'row', gap: 6, alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {props.children}
      </View>
      <View key="divider" style={{ width: 0.5, height: '100%', backgroundColor: props.theme.colors.outline }} />
      <View key="content" style={{ flex: 1, gap: 6, justifyContent: 'space-between' }}>
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
      </View>
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
        <Text style={{ color: props.theme.colors.onSurface, fontSize: 12, textAlign: 'center' }}>{props.label}</Text>
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
  const dataPoint = activity.dataPoints[i];

  const tags = dataPoint.tags && (
    <RenderTags
      tags={activity.tags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name))}
      theme={theme}
      palette={palette}
      wrap={false}
    />
  );

  const note = dataPoint.note && (
    <Text style={{ color: theme.colors.onSurface }}>{dataPoint.note}</Text>
  );

  const editDataPoint = () => navigation.navigate("EditDataPoint", { activityName: activity.name, dataPointIndex: i });

  const renderValueless = () => (
    <DataPointCardSingleContainer onPress={editDataPoint} tags={tags} note={note} theme={theme}>
      <LabeledValue label="Value" theme={theme}>
        <TextValue theme={theme}>
          {"✓"}
        </TextValue>
      </LabeledValue>
    </DataPointCardSingleContainer>
  );

  const renderSingleValue = () => (
    <DataPointCardSingleContainer onPress={editDataPoint} tags={tags} note={note} theme={theme}>
      <LabeledValue label="Value" theme={theme}>
        <TextValue theme={theme}>
          {typeof dataPoint.value === "number" && activity.unit.type === "single" ? renderLongFormValue(dataPoint.value, activity.unit.unit) : "-"}
        </TextValue>
      </LabeledValue>
    </DataPointCardSingleContainer>
  );

  const renderMultipleValues = () => {
    let renderedValues: React.ReactNode[] = [];

    if (repNumber !== undefined) {
      renderedValues.push(
        <LabeledValue key="__rep__" label="Rep" theme={theme}>
          <TextValue theme={theme}>{repNumber.toString()}</TextValue>
        </LabeledValue>
      );
    }
    if (activity.unit.type === "multiple") {
      activity.unit.values.forEach(({ name, unit }) => {
        const value = (dataPoint.value as any)[name];
        const renderedValue = value !== undefined ? renderLongFormValue(value, unit) : "-";
        renderedValues.push(
          <LabeledValue key={name} label={name} theme={theme}>
            <TextValue theme={theme}>
              {renderedValue}
            </TextValue>
          </LabeledValue>
        )
      });
    }
    return (
      <DataPointCardMultiContainer onPress={editDataPoint} onDelete={() => console.log("deleting")} tags={tags} note={note} theme={theme}>
        {renderedValues}
      </DataPointCardMultiContainer>
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
              key={i.toString()}
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