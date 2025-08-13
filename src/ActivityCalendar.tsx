import React, { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  NativeModules,
} from "react-native";
import useStore from "./Store";
import { ActivityType, StatValue } from "./StoreTypes";
import TagMenu from "./TagMenu";
import Calendar from "./Calendar";
import ValueMenu from "./ValueMenu";
import SubUnitMenu from "./SubUnitMenu";
import { getTheme, getThemePalette } from "./Theme";
const locale = NativeModules.I18nManager.localeIdentifier;

type ActivityCalendarProps = {
  navigation: any;
  activityName: string;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};

const ActivityCalendar = ({ navigation, activityName }: ActivityCalendarProps) => {
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const theme = getTheme(activity);

  const setActivityCalendar = useStore((state: any) => state.setActivityCalendar);

  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [valueMenuVisible, setValueMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);

  const subUnitNames = Array.isArray(activity.unit) ? activity.unit.map((u: any) => u.name) : null;

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Calendar navigation={navigation} activityName={activityName}/>
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {activity.tags.length > 0 && (
          <TagMenu
            tags={activity.calendar.tagFilters}
            activity={activity}
            onChange={(tags) => {
              setActivityCalendar(activityName, { ...activity.calendar, tagFilters: tags });
            }}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            activityTags={activity.tags}
          />
        )}
        {/* SubUnit menu */}
        <SubUnitMenu
          subUnitNames={subUnitNames}
          subUnitName={activity.calendar.subUnit}
          setSubUnitName={(name) => setActivityCalendar(activityName, { ...activity.calendar, subUnit: name })}
          menuVisible={subUnitMenuVisible}
          setMenuVisible={setSubUnitMenuVisible}
          themeColors={theme.colors}
        />
        {activity.unit !== null && <ValueMenu
          value={activity.calendar.value}
          onChange={(v: StatValue) => setActivityCalendar(activityName, { ...activity.calendar, value: v })}
          menuVisible={valueMenuVisible}
          setMenuVisible={setValueMenuVisible}
          themeColors={theme.colors}
          valueList={["n_points", "sum", "mean", "max", "min", "last"]}
        />}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 16,
  },
});

export default ActivityCalendar; 