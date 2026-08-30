import React, { useState, ReactElement } from "react";
import { StyleSheet, Text, View, SectionList, Alert, BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import useStore from "../Model/Store";
import { useShallow } from "zustand/react/shallow";
import {
  DataPoint,
  ActivityType,
  Tag,
  DateList,
  dateListToDate,
  ActivityPath,
  State,
  dateToDateList,
} from "../Model/StoreTypes";
import { cmpDateList, dayCmp, findZeroSlice, formatDate } from "../Model/Activity";
import { RenderTags } from "../Components/Tags";
import TagMenu from "../Components/TagMenu";
import { renderLongFormValue } from "../Model/Unit";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useThemePalette } from "../Model/Theme";
import { useAppTheme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Inset from "../Components/SafeAreaInset";
import { ButtonRow, DeleteIcon, Button, Divider } from "../Components/Element";
import { Gesture, GestureDetector, Pressable } from "react-native-gesture-handler";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withSpring,
  cancelAnimation,
  ReduceMotion,
  LinearTransition,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useToday } from "../Model/useToday";

type ActivityDataProps = {
  navigation: any;
  route: any;
};

const ITEM_HEIGHT = 60;

const DataPointContainer = (props: {
  children: React.ReactNode;
  // theme: any,
  onDelete?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  selected: boolean;
  enableSwipeToDelete: boolean;
  style?: any;
  theme: any;
}) => {
  const position = useSharedValue(0);
  const isPanning = useSharedValue(false);
  const THRESHOLD = 200;
  const TOLERANCE = 10;
  const onDelete = props.onDelete;

  const panGesture = Gesture.Pan()
    .enabled(props.enableSwipeToDelete)
    .activeOffsetX([-TOLERANCE, TOLERANCE])
    .failOffsetY([-TOLERANCE, TOLERANCE])
    .onStart((e) => {
      position.set(e.translationX);
      isPanning.set(true);
    })
    .onUpdate((e) => {
      position.set(e.translationX);
    })
    .onEnd((event) => {
      position.set(
        withDecay({
          velocity: event.velocityX,
          rubberBandEffect: true,
          reduceMotion: ReduceMotion.Never,
          clamp: [0, 0],
        }),
      );
      isPanning.set(false);
    });

  useAnimatedReaction(
    () => ({
      position: position.value,
      isPanning: isPanning.value,
    }),
    (value, oldValue) => {
      if (
        Math.abs(value.position) > THRESHOLD &&
        ((Math.abs(oldValue?.position ?? 0) <= THRESHOLD && !value.isPanning) ||
          (!value.isPanning && oldValue?.isPanning))
      ) {
        if (onDelete) {
          cancelAnimation(position);
          position.set(withSpring(1000 * Math.sign(value.position)));
          scheduleOnRN(onDelete);
        }
      }
    },
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value }],
  }));

  const pressableChildren = (
    <Pressable
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      android_ripple={{ color: props.theme.primary, foreground: true }}
      style={[
        {
          padding: 6,
          backgroundColor: props.theme.elevation2,
          margin: 4,
          borderRadius: 15,
          elevation: 2,
          borderWidth: 2,
          borderColor: props.selected ? props.theme.primary : "transparent",
        },
        props.style,
      ]}
    >
      {props.children}
    </Pressable>
  );

  if (props.onDelete) {
    return (
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle} layout={LinearTransition}>
          {pressableChildren}
        </Animated.View>
      </GestureDetector>
    );
  } else {
    return pressableChildren;
  }
};

export const DataPointCardMultiContainer = (props: {
  children: React.ReactNode[];
  tags: ReactElement<any, any> | undefined;
  note: React.ReactNode | undefined;
  theme: any;
  onPress?: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
  style?: any;
  selected: boolean;
  enableSwipeToDelete: boolean;
}) => {
  return (
    <DataPointContainer
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      onDelete={props.onDelete}
      theme={props.theme}
      style={props.style}
      selected={props.selected}
      enableSwipeToDelete={props.enableSwipeToDelete}
    >
      <View style={{ gap: 4 }}>
        <View
          key="children"
          style={{ flexDirection: "row", gap: 6, alignItems: "flex-start", justifyContent: "space-between" }}
        >
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
      </View>
    </DataPointContainer>
  );
};

export const DataPointCardSingleContainer = (props: {
  variant: "single" | "no-value";
  children: React.ReactNode;
  tags: ReactElement<any, any> | undefined;
  note: React.ReactNode | undefined;
  theme: any;
  onPress?: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  style?: any;
  selected: boolean;
  enableSwipeToDelete: boolean;
}) => {
  return (
    <DataPointContainer
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      onDelete={props.onDelete}
      theme={props.theme}
      style={props.style}
      selected={props.selected}
      enableSwipeToDelete={props.enableSwipeToDelete}
    >
      <View style={{ flexDirection: "row", gap: 6, alignItems: "flex-start", justifyContent: "space-between" }}>
        <View
          key="children"
          style={{
            width: props.variant === "single" ? ITEM_HEIGHT * 1.5 : ITEM_HEIGHT * 0.8,
            flexDirection: "row",
            gap: 6,
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          {props.children}
        </View>
        <View key="divider" style={{ width: 0.5, height: "100%", backgroundColor: props.theme.outline }} />
        <View key="content" style={{ flex: 1, gap: 6, justifyContent: "space-between" }}>
          {props.tags && (
            <View key="tags" style={{}}>
              {props.tags}
            </View>
          )}
          {props.note && (
            <View key="note" style={{ marginHorizontal: 5 }}>
              {props.note}
            </View>
          )}
        </View>
      </View>
    </DataPointContainer>
  );
};

export const LabeledValue = (props: { label: string; children: React.ReactNode; theme: any }) => {
  return (
    <View key={props.label} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View style={{ padding: 2 }}>
        <Text style={{ color: props.theme.onSurface, fontSize: 12, textAlign: "center" }}>{props.label}</Text>
      </View>
      <View style={{ padding: 2, paddingBottom: 4 }}>{props.children}</View>
    </View>
  );
};

export const TextValue = (props: { children: string; theme: any }) => {
  return <Text style={{ color: props.theme.onSurface, fontSize: 20, fontWeight: "bold" }}>{props.children}</Text>;
};

export const DataPointCard = ({
  activityPath,
  i,
  repNumber = undefined,
  navigation,
  selectModeActive,
  isSelected,
  toggleSelection,
  enableSwipeToDelete,
}: {
  activityPath: ActivityPath;
  i: number;
  repNumber?: number;
  navigation: any;
  selectModeActive: boolean;
  isSelected: boolean;
  toggleSelection: (uuids: string[]) => void;
  enableSwipeToDelete: boolean;
}) => {
  const { dataPoint, activityTags, unit, color } = useStore(
    useShallow((state: State) => {
      const activity = state.activities[activityPath.tabId]?.activities[activityPath.activityId];
      return {
        dataPoint: activity.dataPoints[i],
        activityTags: activity.tags,
        unit: activity.unit,
        color: activity.color,
      };
    }),
  );
  const theme = useAppTheme(color);
  const palette = useThemePalette();
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);

  const toggleThisSelection = () => toggleSelection([dataPoint.uuid]);

  const tags = dataPoint.tags && (
    <RenderTags
      tags={activityTags.filter((t: Tag) => (dataPoint.tags ?? []).includes(t.name))}
      theme={theme}
      palette={palette}
    />
  );

  const note = dataPoint.note && <Text style={{ color: theme.onSurface }}>{dataPoint.note}</Text>;

  const onPress = () => {
    if (selectModeActive) {
      toggleThisSelection();
    } else {
      navigation.navigate("EditDataPoint", { activityPath, inputData: { type: "edit", dataPoints: [dataPoint] } });
    }
  };

  const deleteDataPoint = () => deleteActivityDataPoint(activityPath, i);

  const renderSingleValue = () => (
    <DataPointCardSingleContainer
      variant={unit.type === "none" ? "no-value" : "single"}
      onPress={onPress}
      onLongPress={toggleThisSelection}
      onDelete={deleteDataPoint}
      tags={tags}
      note={note}
      theme={theme}
      selected={isSelected}
      enableSwipeToDelete={enableSwipeToDelete}
    >
      <LabeledValue label="Value" theme={theme}>
        <TextValue theme={theme}>
          {typeof dataPoint.value === "number" && unit.type === "single"
            ? renderLongFormValue(dataPoint.value, unit.unit)
            : "✓"}
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
        </LabeledValue>,
      );
    }
    if (unit.type === "multiple") {
      unit.values.forEach(({ name, unit }) => {
        const value = (dataPoint.value as any)[name];
        const renderedValue = value !== undefined ? renderLongFormValue(value, unit) : "-";
        renderedValues.push(
          <LabeledValue key={name} label={name} theme={theme}>
            <TextValue theme={theme}>{renderedValue}</TextValue>
          </LabeledValue>,
        );
      });
    }
    return (
      <DataPointCardMultiContainer
        onPress={onPress}
        onLongPress={toggleThisSelection}
        onDelete={deleteDataPoint}
        tags={tags}
        note={note}
        theme={theme}
        selected={isSelected}
        enableSwipeToDelete={enableSwipeToDelete}
      >
        {renderedValues}
      </DataPointCardMultiContainer>
    );
  };

  switch (unit.type) {
    case "none":
      return renderSingleValue();
    case "single":
      return renderSingleValue();
    case "multiple":
      return renderMultipleValues();
  }
};

const DataPointSectionHeader = ({
  date,
  toggleStatus,
  uuids,
  theme,
  toggleSelection,
}: {
  date: DateList;
  toggleStatus: "none" | "some" | "all";
  uuids: string[];
  theme: any;
  toggleSelection: (uuids: string[]) => void;
}) => {
  let toggleIcon: keyof typeof MaterialCommunityIcons.glyphMap;
  if (toggleStatus === "none") {
    toggleIcon = "checkbox-blank-outline";
  } else if (toggleStatus === "all") {
    toggleIcon = "checkbox-intermediate";
  } else {
    toggleIcon = "checkbox-intermediate-variant";
  }
  const styles = getStyles(theme);
  return (
    <View style={styles.sectionHeader}>
      <Text style={{ color: theme.onSurface }}>{formatDate(dateListToDate(date))}</Text>
      <Button onPress={() => toggleSelection(uuids)}>
        <MaterialCommunityIcons name={toggleIcon} size={24} color={theme.onSurfaceVariant} />
      </Button>
    </View>
  );
};

const ActivityData = ({ navigation, route }: ActivityDataProps) => {
  const { activityPath, day } = route.params;
  const activity: ActivityType = useStore(
    (state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId],
  );
  const deleteActivityDataPoints = useStore((state: any) => state.deleteActivityDataPoints);
  const theme = useAppTheme(activity.color);
  const [selectedPointUuids, setSelectedPointUuids] = useState<string[]>([]);
  const selectModeActive = selectedPointUuids.length > 0;
  const today = dateToDateList(useToday());

  const styles = getStyles(theme);

  // Tag filter state
  const [tags, setTags] = useState<{ name: string; state: "yes" | "no" }[]>([]);
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);

  // Filtering logic
  const requiredTags = tags.filter((t) => t.state === "yes").map((t) => t.name);
  const negativeTags = tags.filter((t) => t.state === "no").map((t) => t.name);

  let dps: [DataPoint, number][] = activity.dataPoints.map((o: DataPoint, i: number) => [o, i]);
  // filter only daily points
  if (day) {
    const daySlice = findZeroSlice(dps, (dp) => dayCmp(dp[0], day));
    const dayDataAndIndex = dps.slice(...daySlice);
    dps = dayDataAndIndex;
  }

  const filteredDataPoints: [DataPoint, number][] = dps
    .filter(([dataPoint, _]: [DataPoint, number]) => {
      const hasAllRequired = requiredTags.every((tag) => (dataPoint.tags ?? []).includes(tag));
      const hasAnyNegative = negativeTags.some((tag) => (dataPoint.tags ?? []).includes(tag));
      return hasAllRequired && !hasAnyNegative;
    })
    .slice()
    .reverse();

  const toggleSelection = (uuids: string[]) => {
    // If no `uuids` are selected, select all of them
    // Otherwise, deselect all of them
    setSelectedPointUuids((selectedPointUuids: string[]): string[] => {
      const selectedUuids = uuids.filter((uuid) => selectedPointUuids.includes(uuid));
      if (selectedUuids.length === 0) {
        return [...selectedPointUuids, ...uuids];
      } else {
        return selectedPointUuids.filter((u) => !uuids.includes(u));
      }
    });
  };

  let sections = filteredDataPoints.reduce((acc: any, [dataPoint, i]) => {
    const lastDate = acc[acc.length - 1]?.date ?? null;
    const newPoint = {
      dataPoint,
      index: i,
      selected: selectModeActive ? selectedPointUuids.includes(dataPoint.uuid) : false,
    };
    if (lastDate && cmpDateList(dataPoint.date, lastDate) == 0) {
      acc[acc.length - 1].data.push(newPoint);
    } else {
      acc.push({
        date: dataPoint.date,
        toggleStatus: "none",
        data: [newPoint],
      });
    }
    return acc;
  }, []);

  // update selected section selection status
  if (selectModeActive) {
    sections.forEach((section: any) => {
      let numSelected = section.data.filter((item: any) => item.selected).length;
      section.toggleStatus = numSelected === section.data.length ? "all" : numSelected > 0 ? "some" : "none";
    });
  }

  // Android back button behavior with selection active
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (selectModeActive) {
          setSelectedPointUuids([]);
          return true;
        } else {
          return false;
        }
      };

      const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => subscription.remove();
    }, [selectModeActive]),
  );

  React.useEffect(() => {
    const normalButtons = () => (
      <ButtonRow>
        {filteredDataPoints.length > 0 && day && (
          <Button
            onPress={() => {
              Alert.alert("Delete all listed data?", "This action cannot be undone.", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteActivityDataPoints(
                      activityPath,
                      filteredDataPoints.map(([_, i]) => i),
                    );
                  },
                },
              ]);
            }}
          >
            <DeleteIcon color={theme.onHeader} />
          </Button>
        )}
        {activity.tags.length > 0 && (
          <TagMenu
            activity={activity}
            tags={tags}
            onChange={(tags) => setTags(tags)}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            activityTags={activity.tags}
            button={(setMenuVisible) => (
              <Button onPress={() => setMenuVisible()}>
                <MaterialCommunityIcons name="filter" size={24} color={theme.onHeader} />
              </Button>
            )}
          />
        )}
        <Button
          onPress={() =>
            navigation.navigate("EditDataPoint", {
              activityPath,
              inputData: { type: "new", dataPoint: { date: day ?? today, tags: requiredTags } },
            })
          }
        >
          <MaterialCommunityIcons name="plus" size={26} color={theme.onHeader} />
        </Button>
      </ButtonRow>
    );

    const selectModeButtons = () => (
      <ButtonRow>
        {filteredDataPoints.length > selectedPointUuids.length && (
          <Button
            onPress={() => setSelectedPointUuids(filteredDataPoints.map(([_, i]) => activity.dataPoints[i].uuid))}
          >
            <MaterialCommunityIcons name="checkbox-intermediate-variant" size={24} color={theme.onHeader} />
          </Button>
        )}
        <Button onPress={() => setSelectedPointUuids([])}>
          <MaterialCommunityIcons name="close" size={24} color={theme.onHeader} />
        </Button>
      </ButtonRow>
    );

    navigation.setOptions({
      title: day
        ? formatDate(dateListToDate(day))
        : selectModeActive
          ? selectedPointUuids.length + " selected"
          : "All data",
      headerStyle: { backgroundColor: theme.header },
      headerTintColor: theme.onHeader,
      headerBackVisible: !selectModeActive,
      headerRight: selectModeActive ? selectModeButtons : normalButtons,
    });
  }, [navigation, theme, tagsMenuVisible, tags, activity, selectModeActive, selectedPointUuids, today]);

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={{ statusBar: "light", navigationBar: theme.variant == "light" ? "dark" : "light" }} />
      {sections.length === 0 ? (
        <EmptyPagePlaceholder title="No data" subtext="Tap the + button to create a data point" />
      ) : (
        <SectionList
          style={styles.scrollView}
          sections={sections}
          keyExtractor={(item) => item.dataPoint.uuid}
          windowSize={11}
          ListFooterComponent={() => <Inset type="bottom" />}
          renderSectionHeader={({ section: { date, toggleStatus, data } }) => (
            <DataPointSectionHeader
              date={date as DateList}
              toggleStatus={toggleStatus}
              uuids={data.map((item: any) => item.dataPoint.uuid)}
              theme={theme}
              toggleSelection={toggleSelection}
            />
          )}
          renderItem={({ item: item }) => (
            <DataPointCard
              activityPath={activityPath}
              i={item.index}
              navigation={navigation}
              selectModeActive={selectModeActive}
              isSelected={item.selected}
              toggleSelection={toggleSelection}
              enableSwipeToDelete={false}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    sectionHeader: {
      padding: 5,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerMenu: {
      paddingHorizontal: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",

      backgroundColor: theme.elevation2,
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
      backgroundColor: theme.elevation2,
      margin: 4,
      borderRadius: 15,
      elevation: 2,
    },
  });

export default ActivityData;
