import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, useWindowDimensions } from "react-native";
import {
  dateToDateList,
  normalizeDateList,
  DateList,
  ActivityType,
  TagFilter,
  dateListToDate,
  SubUnit,
  statValueUnit,
  ActivityPath,
  State,
} from "../Model/StoreTypes";
import { findZeroSlice, dayCmp, cmpDateList, extractStatValue, extractValue, binTime } from "../Model/Activity";
import useStore from "../Model/Store";
import { useAppTheme } from "../Model/Theme";
import { useToday } from "../Model/useToday";
import { renderShortFormValue } from "../Model/Unit";
import * as Crypto from "expo-crypto";

type CalendarComponentProps = {
  navigation: any;
  activityPath: ActivityPath;
  calendarIndex: number;
};

const ITEM_MARGIN = 2;

type CalendarDayValue = {
  day: DateList;
  hasData: boolean;
  hasFilteredData: boolean;
  value: number | null;
  isWeekend: boolean;
};

type WeekColumnProps = {
  weekIdx: number;
  now: Date;
  dayValues: CalendarDayValue[];
  navigation: any;
  activityPath: ActivityPath;
  theme: ReturnType<typeof useAppTheme>;
  styles: ReturnType<typeof getStyles>;
  dayBackground: string;
  subUnit: SubUnit;
  positiveTags: string[];
  tagFilters: TagFilter[];
};

const WeekColumnImpl: React.FC<WeekColumnProps> = ({
  weekIdx,
  now,
  dayValues,
  navigation,
  activityPath,
  theme,
  styles,
  dayBackground,
  subUnit,
  positiveTags,
  tagFilters,
}) => {
  const weekStart = useStore((state: any) => state.weekStart);
  const unitType = useStore(
    (state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]?.unit.type,
  );
  const updateActivityDataPoint = useStore((state: any) => state.updateActivityDataPoint);
  const deleteActivityDataPointByDate = useStore((state: any) => state.deleteActivityDataPointByDate);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const nowMs = now.getTime();
  const itemWeekStart = binTime("week", nowMs, -weekIdx, weekStart);
  const today = useToday();
  return (
    <View style={styles.weekColumn}>
      <View style={styles.monthLabelContainer}>
        {itemWeekStart.getDate() <= 7 && itemWeekStart.getMonth() > 0 && (
          <Text
            style={[styles.monthLabel, { color: theme.onSurfaceVariant }]}
          >{`${itemWeekStart.toLocaleDateString("en-US", { month: "short" })}`}</Text>
        )}
        {itemWeekStart.getDate() <= 7 && itemWeekStart.getMonth() == 0 && (
          <Text
            style={[styles.monthLabel, { color: theme.onSurfaceVariant }]}
          >{`${itemWeekStart.toLocaleDateString("en-US", { year: "numeric" })}`}</Text>
        )}
      </View>
      {dayValues.map(({ day, hasData, hasFilteredData, value, isWeekend }, dayIdx) => {
        const isToday = cmpDateList(dateToDateList(today), day) === 0;
        return (
          <TouchableOpacity
            key={dayIdx}
            onLongPress={() => {
              if (unitType === "none") {
                dismissHint("quick_check_daily_activity");
                if (hasFilteredData) {
                  deleteActivityDataPointByDate(activityPath, day, tagFilters);
                } else {
                  updateActivityDataPoint(activityPath, undefined, { date: day, tags: positiveTags, uuid: Crypto.randomUUID(), });
                }
              }
            }}
            onPress={() => {
              if (hasData) {
                navigation.navigate("ActivityData", { activityPath, day });
              } else {
                navigation.navigate("EditDataPoint", {
                  activityPath,
                  inputData: { type: "new", dataPoint: { date: day, tags: positiveTags } },
                });
              }
            }}
            activeOpacity={0.3}
          >
            {dayIdx == 0 && (
              <Text style={[styles.dayNumber, { color: theme.outline, backgroundColor: theme.background, zIndex: 10 }]}>
                {day[2]}
              </Text>
            )}

            <View
              style={styles.daySquareInternal}
            >
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: hasData ? dayBackground : "#888888",
                  opacity: hasFilteredData ? 1 : hasData ? (isWeekend ? 0.6 : 0.4) : isWeekend ? 0.5 : 0.3,
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  // borderWidth: 1,
                }}
              >
                {hasFilteredData && (
                  <Text
                    style={[styles.value, { color: theme.background }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                  >
                    {value !== null
                      ? unitType === "none" && value === 1
                        ? "✓"
                        : renderShortFormValue(value, subUnit)
                      : "-"}
                  </Text>
                )}
              </View>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: 8,
                  borderColor: isToday ? theme.primary : "transparent",
                  borderWidth: isToday ? 2 : 0,
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: 6,
                    borderColor: isToday ? theme.background : "transparent",
                    borderWidth: isToday ? 1.5 : 0,
                  }}
                />
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const dayValuesEqual = (a: CalendarDayValue[], b: CalendarDayValue[]): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i],
      y = b[i];
    if (
      x.hasData !== y.hasData ||
      x.hasFilteredData !== y.hasFilteredData ||
      x.value !== y.value ||
      x.isWeekend !== y.isWeekend ||
      x.day[0] !== y.day[0] ||
      x.day[1] !== y.day[1] ||
      x.day[2] !== y.day[2]
    ) {
      return false;
    }
  }
  return true;
};

const WeekColumn = React.memo(
  WeekColumnImpl,
  (prev, next) =>
    prev.weekIdx === next.weekIdx &&
    prev.now === next.now &&
    prev.navigation === next.navigation &&
    prev.activityPath === next.activityPath &&
    prev.theme === next.theme &&
    prev.styles === next.styles &&
    prev.dayBackground === next.dayBackground &&
    prev.subUnit === next.subUnit &&
    prev.positiveTags === next.positiveTags &&
    prev.tagFilters === next.tagFilters &&
    dayValuesEqual(prev.dayValues, next.dayValues),
);

const Calendar: React.FC<CalendarComponentProps> = ({ navigation, activityPath, calendarIndex }) => {
  const activity: ActivityType = useStore(
    (state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId],
  );
  const calendar = activity.calendars[calendarIndex];
  const theme = useAppTheme(activity.color);
  const dayBackground = theme.primary;
  const weekStart = useStore((state: any) => state.weekStart);
  const dimensions = useWindowDimensions();

  const itemWidth = 35 * dimensions.fontScale;
  const minWeekCount = Math.ceil(dimensions.width / itemWidth);
  const maxWeekCount = 52 * 10;

  const styles = getStyles(itemWidth, dimensions);
  const now = useToday();
  const pastWeekStart = (date: Date, i: number) => binTime("week", date.getTime(), -i, weekStart);

  const firstDpDate: DateList | null = activity.dataPoints[0]?.date || null;
  const lastVisibleWeek = pastWeekStart(now, 0);

  const firstVisibleWeek = firstDpDate ? pastWeekStart(dateListToDate(firstDpDate), 0) : lastVisibleWeek;

  // Hoist .getTime() into locals: two .getTime() calls inline here crash the React Compiler
  // (babel-plugin-react-compiler@1.0.0 codegen bug), making it bail out of the whole component.
  const lastMs = lastVisibleWeek.getTime();
  const firstMs = firstVisibleWeek.getTime();
  const weekCount = Math.min(
    maxWeekCount,
    Math.max(minWeekCount, 1 + Math.round((lastMs - firstMs) / (7 * 24 * 60 * 60 * 1000))),
  );
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
      subUnit = statValueUnit(
        calendar.value,
        (activity.unit.values as any).find((u: { name: string; unit: SubUnit }) => u.name === calendar.subUnit)?.unit,
      );
      break;
  }

  const nowDay = dateToDateList(now);

  const computeWeekDayValues = (weekIdx: number): CalendarDayValue[] => {
    const itemWeekStart = pastWeekStart(now, weekIdx);
    const weekStartDay = itemWeekStart.getDay();
    const days: CalendarDayValue[] = [];
    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const day = normalizeDateList([
        itemWeekStart.getFullYear(),
        itemWeekStart.getMonth() + 1,
        itemWeekStart.getDate() + dayIdx,
      ]);
      if (cmpDateList(day, nowDay) > 0) {
        break;
      }
      const [dayStart, dayEnd] = findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, day));
      const filtered: [DateList, number][] = [];
      for (let k = dayStart; k < dayEnd; k++) {
        const v = extractValue(activity.dataPoints[k], calendar.tagFilters, calendar.subUnit);
        if (v !== null) {
          filtered.push([activity.dataPoints[k].date, v]);
        }
      }
      days.push({
        day,
        hasData: dayEnd > dayStart,
        hasFilteredData: filtered.length > 0,
        value: extractStatValue(filtered, calendar.value, "today", weekStart),
        isWeekend: [0, 6].includes((weekStartDay + dayIdx) % 7),
      });
    }
    return days;
  };

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
      getItemLayout={(_, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
      renderItem={({ item: weekIdx }) => (
        <WeekColumn
          weekIdx={weekIdx}
          now={now}
          dayValues={computeWeekDayValues(weekIdx)}
          navigation={navigation}
          activityPath={activityPath}
          theme={theme}
          styles={styles}
          dayBackground={dayBackground}
          subUnit={subUnit}
          positiveTags={positiveTags}
          tagFilters={calendar.tagFilters}
        />
      )}
    />
  );
};

const getStyles = (itemWidth: number, dimensions: any) =>
  StyleSheet.create({
    calendarContainer: {
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 16,
    },
    weekColumn: {
      flexDirection: "column",
      width: itemWidth,
    },
    daySquareInternal: {
      width: itemWidth - ITEM_MARGIN,
      height: itemWidth - ITEM_MARGIN,
      marginBottom: ITEM_MARGIN,
    },
    dayNumber: {
      position: "absolute",
      fontSize: 8 * dimensions.fontScale,
      top: -5 * dimensions.fontScale,
      left: -3 * dimensions.fontScale,
      paddingHorizontal: 3,
      paddingVertical: 1,
      borderRadius: 4,
    },
    value: {
      position: "absolute",
      fontSize: 15 * dimensions.fontScale,
    },
    monthLabelContainer: {
      height: 25 * dimensions.fontScale,
      alignItems: "center",
      justifyContent: "flex-start",
      marginRight: 4 * dimensions.fontScale,
    },
    monthLabel: {
      fontSize: 12,
      color: "#888",
    },
    scrollView: {
      flex: 1,
    },
  });

export default Calendar;
