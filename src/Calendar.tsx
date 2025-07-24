import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useTheme } from 'react-native-paper';
import { DataPoint, dateListToTime, dateToDateList, normalizeDateList, timeToDateList, DateList } from "./StoreTypes";
import { formatNumber, findZeroSlice, dayCmp } from "./GoalUtil";
import { StatValue } from "./StoreTypes";

type CalendarProps = {
  navigation: any;
  goalName: string;
  palette: string[];
  colorIndex: number;
  dataPoints: [DataPoint, number][];
  firstDpDate: DateList | null;
  displayValue: StatValue;
  subValue: string | null;
};

const ITEM_WIDTH = 35;
const ITEM_MARGIN = 1;
const MIN_WEEK_COUNT = 14;
const MAX_WEEK_COUNT = 520;


const Calendar: React.FC<CalendarProps> = ({ navigation, goalName, palette, colorIndex, dataPoints, firstDpDate, displayValue, subValue }) => {
  const theme = useTheme();
  const dayBackground = palette[colorIndex];
  const now = new Date();

  const pastWeekStart = (date: Date, i: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() - i * 7);

  const lastVisibleWeek = pastWeekStart(now, 0);
  const firstVisibleWeek = firstDpDate ? pastWeekStart(new Date(...firstDpDate), 0) : lastVisibleWeek;

  const weekCount = Math.min(MAX_WEEK_COUNT, Math.max(MIN_WEEK_COUNT, 1 + Math.round((lastVisibleWeek.getTime() - firstVisibleWeek.getTime()) / (7 * 24 * 60 * 60 * 1000))));

  const getValue = (value: number | object) => {
    if (subValue && typeof value === 'object') {
      return value[subValue as keyof typeof value] ?? null;
    } else if (typeof value === 'number') {
      return value;
    } else {
      return null;
    }

  }

  // TODO: deduplicate with Summary calculation
  const extractValue = (dps: DataPoint[]) => {
    if (dps.length === 0) {
      return null;
    }
    switch (displayValue) {
      case "n_points":
        return dps.length;
      case "max":
        {
          let accum: number | null = null;
          dps.forEach((dp) => {
            const value = getValue(dp.value);
            accum = value === null ? accum : accum === null ? value : Math.max(accum, value);
          });
          return accum;
        }
      case "mean":
        {
          let accum: number | null = null;
          dps.forEach((dp) => {
            const value = getValue(dp.value);
            accum = value === null ? accum : accum === null ? value : accum + value;
          });
          return accum === null ? null : accum / dps.length;
        }
      case "sum":
        {
          let accum: number | null = null;
          dps.forEach((dp) => {
            const value = getValue(dp.value);
            accum = value === null ? accum : accum === null ? value : accum + value;
          });
          return accum;
        }
    }
  }

  return (
    <FlatList
      data={Array.from({ length: weekCount }, (_, i) => i)}
      keyExtractor={(_, id) => id.toString()}
      style={styles.scrollView}
      extraData={dataPoints}
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
              const daySlice = findZeroSlice(dataPoints, (dp) => dayCmp(dp, day));
              const dayDataAndIndex = dataPoints.slice(...daySlice);
              const dayData = dayDataAndIndex.map(([dp, _]) => dp);
              const hasData = dayData.length > 0;
              const value = extractValue(dayData);
              return (
                <TouchableOpacity
                  style={[styles.daySquare, hasData ?
                    {
                      backgroundColor: dayBackground,
                    } :
                    {
                      backgroundColor: theme.colors.surfaceDisabled,
                    }
                  ]}
                  key={dayIdx}
                  onPress={() => {
                    if (hasData) {
                      navigation.navigate("GoalData", { goalName, day });
                    } else {
                      navigation.navigate("EditDataPoint", { goalName, newDataPoint: true, newDataPointDate: day });
                    }
                  }}
                  activeOpacity={0.3}
                >
                  {(dayIdx == 0) && 
                  <Text style={[styles.dayNumber, { color: theme.colors.outline, backgroundColor: theme.colors.background }]}>
                    {day[2]}
                  </Text>}

                  <Text style={[styles.value, { color: theme.colors.background }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                    {hasData && (value ? formatNumber(value) : '')}
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