import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useTheme } from 'react-native-paper';
import { DataPoint, dateListToTime, normalizeDateList, DateList, ActivityType, TagFilter } from "./StoreTypes";
import { formatNumber, findZeroSlice, dayCmp, extractStatValue, extractValue } from "./ActivityUtil";
import useStore from "./Store";
import { lightPalette, darkPalette } from "./Color";
import { getTheme } from "./Theme";

type CalendarComponentProps = {
  navigation: any;
  activityName: string;
};

const ITEM_WIDTH = 35;
const ITEM_MARGIN = 1;
const MIN_WEEK_COUNT = 14;
const MAX_WEEK_COUNT = 520;


const Calendar: React.FC<CalendarComponentProps> = ({ navigation, activityName }) => {
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);
  const dayBackground = theme.colors.primary;
  const firstWeekDay = useStore((state: any) => state.weekStart);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  
  const now = new Date();
  const pastWeekStart = (date: Date, i: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() - i * 7 + (firstWeekDay == "sunday" ? 0 : 1));

  const firstDpDate: DateList | null = activity.dataPoints[0]?.date || null;
  const lastVisibleWeek = pastWeekStart(now, 0);
  const firstVisibleWeek = firstDpDate ? pastWeekStart(new Date(...firstDpDate), 0) : lastVisibleWeek;

  const weekCount = Math.min(MAX_WEEK_COUNT, Math.max(MIN_WEEK_COUNT, 1 + Math.round((lastVisibleWeek.getTime() - firstVisibleWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))));
  const positiveTags = activity.calendar.tagFilters.filter((t: TagFilter) => t.state === "yes").map((t: TagFilter) => t.name);

  return (
    <FlatList
      data={Array.from({ length: weekCount }, (_, i) => i)}
      keyExtractor={(_, id) => id.toString()}
      style={styles.scrollView}
      extraData={activity.dataPoints}
      removeClippedSubviews={true}
      inverted={true}
      windowSize={2}
      horizontal={true}
      getItemLayout={(_, index) => (
        { length: ITEM_WIDTH, offset: ITEM_WIDTH * index, index }
      )}
      renderItem={({ item: weekIdx }) => {
        const weekStart = pastWeekStart(now, weekIdx);
        return (
          <View style={styles.weekColumn} key={weekIdx}>
            <View style={styles.monthLabelContainer}>
              {(weekStart.getDate() <= 7) &&
                <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>{`${weekStart.toLocaleDateString('en-US', { month: 'short' })}`}</Text>}
              {(weekStart.getDate() <= 7 && weekStart.getMonth() == 1) &&
                <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>{`${weekStart.toLocaleDateString('en-US', { year: 'numeric' })}`}</Text>}
            </View>
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const day = normalizeDateList([weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayIdx]);
              if (dateListToTime(day) > now.getTime()) {
                return;
              }
              const daySlice = findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, day));
              const dayDataAndIndex: [DataPoint, number][] = 
                activity.dataPoints
                  .map((dp: DataPoint, i: number): [DataPoint, number] => [dp, i])
                  .slice(...daySlice)
                  .map(([dp, i]: [DataPoint, number]) => 
                    [dp.date, i, extractValue(dp, activity.calendar.tagFilters, activity.calendar.subUnit)])
                  .filter((v: any) => v[2] !== null);
              const value = extractStatValue(dayDataAndIndex.map((v: any) => [v[0], v[2]]), activity.calendar.value, activity.calendar.period, firstWeekDay);
              const hasData = dayDataAndIndex.length > 0;
              return (
                <TouchableOpacity
                  style={[styles.daySquare, hasData ?
                    {
                      backgroundColor: dayBackground,
                    } :
                    {
                      backgroundColor: [0, 6].includes((weekStart.getDay() + dayIdx) % 7) ? theme.colors.surfaceDisabled : theme.colors.backdrop,
                    }
                  ]}
                  key={dayIdx}
                  onLongPress={() => {
                    if (activity.unit === null) {
                      if (hasData) {
                        deleteActivityDataPoint(activityName, dayDataAndIndex[0][1]);
                      } else {
                        updateActivityDataPoint(activityName, undefined, { date: day, tags: positiveTags });
                      }
                    }
                  }}
                  onPress={() => {
                    if (hasData) {
                      navigation.navigate("ActivityData", { activityName, day });
                    } else {
                      navigation.navigate("EditDataPoint", { activityName, newDataPoint: true, newDataPointDate: day, tags: positiveTags });
                    }
                  }}
                  activeOpacity={0.3}
                >
                  {(dayIdx == 0) && 
                  <Text style={[styles.dayNumber, { color: theme.colors.outline, backgroundColor: theme.colors.background }]}>
                    {day[2]}
                  </Text>}

                  <Text style={[styles.value, { color: theme.colors.background }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {hasData && (value !== null ? (activity.unit === null && value === 1 ? "✓" : formatNumber(value)) : '-')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  calendarContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  weekColumn: {
    flexDirection: 'column',
    width: ITEM_WIDTH,
  },
  daySquare: {
    width: ITEM_WIDTH - ITEM_MARGIN * 2,
    height: ITEM_WIDTH - ITEM_MARGIN * 2,
    borderRadius: 8,
    margin: ITEM_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayNumber: {
    position: 'absolute',
    fontSize: 8,
    marginBottom: 2,
    marginTop: -30,
    marginLeft: -25,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  value: {
    position: 'absolute',
    fontSize: 15,
  },
  monthLabelContainer: {
    height: 25,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: '#888',
  },
  scrollView: {
    flex: 1,
  },
});

export default Calendar; 