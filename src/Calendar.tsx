import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useTheme } from 'react-native-paper';
import { DataPoint } from "./StoreTypes";
import { formatNumber, searchInterval } from "./GoalUtil";
import { Value } from "./ValueMenu";
type CalendarProps = {
  goalName: string;
  palette: string[];
  colorIndex: number;
  dataPoints: [DataPoint, number][];
  firstDpTime: number | null;
  displayValue: Value;
  subValue: string | null;
};

const ITEM_HEIGHT = 50;
const ITEM_MARGIN = 2;
const ITEM_TOP_MARGIN = 4;
const MIN_WEEK_COUNT = 20;
const MAX_WEEK_COUNT = 520;


const Calendar: React.FC<CalendarProps> = ({ goalName, palette, colorIndex, dataPoints, firstDpTime, displayValue, subValue }) => {
  const theme = useTheme();
  const dayBackground = palette[colorIndex];
  const now = new Date();

  const pastWeekStart = (date: Date, i: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() - i * 7);

  const lastVisibleWeek = pastWeekStart(now, 0);
  const firstVisibleWeek = firstDpTime ? pastWeekStart(new Date(firstDpTime), 0) : lastVisibleWeek;

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

  const extractValue = (dps: DataPoint[]) => {
    if (dps.length === 0) {
      return null;
    }
    switch (displayValue) {
      case "Count":
        return dps.length;
      case "Max":
        {
          let accum: number | null = null;
          dps.forEach((dp) => {
            const value = getValue(dp.value);
            accum = value === null ? accum : accum === null ? value : Math.max(accum, value);
          });
          return accum;
        }
      case "Mean":
        {
          let accum: number | null = null;
          dps.forEach((dp) => {
            const value = getValue(dp.value);
            accum = value === null ? accum : accum === null ? value : accum + value;
          });
          return accum === null ? null : accum / dps.length;
        }
      case "Sum":
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
      getItemLayout={(_, index) => (
        { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
      )}
      renderItem={({ item: weekIdx }) => {
        const weekStart = pastWeekStart(now, weekIdx);
        return (
          <View style={styles.weekRow} key={weekIdx}>
            <View style={styles.monthLabelContainer}>
              {(weekStart.getDate() <= 7) &&
                <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>{`${weekStart.toLocaleDateString('en-US', { month: 'short' })}`}</Text>}
              {(weekStart.getDate() <= 7 && weekStart.getMonth() == 1) &&
                <Text style={[styles.monthLabel, { color: theme.colors.onSurfaceVariant }]}>{`${weekStart.toLocaleDateString('en-US', { year: 'numeric' })}`}</Text>}
            </View>
            {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
              const day = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayIdx);
              if (day > now) {
                return;
              }
              const dayDataRange = searchInterval(dataPoints, (dp) => {
                const dpDate = new Date(dp[0].time);
                if (dpDate.getFullYear() == day.getFullYear() && dpDate.getMonth() == day.getMonth() && dpDate.getDate() == day.getDate()) {
                  return 0;
                } else {
                  return dpDate.getTime() - day.getTime();
                }
              });
              const dayDataAndIndex = dayDataRange ? dataPoints.slice(dayDataRange.first, dayDataRange.last + 1) : [];
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
                  onPress={() => console.log('Day pressed:', dayIdx)}
                  activeOpacity={0.3}
                >
                  {(dayIdx == 0) && <Text style={[styles.dayNumber, { color: theme.colors.outline, backgroundColor: theme.colors.background }]}>{day.getDate()}</Text>}

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
  weekRow: {
    flexDirection: 'row',
    height: ITEM_HEIGHT,
  },
  daySquare: {
    width: 44,
    height: ITEM_HEIGHT - ITEM_MARGIN - ITEM_TOP_MARGIN,
    borderRadius: 8,
    marginHorizontal: ITEM_MARGIN,
    marginBottom: ITEM_MARGIN,
    marginTop: ITEM_TOP_MARGIN,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  dayNumber: {
    position: 'absolute',
    fontSize: 8,
    marginBottom: 2,
    marginTop: -35,
    marginLeft: -33,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
  },
  value: {
    position: 'absolute',
    fontSize: 15,
    fontWeight: 'bold',
    // marginTop: 10,
  },
  monthLabelContainer: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
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