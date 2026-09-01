import React, { useState, useRef, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions, FlatList } from "react-native";
import useStore from "../Model/Store";
import { ActivityType, DataPoint, dateToDateList, Stat, ActivityTab, ActivityPath } from "../Model/StoreTypes";
import { dayCmp, findZeroSlice, renderStatValue } from "../Model/Activity";
import { useAppTheme, useThemePalette, useWideDisplay } from "../Model/Theme";
import { useToday } from "../Model/useToday";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Hint from "../Components/Hint";
import Inset from "../Components/SafeAreaInset";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ButtonRow,
  CheckIcon,
  CloseIcon,
  DoubleCheckIcon,
  PlusIcon,
  PlusIconButton,
  Button,
  BleScaleIcon,
  CheckButton,
  CloseButton,
} from "../Components/Element";
import PagerView from "react-native-pager-view";
import Animated, {
  FadeOut,
  FadeIn,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import { scheduleOnRN } from "react-native-worklets";
import SmallDialog from "../Components/SmallDialog";
import TextField from "../Components/TextField";
import * as Crypto from "expo-crypto";

type ActivitiesProps = {
  navigation: any;
};

const DraggableCard = ({
  draggedCardIx,
  moveActivity,
  index,
  itemHeight,
  numberOfItems,
  tabId,
  navigation,
  selectedActivities,
  setSelectedActivities,
}: {
  draggedCardIx: SharedValue<{ from: number; to: number } | null>;
  moveActivity: (from: number, to: number) => void;
  index: number;
  itemHeight: number;
  numberOfItems: number;
  tabId: number;
  navigation: any;
  selectedActivities: number[];
  setSelectedActivities: (activities: (activities: number[]) => number[]) => void;
}) => {
  const TOLERANCE = 100;
  const position = useSharedValue(0);
  const isPanning = useSharedValue(false);
  const alreadyMoved = useSharedValue(false);
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .activateAfterLongPress(400)
        .activeOffsetY([-TOLERANCE, TOLERANCE])
        .failOffsetX([-TOLERANCE, TOLERANCE])
        .onStart((e) => {
          position.set(e.translationY);
          isPanning.set(true);
          alreadyMoved.set(false);
        })
        .onUpdate((e) => {
          position.set(e.translationY);
          draggedCardIx.set({
            from: index,
            to: Math.max(0, Math.min(numberOfItems - 1, Math.round(e.translationY / itemHeight) + index)),
          });
        })
        .onEnd(() => {
          isPanning.set(false);
        }),
    [index, numberOfItems, itemHeight, draggedCardIx, position, isPanning, alreadyMoved],
  );

  const animatedStyle = useAnimatedStyle(() => {
    if (isPanning.value) {
    } else if (draggedCardIx.value?.from == index) {
      // dropped
      if (draggedCardIx.value && !alreadyMoved.value) {
        const dragged = draggedCardIx.value;
        alreadyMoved.set(true);

        position.set(
          withSpring(
            (draggedCardIx.value.to - index) * itemHeight,
            { stiffness: 10000, damping: 1000 },
            (cancelled) => {
              if (cancelled && dragged && dragged.from !== dragged.to) {
                scheduleOnRN(moveActivity, dragged.from, dragged.to);
              }
            },
          ),
        );
      }
    } else if (draggedCardIx.value !== null) {
      // drag in progress, but I am a non-dragged card
      if (index < draggedCardIx.value.from && index >= draggedCardIx.value.to) {
        position.set(withSpring(itemHeight));
      } else if (index > draggedCardIx.value.from && index <= draggedCardIx.value.to) {
        position.set(withSpring(-itemHeight));
      } else {
        position.set(withSpring(0));
      }
    } else {
      position.set(0);
    }
    return {
      transform: [{ translateY: position.value }],
      zIndex: isPanning.value ? 1000 : 0,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[animatedStyle, { height: itemHeight }]}>
        <ActivityCard
          tabId={tabId}
          activityId={index}
          navigation={navigation}
          selectedActivities={selectedActivities}
          setSelectedActivities={setSelectedActivities}
        />
      </Animated.View>
    </GestureDetector>
  );
};

const ActivityCard = ({
  tabId,
  activityId,
  navigation,
  selectedActivities,
  setSelectedActivities,
}: {
  tabId: number;
  activityId: number;
  navigation: any;
  selectedActivities: number[];
  setSelectedActivities: (activities: (activities: number[]) => number[]) => void;
}) => {
  const index = activityId;
  const activityPath: ActivityPath = { tabId, activityId };
  const activity = useStore((state: any) => state.activities[tabId]?.activities[activityId]) as
    ActivityType | undefined;
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const weekStart = useStore((state: any) => state.weekStart);
  const wideDisplay = useWideDisplay();
  const palette = useThemePalette();
  const today = dateToDateList(useToday());
  const theme = useAppTheme();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);

  if (!activity) {
    return null;
  }

  let stats;
  if (wideDisplay) {
    stats = activity.stats.slice(0, 3);
  } else {
    stats = activity.stats.slice(0, 1);
  }
  const statValues = stats.map((stat: Stat) => renderStatValue(stat, activity, weekStart));

  // for none unit type, we need to count the number of data points for today
  const [start, end] = findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, today));
  const lastTodayPoint = activity.dataPoints[end - 1];
  const todayNPoints = end - start;

  const isSelected = selectedActivities.includes(activityPath.activityId);

  const toggleSelected = () => {
    setSelectedActivities((selected) => {
      if (selected.includes(index)) {
        return selected.filter((ix) => ix !== index);
      } else {
        return [...selected, index];
      }
    });
  };

  return (
    <Animated.View
      style={[styles.activityCard, { borderWidth: isSelected ? 2 : 0, borderColor: palette[activity.color] }]}
    >
      <Pressable
        onLongPress={() => {
          toggleSelected();
        }}
        delayLongPress={300}
        onPress={() => {
          if (selectedActivities.length === 0) {
            navigation.navigate("Activity", { activityPath });
          } else {
            toggleSelected();
          }
        }}
        android_ripple={{ foreground: true, color: theme.elevation3 }}
        style={styles.activityRow}
      >
        <View style={styles.activityTitleContainer}>
          <Text numberOfLines={1} style={[styles.activityTitle, { color: palette[activity.color] }]}>
            {activity.name}
          </Text>
        </View>
        {statValues.map((value, index) => (
          <View key={index} style={styles.activityValueContainer}>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.activityValue, { color: palette[activity.color] }]}
            >
              {value}
            </Text>
          </View>
        ))}
      </Pressable>
      <Pressable
        onPress={() => {
          if (selectedActivities.length === 0) {
            if (activity.unit.type === "none") {
              if (todayNPoints > 0) {
                navigation.navigate("EditDataPoint", {
                  activityPath,
                  inputData: { type: "edit", dataPoints: [lastTodayPoint] },
                });
              } else {
                navigation.navigate("EditDataPoint", {
                  activityPath,
                  inputData: { type: "new", dataPoint: { date: today } },
                });
              }
            } else {
              switch (activity.special?.type ?? null) {
                case "ble_scale":
                  navigation.navigate("BleScaleInput", { activityPath });
                  break;
                case null:
                  navigation.navigate("EditDataPoint", {
                    activityPath,
                    inputData: { type: "new", dataPoint: { date: today } },
                  });
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
            if (todayNPoints > 0) {
              deleteActivityDataPoint(activityPath, end - 1);
            } else {
              updateActivityDataPoint(activityPath, undefined, { date: today, uuid: Crypto.randomUUID(), });
            }
          }
        }}
        style={({ pressed }) => [
          styles.addDataPointButton,
          {
            opacity: pressed ? 0.5 : 1,
          },
        ]}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {(() => {
            if (activity.unit.type === "none") {
              if (todayNPoints > 1) {
                return <DoubleCheckIcon color={palette[activity.color]} />;
              } else if (todayNPoints === 1) {
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
};

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = useAppTheme();
  const activities = useStore((state: any) => state.activities);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const moveActivity = useStore((state: any) => state.moveActivity);
  const setActivityTabName = useStore((state: any) => state.setActivityTabName);

  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);

  // First page and last page are empty, with no data backing them up in the model.
  // First page corresponds to zeroth index in the activities array.
  const currentTabId = useStore((state: any) => state.currentTabId);
  const setCurrentTabId = useStore((state: any) => state.setCurrentTabId);
  const moveActivitiesToTab = useStore((state: any) => state.moveActivitiesToTab);
  const [activityTabDialogVisible, setActivityTabDialogVisible] = useState(false);
  const [activityTabDialogNameInput, setActivityTabDialogNameInput] = useState(
    activities[currentTabId]?.tabName ?? "Activities",
  );

  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);
  const pagerViewRef = useRef<PagerView>(null);

  const scrollY = useSharedValue(0);
  const draggedCardIx = useSharedValue<{ from: number; to: number } | null>(null);
  const itemHeight = 40 * dimensions.fontScale;

  React.useEffect(() => {
    navigation.setOptions({
      title: "Activities",
      headerTitle:
        selectedActivities.length > 0
          ? () => (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: "row" }}>
                <ButtonRow>
                  <Button onPress={() => setSelectedActivities([])}>
                    <MaterialCommunityIcons name="close" size={24} color={theme.onSurface} />
                  </Button>
                  {(currentTabId > 0 || selectedActivities.length < activities[currentTabId].activities.length) && (
                    <Button
                      onPress={() => {
                        moveActivitiesToTab(currentTabId, selectedActivities, currentTabId - 1);
                        setSelectedActivities([]);
                      }}
                    >
                      <MaterialCommunityIcons name="arrow-left" size={24} color={theme.onSurface} />
                    </Button>
                  )}
                  {(currentTabId < activities.length - 1 ||
                    selectedActivities.length < activities[currentTabId].activities.length) && (
                    <Button
                      onPress={() => {
                        moveActivitiesToTab(currentTabId, selectedActivities, currentTabId + 1);
                        setSelectedActivities([]);
                      }}
                    >
                      <MaterialCommunityIcons name="arrow-right" size={24} color={theme.onSurface} />
                    </Button>
                  )}
                </ButtonRow>
              </Animated.View>
            )
          : () => (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flexDirection: "row", alignItems: "center" }}>
                <Button
                  onPress={() => {
                    if (activities[currentTabId] !== undefined) {
                      setActivityTabDialogVisible(true);
                    }
                  }}
                >
                  <Text style={{ color: theme.onSurface, fontSize: 20 }}>
                    {activities[currentTabId]?.tabName ?? "Activities"}
                  </Text>
                </Button>
              </Animated.View>
            ),
      headerRight:
        selectedActivities.length === 0
          ? () => (
              <Animated.View key="unselected" entering={FadeIn} exiting={FadeOut}>
                <ButtonRow>
                  <PlusIconButton
                    onPress={() => {
                      dismissHint("hello");
                      navigation.navigate("EditActivity", {
                        activityPath: {
                          tabId: currentTabId,
                          activityId: activities[currentTabId]?.activities?.length ?? 0,
                        },
                      });
                    }}
                    color={theme.onSurface}
                  />
                  <Button
                    onPress={() => {
                      dismissHint("hello");
                      navigation.navigate("Settings");
                    }}
                  >
                    <MaterialCommunityIcons name="cog" size={24} color={theme.onSurface} />
                  </Button>
                </ButtonRow>
              </Animated.View>
            )
          : undefined,
    });
  }, [navigation, currentTabId, theme, activities, selectedActivities]);

  const moveActivityAction = (from: number, to: number) => {
    moveActivity(currentTabId, from, to);
    setSelectedActivities([]);
  };

  useAnimatedReaction(
    () => {},
    () => {
      draggedCardIx.set(null);
    },
    [activities],
  );

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={theme.variant == "light" ? "dark" : "light"} />
      <Hint hint="hello" />
      <View style={{ position: "absolute", top: 100, left: 0, right: 0 }}>
        {activities.length >= 6 && <Hint hint="reorder_activities" />}
      </View>
      <View style={{ position: "absolute", top: -20, left: 0, right: 0, zIndex: 20 }}>
        <Text style={{ color: "black" }}>Hello, world!</Text>
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
                  scrollY.set(event.nativeEvent.contentOffset.y);
                }}
                renderItem={({ index }) => (
                  <DraggableCard
                    draggedCardIx={draggedCardIx}
                    index={index}
                    moveActivity={moveActivityAction}
                    itemHeight={itemHeight}
                    numberOfItems={activityTab.activities.length}
                    tabId={tabId}
                    navigation={navigation}
                    selectedActivities={selectedActivities}
                    setSelectedActivities={setSelectedActivities}
                  />
                )}
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
      <SmallDialog
        visible={activityTabDialogVisible}
        onDismiss={() => setActivityTabDialogVisible(false)}
        theme={theme}
      >
        <TextField
          label="Tab Name"
          defaultValue={activityTabDialogNameInput}
          onChangeText={setActivityTabDialogNameInput}
        />
        <SmallDialog.Actions>
          <ButtonRow>
            <CloseButton onPress={() => setActivityTabDialogVisible(false)} color={theme.onSurface} />
            <CheckButton
              onPress={() => {
                setActivityTabName(currentTabId, activityTabDialogNameInput);
                setActivityTabDialogVisible(false);
              }}
              color={theme.onSurface}
            />
          </ButtonRow>
        </SmallDialog.Actions>
      </SmallDialog>
    </SafeAreaView>
  );
};

const getStyles = (theme: any, wideDisplay: boolean, dimensions: any) =>
  StyleSheet.create({
    menuContainer: {
      position: "absolute",
      top: 10,
      right: 0,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 2,
    },
    listContainer: {
      padding: 2,
    },
    activityCard: {
      flex: 1,
      backgroundColor: theme.elevation1,
      elevation: 1,
      margin: 2,
      borderRadius: 2,
      flexDirection: "row",
    },
    activityRow: {
      paddingHorizontal: 10 * dimensions.fontScale,
      flex: 1,
      flexDirection: "row",
      gap: 4,
    },
    activityTitleContainer: {
      flex: 1,

      justifyContent: "center",
    },
    activityValueContainer: {
      width: wideDisplay ? "10%" : "25%",
      alignItems: "center",
      justifyContent: "center",
    },
    addDataPointButton: {
      width: 45,
    },
    activityTitle: {
      fontSize: 16,
      width: "60%",
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
