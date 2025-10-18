import React, { useState, useEffect } from "react";
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
import Animated, { SharedValue, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";

type ActivitiesProps = {
  navigation: any;
};

// TODO: make this dynamic based on the font size
const ITEM_HEIGHT = 40;

const DraggableCard = ({ children, draggedCardIx, moveActivity, index }: {
  children: React.ReactNode,
  draggedCardIx: SharedValue<{ from: number, to: number } | null>,
  moveActivity: (from: number, to: number) => void,
  index: number
}) => {
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
      draggedCardIx.value = { from: index, to: Math.round(e.translationY / ITEM_HEIGHT) + index };
    })
    .onEnd((event) => {
      isPanning.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    let translateY = 0;
    if (isPanning.value) {
      // dragging
      translateY = position.value;
    } else if (draggedCardIx.value?.from == index) {
      // dropped
      if (draggedCardIx.value) {
        translateY = withSpring(
          (draggedCardIx.value.to - index) * ITEM_HEIGHT, { stiffness: 10000, damping: 1000 },
          () => {
            if (draggedCardIx.value && draggedCardIx.value.from !== draggedCardIx.value.to) {
              scheduleOnRN(
                moveActivity,
                draggedCardIx.value.from,
                draggedCardIx.value.to
              );
            }
          }
        );
      }
    } else if (draggedCardIx.value !== null) {
      // drag in progress, but I am a non-dragged card
      if (index < draggedCardIx.value.from && index >= draggedCardIx.value.to) {
        translateY = withSpring(ITEM_HEIGHT);
      } else if (index > draggedCardIx.value.from && index <= draggedCardIx.value.to) {
        translateY = withSpring(-ITEM_HEIGHT);
      } else {
        translateY = withSpring(0);
      }
    } else {
      translateY = 0;
    }
    return {
      transform: [{ translateY }],
      zIndex: isPanning.value ? 1000 : 0,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { height: ITEM_HEIGHT }]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

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

  return (
    <View style={styles.activityCard}>
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
    </View>
  );
}

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = getTheme();
  const themeVariant = getThemeVariant();
  const activities = useStore((state: any) => state.activities);
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const setActivities = useStore((state: any) => state.setActivities);

  const palette = getThemePalette();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);
  const today = dateToDateList(new Date());

  // First page and last page are empty, with no data backing them up in the model.
  // First page corresponds to zeroth index in the activities array.
  const [selectedPage, setSelectedPage] = useState(1);
  const tabId = selectedPage - 1;

  const scrollY = useSharedValue(0);
  const draggedCardIx = useSharedValue<{ from: number, to: number } | null>(null);

  React.useEffect(() => {
    navigation.setOptions({
      title: "Activities",
      headerRight: () => (
        <ButtonRow>
          <PlusIconButton onPress={() => {
            dismissHint("hello");
            navigation.navigate('EditActivity', { activityPath: { tabId: tabId, activityId: activities[tabId].activities.length } });
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
  }, [navigation, selectedPage, theme]);

  const moveActivity = (fromRaw: number, toRaw: number) => {
    const from = Math.max(0, Math.min(activities[tabId].activities.length - 1, fromRaw));
    const to = Math.max(0, Math.min(activities[tabId].activities.length - 1, toRaw));
    // swap activities
    const as = activities[tabId].activities;
    let newActivities: ActivityType[];
    if (from < to) {
      newActivities = [...as.slice(0, from), ...as.slice(from + 1, to + 1), as[from], ...as.slice(to + 1)];
    } else {
      newActivities = [...as.slice(0, to), as[from], ...as.slice(to, from), ...as.slice(from + 1)];
    }
    setActivities(tabId, newActivities);
  }; 

  useAnimatedReaction(() => {
  }, () => {
    draggedCardIx.value = null;
  }, [activities]);

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={themeVariant == 'light' ? "dark" : "light"} />
      <Hint hint="hello" />
      <View style={{ position: 'absolute', top: 100, left: 0, right: 0 }}>
        {activities.length >= 6 && (
          <Hint hint="reorder_activities" />
        )}
      </View>
      <PagerView
        style={{ flex: 1 }}
        initialPage={1}
        onPageSelected={(event) => setSelectedPage(event.nativeEvent.position)}
      >
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
                <DraggableCard
                  draggedCardIx={draggedCardIx}
                  index={index}
                  moveActivity={moveActivity}
                >
                  <ActivityCard
                    activity={item}
                    index={index}
                    wideDisplay={wideDisplay}
                    weekStart={weekStart}
                    today={today}
                    navigation={navigation}
                    styles={styles}
                    palette={palette}
                  />
                </DraggableCard>
              }
              keyExtractor={(item) => item.uuid}
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
    flex: 1,
    backgroundColor: theme.colors.elevation.level1,
    elevation: 1,
    margin: 2,
    borderRadius: 2,
    flexDirection: 'row',
  },
  activityRow: {
    paddingHorizontal: 10 * dimensions.fontScale,
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