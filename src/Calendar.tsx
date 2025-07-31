import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useTheme } from 'react-native-paper';
import { DataPoint, dateListToTime, dateToDateList, normalizeDateList, timeToDateList, DateList, CalendarProps, GoalType, TagFilter } from "./StoreTypes";
import { formatNumber, findZeroSlice, dayCmp, extractStatValue, extractValue } from "./GoalUtil";
import useStore from "./Store";
import { lightPalette, darkPalette } from "./Color";

type CalendarComponentProps = {
  navigation: any;
  goalName: string;
};

const ITEM_WIDTH = 35;
const ITEM_MARGIN = 1;
const MIN_WEEK_COUNT = 14;
const MAX_WEEK_COUNT = 520;


const Calendar: React.FC<CalendarComponentProps> = ({ navigation, goalName }) => {
  const theme = useTheme();
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const dayBackground = palette[goal.color];
  const weekStart = useStore((state: any) => state.weekStart);
  const updateGoalDataPoint = useStore((state: any) => state.updateGoalDataPoint);
  const deleteGoalDataPoint = useStore((state: any) => state.deleteGoalDataPoint);
  
  const now = new Date();
  const pastWeekStart = (date: Date, i: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() - i * 7 + (weekStart == "sunday" ? 0 : 1));

  const firstDpDate: DateList | null = goal.dataPoints[0]?.date || null;
  const lastVisibleWeek = pastWeekStart(now, 0);
  const firstVisibleWeek = firstDpDate ? pastWeekStart(new Date(...firstDpDate), 0) : lastVisibleWeek;

  const weekCount = Math.min(MAX_WEEK_COUNT, Math.max(MIN_WEEK_COUNT, 1 + Math.round((lastVisibleWeek.getTime() - firstVisibleWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))));

  return (
    <FlatList
      data={Array.from({ length: weekCount }, (_, i) => i)}
      keyExtractor={(_, id) => id.toString()}
      style={styles.scrollView}
      extraData={goal.dataPoints}
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
              const daySlice = findZeroSlice(goal.dataPoints, (dp) => dayCmp(dp, day));
              const dayDataAndIndex: [DataPoint, number][] = goal.dataPoints.map((dp: DataPoint, i: number): [DataPoint, number] => [dp, i]).slice(...daySlice);
              const dayData = dayDataAndIndex.map(([dp, _]) => dp);
              const positiveTags = goal.calendar.tagFilters.filter((t: TagFilter) => t.state === "yes").map((t: TagFilter) => t.name);
              const filteredValues: any[] = dayData
                .map((dp: DataPoint) => [dp.date, extractValue(dp, goal.calendar.tagFilters, goal.calendar.subUnit)])
                .filter((v: any) => v[1] !== null);
              const value = extractStatValue(filteredValues, goal.calendar.value);
              const hasData = filteredValues.length > 0;
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
                    if (goal.unit === null) {
                      if (hasData) {
                        deleteGoalDataPoint(goalName, dayDataAndIndex[0][1]);
                      } else {
                        updateGoalDataPoint(goalName, undefined, { date: day, tags: positiveTags });
                      }
                    }
                  }}
                  onPress={() => {
                    if (hasData) {
                      navigation.navigate("GoalData", { goalName, day });
                    } else {
                      navigation.navigate("EditDataPoint", { goalName, newDataPoint: true, newDataPointDate: day, positiveTags });
                    }
                  }}
                  activeOpacity={0.3}
                >
                  {(dayIdx == 0) && 
                  <Text style={[styles.dayNumber, { color: theme.colors.outline, backgroundColor: theme.colors.background }]}>
                    {day[2]}
                  </Text>}

                  <Text style={[styles.value, { color: theme.colors.background }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {hasData && (value !== null ? (goal.unit === null && value === 1 ? "✓" : formatNumber(value)) : '-')}
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