import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  NativeModules,
  Pressable,
} from "react-native";
import useStore from "./Store";
import { ActivityType, StatValue } from "./StoreTypes";
import TagMenu from "./TagMenu";
import Calendar from "./Calendar";
import ValueMenu from "./ValueMenu";
import SubUnitMenu from "./SubUnitMenu";
import { getTheme } from "./Theme";
import AntDesign from '@expo/vector-icons/AntDesign';
import { Dialog, Portal, TextInput, Button } from "react-native-paper";

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
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const calendar = activity.calendars[calendarIndex];
  const theme = getTheme(activity);

  const setActivityCalendar = useStore((state: any) => state.setActivityCalendar);
  const cloneActivityCalendar = useStore((state: any) => state.cloneActivityCalendar);
  const deleteActivityCalendar = useStore((state: any) => state.deleteActivityCalendar);
  const styles = getStyles(theme);

  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [valueMenuVisible, setValueMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);

  const [calendarDialogVisible, setCalendarDialogVisible] = useState(false);
  const [calendarDialogNameInput, setCalendarDialogNameInput] = useState(calendar.label);

  const subUnitNames = Array.isArray(activity.unit) ? activity.unit.map((u: any) => u.name) : null;

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  return (
    <View style={[styles.container, { paddingHorizontal: 4, backgroundColor: theme.colors.background }]}>
      <View style={styles.headerContainer}>
        <Pressable onPress={() => setCalendarDialogVisible(true)} android_ripple={{ color: theme.colors.outline, foreground: false }}>
          <Text style={styles.headerText}>{calendar.label}</Text>
        </Pressable>
        <Button compact={true} onPress={() => cloneActivityCalendar(activityName, calendarIndex)}>
          <AntDesign name="plus" size={24} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 6 }} /> 
        </Button>
      </View>
      <Calendar navigation={navigation} activityName={activityName} calendarIndex={calendarIndex}/>
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
                <TextInput label="Calendar Name" value={calendarDialogNameInput} onChangeText={setCalendarDialogNameInput} mode="outlined" />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            {activity.calendars.length > 1 && (
              <Button onPress={() => {deleteActivityCalendar(activityName, calendarIndex); setCalendarDialogVisible(false);}}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
            )}
            <Button onPress={() => {setActivityCalendar(activityName, calendarIndex, { ...calendar, label: calendarDialogNameInput }); setCalendarDialogVisible(false);}}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const getStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 16,
  },
  headerContainer: {
    marginHorizontal: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    fontSize: 16,
    padding: 5,
    color: theme.colors.onSurface,
  },
});

export default ActivityCalendar; 