import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { Button } from 'react-native-paper';
import useStore from "../Model/Store";
import { ActivityType, DataPoint, dateToDateList, Stat } from "../Model/StoreTypes";
import DraggableFlatList from 'react-native-draggable-flatlist'
import AntDesign from '@expo/vector-icons/AntDesign';
import { dayCmp, findZeroSlice, renderStatValue } from "../Model/Activity";
import { getTheme, getThemePalette, getThemeVariant, useWideDisplay } from "../Model/Theme";
import { SystemBars } from "react-native-edge-to-edge";
import { SafeAreaView } from "react-native-safe-area-context";
import EmptyPagePlaceholder from "../Components/EmptyPagePlaceholder";
import Hint from "../Components/Hint";
import Inset from "../Components/SafeAreaInset";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type ActivitiesProps = {
  navigation: any;
};

const Activities: React.FC<ActivitiesProps> = ({ navigation }) => {
  const theme = getTheme();
  const themeVariant = getThemeVariant();
  const activities = useStore((state: any) => state.activities);
  const setActivities = useStore((state: any) => state.setActivities);
  const weekStart = useStore((state: any) => state.weekStart);
  const dismissHint = useStore((state: any) => state.dismissHint);

  const palette = getThemePalette();
  const wideDisplay = useWideDisplay();
  const dimensions = useWindowDimensions();
  const styles = getStyles(theme, wideDisplay, dimensions);
  const today = dateToDateList(new Date());
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);

  React.useEffect(() => {
    navigation.setOptions({
      // title: activity.name,
      headerRight: () => (
        <View style={styles.headerRightContainer}>
          <Button compact={true} onPress={() => {
            dismissHint("hello");
            navigation.navigate('EditActivity', { activityName: null });
          }}>
            <AntDesign name="plus" size={23} color={theme.colors.onSurface} />
          </Button>
          <Button compact={true} onPress={() => {
            dismissHint("hello");
            navigation.navigate('Settings');
          }}>
            <AntDesign name="setting" size={23} color={theme.colors.onSurface} />
          </Button>
        </View>
      ),
    });
  }, [navigation, theme]);

  const renderActivity = ({ item, drag }: { item: ActivityType, drag: () => void }) => {
    const activity = item;

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
          onPress={() => navigation.navigate('Activity', { activityName: activity.name })}
          onLongPress={drag}
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
            dismissHint("quickly_add_point");
            if (activity.unit.type === "none") {
              if (todayPointIndices.length > 0) {
                navigation.navigate('EditDataPoint', { activityName: activity.name, dataPointIndex: todayPointIndices[todayPointIndices.length - 1] });
              } else {
                navigation.navigate('EditDataPoint', { activityName: activity.name, newDataPoint: true });
              }
            } else {
              switch (activity.special) {
                case "ble_scale":
                  navigation.navigate("BleScaleInput", { activityName: activity.name });
                  break;
                default:
                  navigation.navigate('EditDataPoint', { activityName: activity.name, newDataPoint: true });
              }
            }
          }}
          onLongPress={() => {
            if (activity.unit.type === "none") {
              if (todayPointIndices.length > 0) {
                deleteActivityDataPoint(activity.name, todayPointIndices[0]);
              } else {
                updateActivityDataPoint(activity.name, undefined, { date: today });
              }
            }
          }}
          style={({ pressed }) => [styles.addDataPointButton, {
            opacity: pressed ? 0.5 : 1,
          }]}
        >
          <View style={{ width: 40, height: 35, alignItems: 'center', justifyContent: 'center' }}>
            {(() => {
              if (activity.unit.type === "none") {
                if (todayPointIndices.length > 1) {
                  return (
                    <View>
                      <AntDesign name="check" size={22} color={palette[activity.color]} />
                      <View style={{ position: "absolute", top: 0, left: 5, opacity: 0.5 }}>
                        <AntDesign name="check" size={22} color={palette[activity.color]} />
                      </View>
                    </View>
                  );
                } else if (todayPointIndices.length === 1) {
                  return <AntDesign name="check" size={22} color={palette[activity.color]} />;
                } else {
                  return <AntDesign name="close" size={22} color={palette[activity.color]} />;
                }
              } else {
                switch (activity.special) {
                  case "ble_scale":
                    return <MaterialCommunityIcons name="bluetooth" size={22} color={palette[activity.color]} />;
                  default:
                    return <AntDesign name="plus" size={24} color={palette[activity.color]} />;
                }
              }
            })()}
          </View>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container]} edges={["left", "right"]}>
      <SystemBars style={themeVariant == 'light' ? "dark" : "light"} />
      <Hint hint="hello" />
      <View style={{ position: 'absolute', top: 100, left: 0, right: 0 }}>
        {activities.length >= 2 && (
          <Hint hint="quickly_add_point" />
        )}
        {activities.length >= 4 && (
          <Hint hint="reorder_activities" />
        )}
      </View>
      {activities.length === 0 ? (
        <EmptyPagePlaceholder title="No activities" subtext="Tap the + button to create an activity" />
      ) : (
        <DraggableFlatList
          data={activities}
          onDragBegin={() => dismissHint("reorder_activities")}
          onDragEnd={({ data }) => setActivities(data)}
          renderItem={renderActivity}
          keyExtractor={(item) => item.name}
          contentContainerStyle={styles.listContainer}
          ListFooterComponent={() => <Inset type="bottom" />}
        />
      )}
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
    backgroundColor: theme.colors.elevation.level1,
    elevation: 1,
    margin: 2,
    borderRadius: 2,
    flexDirection: 'row',
  },
  activityRow: {
    paddingHorizontal: 8 * dimensions.fontScale,
    paddingVertical: 8 * dimensions.fontScale,
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
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuAnchor: {
    width: 1,
    height: 1,
  },
});

export default Activities; 