import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions } from "react-native";
import { 
  DataPoint, 
  dateListToTime, 
  dateToDateList,
  normalizeDateList, 
  DateList, 
  ActivityType, 
  TagFilter, 
  dateListToDate, 
  SubUnit, 
  statValueUnit 
} from "../Model/StoreTypes";
import { findZeroSlice, dayCmp, cmpDateList, extractStatValue, extractValue, binTime } from "../Model/Activity";
import useStore from "../Model/Store";
import { getTheme } from "../Model/Theme";
import { renderShortFormValue } from "../Model/Unit";

type CalendarComponentProps = {
  navigation: any;
  activityName: string;
  calendarIndex: number;
};

const ITEM_MARGIN = 2;

const Calendar: React.FC<CalendarComponentProps> = ({ navigation, activityName, calendarIndex }) => {
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const calendar = activity.calendars[calendarIndex];
  const theme = getTheme(activity.color);
  const dayBackground = theme.colors.primary;
  const weekStart = useStore((state: any) => state.weekStart);
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPoint = useStore((state: any) => state.deleteActivityDataPoint);
  const dimensions = useWindowDimensions();
  const dismissHint = useStore((state: any) => state.dismissHint);

  const itemWidth = 35 * dimensions.fontScale;
  const minWeekCount = Math.ceil(dimensions.width / itemWidth);
  const maxWeekCount = 52 * 10;
  
  const styles = getStyles(itemWidth, dimensions);
  const now = new Date();
  const pastWeekStart = (date: Date, i: number) => binTime("week", date.getTime(), -i, weekStart);

  const firstDpDate: DateList | null = activity.dataPoints[0]?.date || null;
  const lastVisibleWeek = pastWeekStart(now, 0);

  const firstVisibleWeek = firstDpDate ? pastWeekStart(dateListToDate(firstDpDate), 0) : lastVisibleWeek;

  const weekCount = Math.min(maxWeekCount, Math.max(minWeekCount, 1 + Math.round((lastVisibleWeek.getTime() - firstVisibleWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))));
  const positiveTags = calendar.tagFilters.filter((t: TagFilter) => t.state === "yes").map((t: TagFilter) => t.name);
  
  let subUnit: SubUnit;
  switch (activity.unit.type) {
    case "none":
      subUnit = { type: "count" };
      break;
    case "single":
      subUnit = statValueUnit(calendar.value, activity.unit.unit);
      break;
    case "multiple":
      subUnit = statValueUnit(calendar.value, activity.unit.values.find((u: { name: string, unit: SubUnit }) => u.name === calendar.subUnit)?.unit);
      break;
  }

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
        { length: itemWidth, offset: itemWidth * index, index }
      )}
      renderItem={({ item: weekIdx }) => {
        const itemWeekStart = pastWeekStart(now, weekIdx);
        return (
          <View style={styles.weekColumn} key={weekIdx}>
            <View style={styles.monthLabelContainer}>
              {(itemWeekStart.getDate() <= 7  && itemWeekStart.getMonth() > 0) &&
                <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>{`${itemWeekStart.toLocaleDateString('en-US', { month: 'short' })}`}</Text>}
              {(itemWeekStart.getDate() <= 7 && itemWeekStart.getMonth() == 0) &&
                <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>{`${itemWeekStart.toLocaleDateString('en-US', { year: 'numeric' })}`}</Text>}
            </View>
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const day = normalizeDateList([itemWeekStart.getFullYear(), itemWeekStart.getMonth() + 1, itemWeekStart.getDate() + dayIdx]);
              if (cmpDateList(day, dateToDateList(now)) > 0) {
                return;
              }
              const daySlice = findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, day));
              const dayDataAndIndexUnfiltered: [DataPoint, number][] = 
                activity.dataPoints
                  .map((dp: DataPoint, i: number): [DataPoint, number] => [dp, i])
                  .slice(...daySlice)
                  .map(([dp, i]: [DataPoint, number]) => 
                    [dp.date, i, extractValue(dp, calendar.tagFilters, calendar.subUnit)]);
              const dayDataAndIndex = dayDataAndIndexUnfiltered
                  .filter((v: any) => v[2] !== null);
              const value = extractStatValue(dayDataAndIndex.map((v: any) => [v[0], v[2]]), calendar.value, calendar.period, weekStart);
              const hasData = dayDataAndIndexUnfiltered.length > 0;
              const hasFilteredData = dayDataAndIndex.length > 0;
              const isWeekend = [0, 6].includes((itemWeekStart.getDay() + dayIdx) % 7)
              return (
                <TouchableOpacity
                  key={dayIdx}
                  onLongPress={() => {
                    if (activity.unit.type === "none") {
                      dismissHint("quick_check_daily_activity");
                      if (hasFilteredData) {
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
                  <Text style={[styles.dayNumber, { color: theme.colors.outline, backgroundColor: theme.colors.background, zIndex: 10 }]}>
                    {day[2]}
                  </Text>}

                  <View style={
                    {
                      ...styles.daySquareInternal,
                      backgroundColor: hasData ? dayBackground : "#888888",
                      opacity: hasFilteredData ? 1 : hasData ? (isWeekend ? 0.6 : 0.4) : (isWeekend ? 0.5 : 0.3),
                    }
                  }>
                  {hasFilteredData && <Text style={[styles.value, { color: theme.colors.background }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {value !== null ? 
                      (activity.unit.type === "none" && value === 1 ? 
                        "✓" : 
                        renderShortFormValue(value, subUnit)) : 
                      '-'}
                  </Text>}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        );
      }}
    />
  );
};

const getStyles = (itemWidth: number, dimensions: any) => StyleSheet.create({
  calendarContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 16,
  },
  weekColumn: {
    flexDirection: 'column',
    width: itemWidth,
  },
  daySquareInternal: {
    width: itemWidth - ITEM_MARGIN,
    height: itemWidth - ITEM_MARGIN,
    borderRadius: 8,
    marginBottom: ITEM_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  dayNumber: {
    position: 'absolute',
    fontSize: 8 * dimensions.fontScale,
    top: -5 * dimensions.fontScale,
    left: -3 * dimensions.fontScale,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  value: {
    position: 'absolute',
    fontSize: 15 * dimensions.fontScale,
  },
  monthLabelContainer: {
    height: 25 * dimensions.fontScale,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 4 * dimensions.fontScale,
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