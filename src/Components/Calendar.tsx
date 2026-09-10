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
import {
  findZeroSlice,
  dayCmp,
  cmpDateList,
  extractStatValue,
  extractValue,
  binTime,
  FUTURE_HORIZON_DAYS,
} from "../Model/Activity";
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
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
/** Weeks of empty future the calendar always keeps scrollable, to plan into */
const MIN_FUTURE_WEEKS = 4;

type CalendarDayValue = {
  day: DateList;
  hasData: boolean;
  hasFilteredData: boolean;
  value: number | null;
  isWeekend: boolean;
  hasNotes: boolean;
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
      {dayValues.map(({ day, hasData, hasFilteredData, value, isWeekend, hasNotes }, dayIdx) => {
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
                  updateActivityDataPoint(activityPath, undefined, {
                    date: day,
                    tags: positiveTags,
                    uuid: Crypto.randomUUID(),
                  });
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

            <View style={styles.daySquare}>
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderColor: theme.background,
                  borderWidth: isToday ? 3 : 0,
                }}
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
                    borderRadius: isToday ? 5 : 8,
                    alignItems: "center",
                    justifyContent: "center",
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
                {hasNotes && (
                  <View style={styles.noteDot}>
                    <View style={styles.noteDotInner} />
                  </View>
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
                  borderColor: theme.primary,
                  borderWidth: isToday ? 2 : 0,
                }}
              />
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
      x.hasNotes !== y.hasNotes ||
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
  const maxFutureWeeks = Math.ceil(FUTURE_HORIZON_DAYS / 7);
  const minWeekCount = Math.ceil(dimensions.width / itemWidth) + maxFutureWeeks;
  const maxWeekCount = 52 * 10;
  // A point can be planned up to the horizon, and the calendar has to be able to reach it

  const styles = getStyles(itemWidth, dimensions, theme);
  const now = useToday();
  const pastWeekStart = (date: Date, i: number) => binTime("week", date.getTime(), -i, weekStart);

  const firstDpDate: DateList | null = activity.dataPoints[0]?.date || null;
  const lastDpDate: DateList | null = activity.dataPoints[activity.dataPoints.length - 1]?.date || null;

  const thisWeek = pastWeekStart(now, 0);
  const firstDataWeek = firstDpDate ? pastWeekStart(dateListToDate(firstDpDate), 0) : thisWeek;
  const lastDataWeek = lastDpDate ? pastWeekStart(dateListToDate(lastDpDate), 0) : thisWeek;

  // Hoist .getTime() into locals: two .getTime() calls inline in one expression crash the
  // React Compiler (babel-plugin-react-compiler@1.0.0 codegen bug), making it bail out of
  // the whole component.
  const thisWeekMs = thisWeek.getTime();
  const firstDataWeekMs = firstDataWeek.getTime();
  const lastDataWeekMs = lastDataWeek.getTime();

  // Weeks drawn ahead of this one: enough to reach the last planned point, and always at
  // least MIN_FUTURE_WEEKS so there is somewhere to plan into
  const futureWeeks = Math.min(
    maxFutureWeeks,
    Math.max(MIN_FUTURE_WEEKS, Math.round((lastDataWeekMs - thisWeekMs) / WEEK_MS)),
  );
  // Weeks drawn behind this one, back to the first point — which may itself be ahead, in
  // which case there is no past to draw
  const pastWeeks = Math.max(0, Math.round((thisWeekMs - firstDataWeekMs) / WEEK_MS));
  const weekCount = Math.min(maxWeekCount, Math.max(minWeekCount, futureWeeks + pastWeeks + 1));
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
      const [dayStart, dayEnd] = findZeroSlice(activity.dataPoints, (dp) => dayCmp(dp, day));
      const filtered: [DateList, number][] = [];
      let hasNotes = false;
      for (let k = dayStart; k < dayEnd; k++) {
        const dp = activity.dataPoints[k];
        const v = extractValue(dp, calendar.tagFilters, calendar.subUnit);
        if (v !== null) {
          filtered.push([dp.date, v]);
        }
        if (dp.note !== undefined) {
          hasNotes = true;
        }
      }
      days.push({
        day,
        hasData: dayEnd > dayStart,
        hasFilteredData: filtered.length > 0,
        value: extractStatValue(filtered, calendar.value, 1),
        isWeekend: [0, 6].includes((weekStartDay + dayIdx) % 7),
        hasNotes,
      });
    }
    return days;
  };

  return (
    <FlatList
      data={Array.from({ length: weekCount }, (_, i) => i - futureWeeks)}
      keyExtractor={(weekIdx) => weekIdx.toString()}
      style={styles.scrollView}
      extraData={activity.dataPoints}
      removeClippedSubviews={true}
      inverted={true}
      windowSize={2}
      horizontal={true}
      getItemLayout={(_, index) => ({ length: itemWidth, offset: itemWidth * index, index })}
      // The list is inverted, so index 0 sits at the right edge: start on the current
      // week and leave the weeks ahead of it off screen to the right
      initialScrollIndex={futureWeeks}
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

const getStyles = (itemWidth: number, dimensions: any, theme: ReturnType<typeof useAppTheme>) =>
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
    daySquare: {
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
    noteDot: {
      position: "absolute",
      top: 3,
      right: 3,
    },
    noteDotInner: {
      width: 4,
      height: 4,
      borderRadius: 2.5,
      backgroundColor: theme.background,
    },
  });

export default Calendar;
