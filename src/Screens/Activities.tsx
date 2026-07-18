import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  FlatList,
} from "react-native";
import useStore from "../Model/Store";
import { ActivityType, DataPoint, dateToDateList, Stat, WeekStart, DateList, ActivityTab, ActivityPath } from "../Model/StoreTypes";
import { dayCmp, findZeroSlice, renderStatValue } from "../Model/Activity";
import { useAppTheme, useThemePalette, useThemeVariant, useWideDisplay } from "../Model/Theme";
import { useToday } from "../Model/useToday";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Hint from "../Components/Hint";
import Inset from "../Components/SafeAreaInset";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ButtonRow, CheckIcon, CloseIcon, DoubleCheckIcon, PlusIcon, PlusIconButton, Button, BleScaleIcon, CheckButton, CloseButton } from "../Components/Element";
import PagerView from 'react-native-pager-view';
import Animated, { FadeOut, FadeIn, SharedValue, useAnimatedReaction, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring } from "react-native-reanimated";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import { Dialog, Portal, TextInput } from "react-native-paper";

type ActivitiesProps = {
  navigation: any;
};

const DraggableCard = ({ children, draggedCardIx, moveActivity, index, itemHeight, numberOfItems }: {
  children: React.ReactNode,
  draggedCardIx: SharedValue<{ from: number, to: number } | null>,
  moveActivity: (from: number, to: number) => void,
  index: number
  itemHeight: number
  numberOfItems: number
}) => {
  const TOLERANCE = 100;
  const position = useSharedValue(0);
  const isPanning = useSharedValue(false);
  const alreadyMoved = useSharedValue(false);
  const panGesture = Gesture
    .Pan()
    .activateAfterLongPress(400)
    .activeOffsetY([-TOLERANCE, TOLERANCE])
    .failOffsetX([-TOLERANCE, TOLERANCE])
    .onStart((e) => {
      position.value = e.translationY;
      isPanning.value = true;
      alreadyMoved.value = false;
    })
    .onUpdate((e) => {
      position.value = e.translationY;
      draggedCardIx.value = { from: index, to: Math.max(0, Math.min(numberOfItems - 1, Math.round(e.translationY / itemHeight) + index)) };
    })
    .onEnd(() => {
      isPanning.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    if (isPanning.value) {

    } else if (draggedCardIx.value?.from == index) {
      // dropped
      if (draggedCardIx.value && !alreadyMoved.value) {
        alreadyMoved.value = true;
        position.value = withSpring(
          (draggedCardIx.value.to - index) * itemHeight, { stiffness: 10000, damping: 1000 },
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
        position.value = withSpring(itemHeight);
      } else if (index > draggedCardIx.value.from && index <= draggedCardIx.value.to) {
        position.value = withSpring(-itemHeight);
      } else {
        position.value = withSpring(0);
      }
    } else {
      position.value = 0;
    }
    return {
      transform: [{ translateY: position.value }],
      zIndex: isPanning.value ? 1000 : 0,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { height: itemHeight }]}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};

const ActivityCard = ({
  activity,
  activityPath,
  wideDisplay,
  weekStart,
  today,
  navigation,
  styles,
  palette,
  selectedActivities,
  setSelectedActivities
}: {
  activity: ActivityType,
  activityPath: ActivityPath,
  wideDisplay: boolean,
  weekStart: WeekStart,
  today: DateList,
  navigation: any,
  styles: any,
  palette: any
  selectedActivities: number[]
  setSelectedActivities: (activities: (activities: number[]) => number[]) => void
}) => {
  const index = activityPath.activityId;
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);

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

  const isSelected = selectedActivities.includes(activityPath.activityId);

  const toggleSelected = () => {
    setSelectedActivities((selected) => {
      if (selected.includes(index)) {
        return selected.filter((ix) => ix !== index);
      } else {
        return [...selected, index];
      }
    });
  }

  return (
    <Animated.View style={[styles.activityCard, { borderWidth: isSelected ? 2 : 0, borderColor: palette[activity.color] }]}>
      <Pressable
        onLongPress={() => {
          toggleSelected();
        }}
        delayLongPress={300}
        onPress={() => {
          if (selectedActivities.length === 0) {
            navigation.navigate('Activity', { activityPath });
          } else {
            toggleSelected();
          }
        }}
        android_ripple={{ foreground: true }}
        style={styles.activityRow}
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
          if (selectedActivities.length === 0) {
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
          } else {
            toggleSelected();
          }
        }}
        delayLongPress={300}
        onLongPress={() => {
          if (selectedActivities.length > 0) {
            return;
          }
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
  );
}

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const themeVariant = useThemeVariant();
  const activities = useStore((state: any) => state.activities);
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const setActivities = useStore((state: any) => state.setActivities);
  const setActivityTabName = useStore((state: any) => state.setActivityTabName);

  const palette = useThemePalette();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);
  const today = dateToDateList(useToday());

  // First page and last page are empty, with no data backing them up in the model.
  // First page corresponds to zeroth index in the activities array.
  const currentTabId = useStore((state: any) => state.currentTabId);
  const setCurrentTabId = useStore((state: any) => state.setCurrentTabId);
  const moveActivitiesToTab = useStore((state: any) => state.moveActivitiesToTab);
  const [activityTabDialogVisible, setActivityTabDialogVisible] = useState(false);
  const [activityTabDialogNameInput, setActivityTabDialogNameInput] = useState(activities[currentTabId]?.tabName ?? "Activities");

  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const pagerViewRef = useRef<PagerView>(null);

  const scrollY = useSharedValue(0);
  const draggedCardIx = useSharedValue<{ from: number, to: number } | null>(null);
  const itemHeight = 40 * dimensions.fontScale;

  // React.useEffect(() => {
  //   pagerViewRef.current?.setPageWithoutAnimation(currentTabId + 1);
  // }, [currentTabId]);

  React.useEffect(() => {
    navigation.setOptions({
      title: "Activities",
      headerTitle: selectedActivities.length > 0 ? () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: 'row' }}>
          <ButtonRow>
            <Button onPress={() => setSelectedActivities([])}>
              <MaterialCommunityIcons name="close" size={24} color={theme.colors.onSurface} />
            </Button>
            {(currentTabId > 0 || selectedActivities.length < activities[currentTabId].activities.length) && (
              <Button onPress={() => {
                moveActivitiesToTab(currentTabId, selectedActivities, currentTabId - 1);
                setSelectedActivities([]);
              }}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.onSurface} />
              </Button>
            )}
            {(currentTabId < activities.length - 1 || selectedActivities.length < activities[currentTabId].activities.length) && (
              <Button onPress={() => {
                moveActivitiesToTab(currentTabId, selectedActivities, currentTabId + 1);
                setSelectedActivities([]);
              }}>
                <MaterialCommunityIcons name="arrow-right" size={24} color={theme.colors.onSurface} />
              </Button>
            )}
          </ButtonRow>
        </Animated.View>
      ) : () => (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Button 
            onPress={() => {
              if (activities[currentTabId] !== undefined) {
                setActivityTabDialogVisible(true);
              }
            }}
            >
              <Text style={{ color: theme.colors.onSurface, fontSize: 20 }}>
                {activities[currentTabId]?.tabName ?? "Activities"}
              </Text>
            </Button>
        </Animated.View>
      ),
      headerRight: selectedActivities.length === 0 ? () => (
        <Animated.View key="unselected" entering={FadeIn} exiting={FadeOut}>
          <ButtonRow>
            <PlusIconButton onPress={() => {
              dismissHint("hello");
              navigation.navigate('EditActivity', { activityPath: { tabId: currentTabId, activityId: activities[currentTabId]?.activities?.length ?? 0 } });
            }} color={theme.colors.onSurface} />
            <Button onPress={() => {
              dismissHint("hello");
              navigation.navigate('Settings');
            }}>
              <MaterialCommunityIcons name="cog" size={24} color={theme.colors.onSurface} />
            </Button>
          </ButtonRow>
        </Animated.View>
      ) : undefined,
    });
  }, [navigation, currentTabId, theme, activities, selectedActivities]);

  const moveActivity = (from: number, to: number) => {
    // swap activity into the new place
    const as = activities[currentTabId].activities;
    let newActivities: ActivityType[];
    if (from < to) {
      newActivities = [...as.slice(0, from), ...as.slice(from + 1, to + 1), as[from], ...as.slice(to + 1)];
    } else {
      newActivities = [...as.slice(0, to), as[from], ...as.slice(to, from), ...as.slice(from + 1)];
    }
    setActivities(currentTabId, newActivities);
    setSelectedActivities([]);
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
      <View style={{ position: 'absolute', top: -20, left: 0, right: 0, zIndex: 20 }}>
        <Text style={{ color: 'black' }}>Hello, world!</Text>
      </View>
      <PagerView
        ref={pagerViewRef}
        style={{ flex: 1 }}
        initialPage={currentTabId + 1}
        onPageSelected={(event) => {
          const selectedId = event.nativeEvent.position - 1;
          setCurrentTabId(selectedId);
          setActivityTabDialogNameInput(activities[selectedId]?.tabName ?? "Activities");
          setSelectedActivities([]);
        }}
      >
        <View key="-1" collapsable={false}>
          <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
        </View>
        {activities.map((activityTab: ActivityTab, tabId: number) => (
          <View key={tabId} collapsable={false}>
            {activityTab.activities.length === 0 ? (
              <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
            ) : (
              <FlatList
                data={activityTab.activities}
                onScroll={(event) => {
                  scrollY.value = event.nativeEvent.contentOffset.y;
                }}
                renderItem={({ item, index }) =>
                  <DraggableCard
                    draggedCardIx={draggedCardIx}
                    index={index}
                    moveActivity={moveActivity}
                    itemHeight={itemHeight}
                    numberOfItems={activityTab.activities.length}
                  >
                    <ActivityCard
                      activity={item}
                      activityPath={{ tabId, activityId: index }}
                      wideDisplay={wideDisplay}
                      weekStart={weekStart}
                      today={today}
                      selectedActivities={selectedActivities}
                      setSelectedActivities={setSelectedActivities}
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
        ))}
        <View key={activities.length} collapsable={false}>
          <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
        </View>
      </PagerView>
      <Portal>
        <Dialog visible={activityTabDialogVisible} onDismiss={() => setActivityTabDialogVisible(false)}>
          <Dialog.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TextInput label="Tab Name" defaultValue={activityTabDialogNameInput} onChangeText={setActivityTabDialogNameInput} mode="outlined" />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <ButtonRow>
              <CloseButton onPress={() => setActivityTabDialogVisible(false)} color={theme.colors.onSurface} />
              <CheckButton onPress={() => {
                setActivityTabName(currentTabId, activityTabDialogNameInput);
                setActivityTabDialogVisible(false);
              }} color={theme.colors.onSurface} />
            </ButtonRow>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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