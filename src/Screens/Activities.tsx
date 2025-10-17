import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  Pressable,
  FlatList,
} from "react-native";
import useStore from "../Model/Store";
import { ActivityType, DataPoint, dateToDateList, Stat, WeekStart, DateList } from "../Model/StoreTypes";
import { dayCmp, findZeroSlice, renderStatValue } from "../Model/Activity";
import { getTheme, getThemePalette, getThemeVariant, useWideDisplay } from "../Model/Theme";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Hint from "../Components/Hint";
import Inset from "../Components/SafeAreaInset";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ButtonRow, CheckIcon, CloseIcon, DoubleCheckIcon, PlusIcon, PlusIconButton, Button, BleScaleIcon } from "../Components/Element";
import PagerView from 'react-native-pager-view';
import Animated, { ReduceMotion, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withDecay } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

type ActivitiesProps = {
  navigation: any;
};

// TODO: make this dynamic based on the font size
const ITEM_HEIGHT = 40;

const ActivityCard = ({
  activity,
  index,
  wideDisplay,
  weekStart,
  today,
  navigation,
  styles,
  palette
}: {
  activity: ActivityType,
  index: number,
  wideDisplay: boolean,
  weekStart: WeekStart,
  today: DateList,
  navigation: any,
  styles: any,
  palette: any
}) => {
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);

  const activityPath = { tabId: 0, activityId: index };

  let stats;
  if (wideDisplay) {
    stats = activity.stats.slice(0, 3);
  } else {
    stats = activity.stats.slice(0, 1);
  }
  const statValues = stats.map((stat: Stat) => renderStatValue(stat, activity, weekStart));

  // for none unit type, we need to count the number of data points for today
  let todayPointIndices: number[] = [];
  if (activity.unit.type === "none") {
    todayPointIndices = activity.dataPoints
      .map((_: DataPoint, i: number) => i)
      .slice(...findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, today)))
  }

  const TOLERANCE = 10;
  const position = useSharedValue(0);
  const isPanning = useSharedValue(false);
  const panGesture = Gesture
    .Pan()
    .activateAfterLongPress(300)
    .activeOffsetY([-TOLERANCE, TOLERANCE])
    .failOffsetX([-TOLERANCE, TOLERANCE])
    .onStart((e) => {
      position.value = e.translationY;
      isPanning.value = true;
    })
    .onUpdate((e) => {
      position.value = e.translationY;
    })
    .onEnd((event) => {
      position.value = withDecay({
        velocity: event.velocityY,
        rubberBandEffect: true,
        reduceMotion: ReduceMotion.Never,
        clamp: [0, 0],
      });
      isPanning.value = false;
    });

  const positionIndex = useDerivedValue(() => {
    const index = Math.round(position.value / ITEM_HEIGHT);
    return index;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.activityCard, animatedStyle]}>
        <Pressable
          onPress={() => navigation.navigate('Activity', { activityPath })}
          // onLongPress={drag}
          android_ripple={{ foreground: true }}
          style={({ pressed }) => [styles.activityRow,
          {
            opacity: pressed ? 0.5 : 1,
          },
          ]}
        >
          <View style={styles.activityTitleContainer}>
            <Text numberOfLines={1} style={[styles.activityTitle, { color: palette[activity.color] }]}>{activity.name}</Text>
          </View>
          {statValues.map((value, index) => (
            <View key={index} style={styles.activityValueContainer}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.activityValue, { color: palette[activity.color] }]}>
                {value}
              </Text>
            </View>
          ))}
        </Pressable>
        <Pressable
          onPress={() => {
            if (activity.unit.type === "none") {
              if (todayPointIndices.length > 0) {
                navigation.navigate('EditDataPoint', { activityPath, dataPointIndex: todayPointIndices[todayPointIndices.length - 1] });
              } else {
                navigation.navigate('EditDataPoint', { activityPath, newDataPoint: true });
              }
            } else {
              switch (activity.special?.type ?? null) {
                case "ble_scale":
                  navigation.navigate("BleScaleInput", { activityPath });
                  break;
                case null:
                  navigation.navigate('EditDataPoint', { activityPath, newDataPoint: true });
                  break;
              }
            }
          }}
          onLongPress={() => {
            if (activity.unit.type === "none") {
              if (todayPointIndices.length > 0) {
                deleteActivityDataPoint(activityPath, todayPointIndices[0]);
              } else {
                updateActivityDataPoint(activityPath, undefined, { date: today });
              }
            }
          }}
          style={({ pressed }) => [styles.addDataPointButton, {
            opacity: pressed ? 0.5 : 1,
          }]}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {(() => {
              if (activity.unit.type === "none") {
                if (todayPointIndices.length > 1) {
                  return <DoubleCheckIcon color={palette[activity.color]} />;
                } else if (todayPointIndices.length === 1) {
                  return <CheckIcon color={palette[activity.color]} />;
                } else {
                  return <CloseIcon color={palette[activity.color]} />;
                }
              } else {
                switch (activity.special?.type ?? null) {
                  case "ble_scale":
                    return <BleScaleIcon color={palette[activity.color]} />;
                  case null:
                    return <PlusIcon color={palette[activity.color]} />;
                }
              }
            })()}
          </View>
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = getTheme();
  const themeVariant = getThemeVariant();
  const activities = useStore((state: any) => state.activities);
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);

  const palette = getThemePalette();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);
  const today = dateToDateList(new Date());
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);

  const scrollY = useSharedValue(0);

  useAnimatedReaction(() => scrollY.value, (value) => {
    console.log("scrollY", value);
  });

  React.useEffect(() => {
    navigation.setOptions({
      title: "Activities",
      headerRight: () => (
        <ButtonRow>
          <PlusIconButton onPress={() => {
            dismissHint("hello");
            navigation.navigate('EditActivity', { activityPath: null });
          }} color={theme.colors.onSurface} />
          <Button onPress={() => {
            dismissHint("hello");
            navigation.navigate('Settings');
          }}>
            <MaterialCommunityIcons name="cog" size={24} color={theme.colors.onSurface} />
          </Button>
        </ButtonRow>
      ),
    });
  }, [navigation, theme]);

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={themeVariant == 'light' ? "dark" : "light"} />
      <Hint hint="hello" />
      <View style={{ position: 'absolute', top: 100, left: 0, right: 0 }}>
        {activities.length >= 6 && (
          <Hint hint="reorder_activities" />
        )}
      </View>
      <PagerView style={{ flex: 1 }} initialPage={1}>
        <View key="0" collapsable={false}>
          <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
        </View>
        <View key="1" collapsable={false}>
          {activities.length === 0 ? (
            <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
          ) : (
            <FlatList
              data={activities[0].activities}
              onScroll={(event) => {
                scrollY.value = event.nativeEvent.contentOffset.y;
              }}
              renderItem={({ item, index }) =>
                <ActivityCard
                  activity={item}
                  index={index}
                  wideDisplay={wideDisplay}
                  weekStart={weekStart}
                  today={today}
                  navigation={navigation}
                  styles={styles}
                  palette={palette}
                />}
              keyExtractor={(item, index) => item.uuid}
              contentContainerStyle={styles.listContainer}
              ListFooterComponent={() => <Inset type="bottom" />}
            />
          )}
        </View>
        <View key="2" collapsable={false}>
          <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
        </View>
      </PagerView>
    </SafeAreaView>
  );
};

const getStyles = (theme: any, wideDisplay: boolean, dimensions: any) => StyleSheet.create({
  menuContainer: {
    position: 'absolute',
    top: 10,
    right: 0,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.elevation.background,
    paddingTop: 2,
  },
  listContainer: {
    padding: 2,
  },
  activityCard: {
    height: ITEM_HEIGHT,
    backgroundColor: theme.colors.elevation.level1,
    elevation: 1,
    margin: 2,
    borderRadius: 2,
    flexDirection: 'row',
  },
  activityRow: {
    paddingHorizontal: 10 * dimensions.fontScale,
    paddingVertical: 10 * dimensions.fontScale,
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  activityTitleContainer: {
    flex: 1,

    justifyContent: 'center',
  },
  activityValueContainer: {
    width: wideDisplay ? '10%' : '25%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addDataPointButton: {
    width: 45,
  },
  activityTitle: {
    fontSize: 16,
    width: '60%',
  },
  activityValue: {
    fontSize: 16,
  },
  menuAnchor: {
    width: 1,
    height: 1,
  },
});

export default Activities; 