import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  NativeModules,
  ToastAndroid,
} from "react-native";
import useStore from "../../Model/Store";
import { ActivityType, StatValue } from "../../Model/StoreTypes";
import TagMenu from "../TagMenu";
import Calendar from "../Calendar";
import ValueMenu from "../ValueMenu";
import SubUnitMenu from "../SubUnitMenu";
import { getTheme } from "../../Model/Theme";
import { Dialog, Portal, TextInput } from "react-native-paper";
import Hint from "../Hint";
import { CheckButton, CopyButton, Button, DeleteIcon, ButtonRow } from "../Element";

const locale = NativeModules.I18nManager.localeIdentifier;

type ActivityCalendarProps = {
  navigation: any;
  activityName: string;
  calendarIndex: number;
};

export const formatDate = (date: Date) => {
  return date.toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" });
};

const ActivityCalendar = ({ navigation, activityName, calendarIndex }: ActivityCalendarProps) => {
  const activities = useStore((state: any) => state.activities);
  const activity: ActivityType = activities.find((a: ActivityType) => a.name === activityName);
  const calendar = activity.calendars[calendarIndex];
  const theme = getTheme(activity.color);

  const setActivityCalendar = useStore((state: any) => state.setActivityCalendar);
  const cloneActivityCalendar = useStore((state: any) => state.cloneActivityCalendar);
  const deleteActivityCalendar = useStore((state: any) => state.deleteActivityCalendar);
  const dismissHint = useStore((state: any) => state.dismissHint);
  const styles = getStyles(theme);

  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [valueMenuVisible, setValueMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);

  const [calendarDialogVisible, setCalendarDialogVisible] = useState(false);
  const [calendarDialogNameInput, setCalendarDialogNameInput] = useState(calendar.label);

  const subUnitNames = activity.unit.type === "multiple" ? activity.unit.values.map(u => u.name) : null;

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  return (
    <View style={styles.container}>
      <ButtonRow>
        <Button onPress={() => {
          setCalendarDialogVisible(true);
          dismissHint("rename_calendar");
        }}>
          <Text style={styles.headerText}>{calendar.label}</Text>
        </Button>
      </ButtonRow>
      <View style={{ marginVertical: 5 }}>
        {calendarIndex === 0 && activity.dataPoints.length > 20 &&
          <Hint hint="rename_calendar" />}
        <Calendar navigation={navigation} activityName={activityName} calendarIndex={calendarIndex} />
      </View>
      {calendarIndex === 0 && activity.dataPoints.length > 0 && <Hint hint="calendar_introduction" />}
      {calendarIndex === 0 && activity.unit.type === "none" && activity.dataPoints.length > 10 &&
        <Hint hint="quick_check_daily_activity" />}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
        {activity.tags.length > 0 && (
          <TagMenu
            tags={calendar.tagFilters}
            activity={activity}
            onChange={(tags) => {
              setActivityCalendar(activityName, calendarIndex, { ...calendar, tagFilters: tags });
            }}
            menuVisible={tagsMenuVisible}
            setMenuVisible={setTagsMenuVisible}
            activityTags={activity.tags}
          />
        )}
        {/* SubUnit menu */}
        <SubUnitMenu
          subUnitNames={subUnitNames}
          subUnitName={calendar.subUnit}
          setSubUnitName={(name) => setActivityCalendar(activityName, calendarIndex, { ...calendar, subUnit: name })}
          menuVisible={subUnitMenuVisible}
          setMenuVisible={setSubUnitMenuVisible}
          themeColors={theme.colors}
        />
        {activity.unit !== null && <ValueMenu
          value={calendar.value}
          onChange={(v: StatValue) => setActivityCalendar(activityName, calendarIndex, { ...calendar, value: v })}
          menuVisible={valueMenuVisible}
          setMenuVisible={setValueMenuVisible}
          themeColors={theme.colors}
          valueList={["n_points", "sum", "mean", "max", "min", "last"]}
        />}
      </View>
      <Portal>
        <Dialog visible={calendarDialogVisible} onDismiss={() => setCalendarDialogVisible(false)}>
          <Dialog.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TextInput label="Calendar Name" defaultValue={calendarDialogNameInput} onChangeText={setCalendarDialogNameInput} mode="outlined" />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <ButtonRow>
              {activity.calendars.length > 1 && (
                <Button onPress={() => {
                  deleteActivityCalendar(activityName, calendarIndex);
                  setCalendarDialogVisible(false);
                  ToastAndroid.show('Calendar deleted', ToastAndroid.SHORT);
                }}>
                  <DeleteIcon color={theme.colors.onSurface} />
                </Button>
              )}
              <CopyButton onPress={() => {
                cloneActivityCalendar(activityName, calendarIndex);
                setCalendarDialogVisible(false);
                ToastAndroid.show('Calendar cloned', ToastAndroid.SHORT);
              }} color={theme.colors.onSurface} />
              <CheckButton onPress={() => {
                setActivityCalendar(activityName, calendarIndex, { ...calendar, label: calendarDialogNameInput });
                setCalendarDialogVisible(false);
              }} color={theme.colors.onSurface} />
            </ButtonRow>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 15,
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 16,
    color: theme.colors.onSurface,
  },
});

export default ActivityCalendar; 