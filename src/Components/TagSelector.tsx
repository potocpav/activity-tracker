import React, { useState, FC, useRef, Fragment } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ToastAndroid,
  Pressable,
} from "react-native";
import { Chip, TextInput, Button, MD3Theme } from 'react-native-paper';
import { ActivityType, dateToDateList, DataPoint, dateListToDate, SubUnit, DateList } from "../Model/StoreTypes";
import useStore from "../Model/Store";
import { DatePickerModal } from "react-native-paper-dates";
import { CalendarDate } from "react-native-paper-dates/lib/typescript/Date/Calendar";
import AntDesign from '@expo/vector-icons/AntDesign';
import { cmpDateList, formatDate } from "../Model/Activity";
import { getTheme, getThemePalette, getThemeVariant } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import { SystemBars } from "react-native-edge-to-edge";
import { numberToString, stringToNumber, renderUnit } from "../Model/Unit";
import { ValueEditor } from "../Components/UnitView";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import Hint from "../Components/Hint";

export const TagSelector = ({ activity, inputTags, toggleInputTag, palette, theme }:
  { 
    activity: ActivityType, 
    inputTags: string[], 
    toggleInputTag: (tag: string) => void, 
    palette: string[], 
    theme: MD3Theme, 
  }) => {
  return (activity.tags.length > 0 && (<View style={{ gap: 10 }}>
    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 16 }}>Tags:</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
      {activity.tags.map((tag: any, index: number) => (
        <Chip
          key={tag.name}
          onPress={() => { toggleInputTag(tag.name); }}
          mode={inputTags.includes(tag.name) ? "flat" : "outlined"}
          style={{
            marginRight: 8,
            marginBottom: 8,
            backgroundColor: inputTags.includes(tag.name) ? palette[tag.color] : theme.colors.surface,
          }}
          textStyle={{
            color: inputTags.includes(tag.name) ? theme.colors.surface : palette[tag.color],
          }}
        >
          {tag.name}
        </Chip>
      ))}
    </View>
  </View>)
  );
}

export default TagSelector;