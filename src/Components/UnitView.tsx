import { View, ScrollView, Pressable, StyleSheet, Text } from "react-native";
import {
  ClimbingGrade,
  DistanceUnit,
  SubUnit,
  SubUnitType,
  TimeUnit,
  WeightUnit,
  RatingUnit,
  RatingUnitType,
} from "../Model/StoreTypes";
import { useState } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme, Theme } from "../Model/Theme";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  renderUnit,
  mapStringValue,
  ratingScalePoints,
  uiaaGrades,
  vScaleGrades,
  numberToString,
  stringToNumber,
  ydsGrades,
  frenchGrades,
  fontGrades,
} from "../Model/Unit";
import InputWrapper, { InputWrapperRef } from "../Components/InputWrapper";
import GradeSelection from "./GradeSelection";
import FullScreenDialog from "./FullScreenDialog";
import { CheckButton, CloseButton, MinusIcon, PlusIcon, Button, Switch } from "./Element";
import TextField from "./TextField";
import SegmentedButtons from "./SegmentedButtons";
import Slider from "./Slider";
import StarRating from "./StarRating";
import { ListAccordion, ListItem, IconName, ListIcon } from "./List";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import SmallDialog from "./SmallDialog";

const ratingUnitToString = (ratingUnit: RatingUnitType) => {
  switch (ratingUnit) {
    case "stars":
      return { label: "Stars", description: "★★★★☆" };
    case "likert-scale":
      return { label: "Likert Scale", description: "Agreement and disagreement" };
    case "nrs-11":
      return { label: "NRS-11", description: "Self-reporting of pain" };
    case "rpe":
      return { label: "RPE", description: "Rate of Perceived Exertion" };
    case "hedonic-scale":
      return { label: "Hedonic Scale", description: "Degree of pleasure" };
    case "grading":
      return { label: "Grading", description: "School grading systems" };
  }
};

// A caption naming what the widget below it configures.
const ConfigLabel = ({ label }: { label: string }) => {
  const theme = useAppTheme();
  return <Text style={{ fontSize: 14, color: theme.onSurfaceVariant }}>{label}</Text>;
};

const SwitchRow = ({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => {
  const theme = useAppTheme();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 }}
    >
      <Text style={{ flex: 1, fontSize: 16, color: theme.onSurface }}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </Pressable>
  );
};

// A slider over the steps of a rating scale, with the meaning of the chosen step spelled
// out above it, clear of the thumb the finger is resting on.
const RatingScaleSlider = ({
  ratingUnit,
  value,
  onChange,
  activityColor,
}: {
  ratingUnit: Exclude<RatingUnit, { rating: "stars" }>;
  value: number | null;
  onChange: (value: number) => void;
  activityColor?: number;
}) => {
  const theme = useAppTheme(activityColor);

  // A value from another scale (the unit was changed under an existing value, or the
  // preview outlived a change of levels) is shown as the nearest step of this one.
  const points = ratingScalePoints(ratingUnit);
  const min = points[0].value;
  const max = points[points.length - 1].value;
  const chosen =
    value === null
      ? undefined
      : points.find((point) => point.value === Math.round(Math.min(max, Math.max(min, value))));

  return (
    <View>
      <Text style={{ minHeight: 22, textAlign: "center", fontSize: 14, color: theme.onSurfaceVariant }}>
        {chosen !== undefined && (
          <>
            <Text style={{ fontSize: 16, color: theme.onSurface }}>{chosen.label}</Text>
            {chosen.description !== null && ` \u00b7 ${chosen.description}`}
          </>
        )}
      </Text>
      <Slider min={min} max={max} value={value} onChange={onChange} activityColor={activityColor} />
    </View>
  );
};

// The widget for rating something on a given scale: a row of stars or a slider over the
// scale's steps, with a button on the right that takes the rating back to no value at all
// (as opposed to the lowest one the scale offers).
export const RatingInput = ({
  ratingUnit,
  value,
  onChange,
  activityColor,
}: {
  ratingUnit: RatingUnit;
  value: number | null;
  onChange: (value: number | null) => void;
  activityColor?: number;
}) => {
  const theme = useAppTheme(activityColor);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <View style={{ flex: 1 }}>
        {ratingUnit.rating === "stars" ? (
          <StarRating
            stars={ratingUnit.stars}
            halfStars={ratingUnit.half_stars}
            value={value}
            onChange={onChange}
            activityColor={activityColor}
          />
        ) : (
          <RatingScaleSlider ratingUnit={ratingUnit} value={value} onChange={onChange} activityColor={activityColor} />
        )}
      </View>
      <CloseButton
        onPress={() => onChange(null)}
        color={value === null ? theme.onSurfaceDisabled : theme.onSurfaceVariant}
      />
    </View>
  );
};

// The parameters of one rating scale, i.e. the fields of the chosen RatingUnit constructor.
const RatingUnitConfig = ({
  ratingUnit,
  onChange,
}: {
  ratingUnit: RatingUnit;
  onChange: (ratingUnit: RatingUnit) => void;
}) => {
  // The preview is a working widget, so it carries a value of its own to show off. It
  // starts halfway up the scale, where there is the most to see.
  const [previewValue, setPreviewValue] = useState<number | null>(() => {
    if (ratingUnit.rating === "stars") {
      return Math.ceil(ratingUnit.stars / 2);
    }
    const points = ratingScalePoints(ratingUnit);
    return points[Math.floor(points.length / 2)].value;
  });

  const parameters = (() => {
    switch (ratingUnit.rating) {
      case "stars":
        return (
          <>
            <ConfigLabel label="Number of stars" />
            <SegmentedButtons
              value={ratingUnit.stars.toString()}
              onValueChange={(value) => onChange({ ...ratingUnit, stars: Number(value) as 3 | 5 | 10 })}
              buttons={[
                { value: "3", label: "3" },
                { value: "5", label: "5" },
                { value: "10", label: "10" },
              ]}
            />
            <SwitchRow
              label="Half stars"
              value={ratingUnit.half_stars}
              onValueChange={(half_stars) => onChange({ ...ratingUnit, half_stars })}
            />
          </>
        );
      case "likert-scale":
        return (
          <>
            <ConfigLabel label="Levels of agreement" />
            <SegmentedButtons
              value={ratingUnit.levels.toString()}
              onValueChange={(value) => onChange({ ...ratingUnit, levels: Number(value) as 5 | 7 })}
              buttons={[
                { value: "5", label: "5" },
                { value: "7", label: "7" },
              ]}
            />
          </>
        );
      case "nrs-11":
        return <ConfigLabel label="Fixed scale from 0 (no pain) to 10 (worst pain)" />;
      case "rpe":
        return (
          <>
            <ConfigLabel label="Scale range" />
            <SegmentedButtons
              value={ratingUnit.rpe.toString()}
              onValueChange={(value) => onChange({ ...ratingUnit, rpe: Number(value) as 6 | 10 })}
              buttons={[
                { value: "6", label: "Borg 6\u201320" },
                { value: "10", label: "CR10 0\u201310" },
              ]}
            />
          </>
        );
      case "hedonic-scale":
        return (
          <>
            <ConfigLabel label="Levels of pleasure" />
            <SegmentedButtons
              value={ratingUnit.levels.toString()}
              onValueChange={(value) => onChange({ ...ratingUnit, levels: Number(value) as 5 | 7 })}
              buttons={[
                { value: "5", label: "5" },
                { value: "7", label: "7" },
              ]}
            />
          </>
        );
      case "grading":
        return (
          <>
            <ConfigLabel label="Grading system" />
            <SegmentedButtons
              value={ratingUnit.scale}
              onValueChange={(value) => onChange({ ...ratingUnit, scale: value as "A-F" | "1-5" })}
              buttons={[
                { value: "A-F", label: "A\u2013F" },
                { value: "1-5", label: "1\u20135" },
              ]}
            />
          </>
        );
    }
  })();

  return (
    <>
      {parameters}
      <ConfigLabel label="Preview" />
      <RatingInput ratingUnit={ratingUnit} value={previewValue} onChange={setPreviewValue} />
    </>
  );
};

const subUnitProps = (
  subUnitType: SubUnitType,
  allUnits: SubUnit[],
  setAllUnits: (units: SubUnit[]) => void,
  setRatingUnitDialogVisible: (visible: boolean) => void,
): { title: string; icon: IconName; description: string | null; children: React.ReactNode | null } => {
  switch (subUnitType) {
    case "count":
      return {
        title: "Count",
        icon: "numeric-3-circle-outline",
        description: "reps, sets, etc.",
        children: null,
      };
    case "percentage":
      return {
        title: "Percentage",
        icon: "percent",
        description: null,
        children: null,
      };
    case "rating": {
      const ratingUnit = allUnits.find((unit) => unit.type === "rating");
      return {
        title: "Rating",
        icon: "star",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={() => {
                setRatingUnitDialogVisible(true);
              }}
            >
              <TextField
                label="Rating scale"
                editable={false}
                value={ratingUnit ? ratingUnitToString(ratingUnit.rating).label : ""}
              />
            </Pressable>
            {ratingUnit && (
              <RatingUnitConfig
                ratingUnit={ratingUnit}
                onChange={(newRatingUnit) =>
                  setAllUnits(
                    allUnits.map((unit) => (unit.type === "rating" ? { type: "rating", ...newRatingUnit } : unit)),
                  )
                }
              />
            )}
          </View>
        ),
      };
    }
    case "distance":
      return {
        title: "Distance",
        icon: "ruler",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as DistanceUnit } : unit)),
                );
              }}
              buttons={[
                { value: "mm", label: "mm" },
                { value: "cm", label: "cm" },
                { value: "m", label: "m" },
                { value: "km", label: "km" },
              ]}
            />
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as DistanceUnit } : unit)),
                );
              }}
              buttons={[
                { value: "in", label: "in" },
                { value: "ft", label: "ft" },
                { value: "yd", label: "yd" },
                { value: "mi", label: "mi" },
              ]}
            />
          </View>
        ),
      };
    case "weight":
      return {
        title: "Weight",
        icon: "weight-kilogram",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as WeightUnit } : unit)),
                );
              }}
              buttons={[
                { value: "g", label: "g" },
                { value: "kg", label: "kg" },
              ]}
            />
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as WeightUnit } : unit)),
                );
              }}
              buttons={[
                { value: "oz", label: "oz" },
                { value: "lb", label: "lb" },
              ]}
            />
          </View>
        ),
      };
    case "time":
      return {
        title: "Time",
        icon: "timer",
        description: null,
        children: (
          <SegmentedButtons
            value={allUnits.find((unit) => unit.type === subUnitType)?.unit ?? ""}
            onValueChange={(value) => {
              setAllUnits(
                allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, unit: value as TimeUnit } : unit)),
              );
            }}
            buttons={[
              { value: "seconds", label: "seconds" },
              { value: "hours", label: "hours" },
            ]}
          />
        ),
      };
    case "climbing_grade":
      return {
        title: "Climbing Grade",
        icon: "numeric-9-plus",
        description: null,
        children: (
          <View style={{ gap: 10 }}>
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.grade ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) =>
                    unit.type === subUnitType ? { ...unit, grade: value as ClimbingGrade } : unit,
                  ),
                );
              }}
              buttons={[
                { value: "uiaa", label: "UIAA" },
                { value: "french", label: "French" },
                { value: "yds", label: "YDS" },
              ]}
            />
            <SegmentedButtons
              value={allUnits.find((unit) => unit.type === subUnitType)?.grade ?? ""}
              onValueChange={(value) => {
                setAllUnits(
                  allUnits.map((unit) =>
                    unit.type === subUnitType ? { ...unit, grade: value as ClimbingGrade } : unit,
                  ),
                );
              }}
              buttons={[
                { value: "font", label: "Font" },
                { value: "v-scale", label: "V-Scale" },
              ]}
            />
          </View>
        ),
      };
    case "number":
      return {
        title: "Other",
        icon: "numeric",
        description: "Numerical value",
        children: (
          <InputWrapper>
            <TextField
              label="Unit"
              value={allUnits.find((unit) => unit.type === subUnitType)?.symbol ?? ""}
              onChangeText={(text) =>
                setAllUnits(allUnits.map((unit) => (unit.type === subUnitType ? { ...unit, symbol: text } : unit)))
              }
            />
          </InputWrapper>
        ),
      };
  }
};

const ratingUnitTypes: RatingUnitType[] = ["stars", "likert-scale", "nrs-11", "rpe", "hedonic-scale", "grading"];

const defaultRatingUnit = (ratingUnitType: RatingUnitType): RatingUnit => {
  switch (ratingUnitType) {
    case "stars":
      return { rating: "stars", stars: 5, half_stars: false };
    case "likert-scale":
      return { rating: "likert-scale", levels: 5 };
    case "nrs-11":
      return { rating: "nrs-11" };
    case "rpe":
      return { rating: "rpe", rpe: 6 };
    case "hedonic-scale":
      return { rating: "hedonic-scale", levels: 5 };
    case "grading":
      return { rating: "grading", scale: "A-F" };
  }
};

export const UnitEditor = ({
  unit,
  activityColor,
  onChange,
}: {
  unit: SubUnit | null;
  activityColor?: number;
  onChange: (unit: SubUnit | null) => void;
}) => {
  const [unitDialogVisible, setUnitDialogVisible] = useState(false);
  const theme = useAppTheme(activityColor);
  const styles = getStyles(theme);

  const [chosenUnitType, setChosenUnitType] = useState<SubUnitType | null>(unit?.type ?? null);
  const [ratingUnitDialogVisible, setRatingUnitDialogVisible] = useState(false);
  const [allUnits, setAllUnits] = useState<SubUnit[]>(
    (() => {
      let defaultUnits: SubUnit[] = [
        { type: "count" },
        { type: "percentage" },
        { type: "rating", rating: "stars", stars: 5, half_stars: false },
        { type: "distance", unit: "km" },
        { type: "weight", unit: "kg" },
        { type: "time", unit: "seconds" },
        { type: "climbing_grade", grade: "french" },
        // { type: "rating", rating: "stars", stars: 5, half_stars: false },
        { type: "number", symbol: "" },
      ];
      return defaultUnits.map((defaultUnit) => (unit?.type === defaultUnit.type ? unit : defaultUnit));
    })(),
  );

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Pressable
        onPress={() => setUnitDialogVisible(true)}
        style={({ pressed }) => [
          {
            flex: 1,
            opacity: pressed ? 0.7 : 1,
          },
        ]}
      >
        <TextField
          containerStyle={{ flex: 1 }}
          label="Unit"
          value={unit === null ? "" : renderUnit(unit)}
          editable={false}
        />
      </Pressable>
      <FullScreenDialog
        visible={unitDialogVisible}
        title="Select Unit"
        activityColor={activityColor}
        onDismiss={() => setUnitDialogVisible(false)}
        headerRight={
          <CheckButton
            onPress={() => {
              setUnitDialogVisible(false);
              const newUnitInput = allUnits.find((unit) => unit.type === chosenUnitType) ?? null;
              onChange(newUnitInput);
            }}
            color={theme.onHeader}
          />
        }
      >
        <ScrollView>
          <View style={styles.unitList}>
            {allUnits.map((subUnit) => {
              const { title, icon, description, children } = subUnitProps(
                subUnit.type,
                allUnits,
                setAllUnits,
                setRatingUnitDialogVisible,
              );
              if (children) {
                return (
                  <ListAccordion
                    key={subUnit.type}
                    title={title}
                    titleColor={chosenUnitType === subUnit.type ? theme.primary : theme.onSurface}
                    icon={icon}
                    description={description}
                    expanded={chosenUnitType === subUnit.type}
                    onPress={() => setChosenUnitType(chosenUnitType === subUnit.type ? null : subUnit.type)}
                  >
                    {children}
                  </ListAccordion>
                );
              } else {
                return (
                  <ListItem
                    key={subUnit.type}
                    title={title}
                    titleColor={chosenUnitType === subUnit.type ? theme.primary : theme.onSurface}
                    onPress={() => setChosenUnitType(subUnit.type)}
                    icon={icon}
                    description={description}
                  />
                );
              }
            })}
          </View>
        </ScrollView>
      </FullScreenDialog>
      <SmallDialog visible={ratingUnitDialogVisible} onDismiss={() => setRatingUnitDialogVisible(false)} theme={theme}>
        <ScrollView>
          {ratingUnitTypes.map((ratingUnitType) => {
            const selected = allUnits.find((unit) => unit.type === "rating")?.rating === ratingUnitType;
            return (
              <Pressable
                key={ratingUnitType}
                onPress={() => {
                  setRatingUnitDialogVisible(false);
                  // setAllUnits(allUnits.map((unit) => (unit.type === "rating" ? { ...unit, rating: ratingUnitType } : unit)));
                }}
              >
                <ListItem
                  title={ratingUnitToString(ratingUnitType).label}
                  titleColor={selected ? theme.primary : theme.onSurface}
                  description={ratingUnitToString(ratingUnitType).description}
                  right={<ListIcon name={selected ? "radiobox-marked" : "radiobox-blank"} />}
                  onPress={() => {
                    setRatingUnitDialogVisible(false);
                    setAllUnits(
                      allUnits.map((unit) =>
                        unit.type === "rating" ? { type: "rating", ...defaultRatingUnit(ratingUnitType) } : unit,
                      ),
                    );
                  }}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </SmallDialog>
    </View>
  );
};

export const ValueEditor = ({
  unit,
  label,
  value,
  error,
  inputWrapperRef,
  activityColor,
  onChange,
  setSubmitDisabled, // whether to disable submitting the value
}: {
  unit: SubUnit;
  label: string;
  value: string;
  error: string | null;
  inputWrapperRef: React.RefObject<InputWrapperRef>;
  activityColor: number;
  onChange: (value: string) => void;
  setSubmitDisabled: (disabled: string | null) => void;
}) => {
  const theme = useAppTheme();

  const [gradeSelectionVisible, setGradeSelectionVisible] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const [timerInterval, setTimerInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = () => {
    setTimerActive(false);
    setTimerStartTime(null);
    setNow(null);
    setSubmitDisabled(null);
    onChange(numberToString(0, unit));
  };

  const toggleTimer = (timeUnit: TimeUnit) => {
    const timeFactor = timeUnit === "hours" ? 3600e3 : 1e3;
    if (timerActive) {
      // stop timer
      onChange(addTimerToValue(value));
      setTimerActive(false);
      setTimerStartTime(null);
      setSubmitDisabled(null);
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    } else {
      // start timer
      if (value === "") {
        onChange(numberToString(0, unit));
      }
      setTimerActive(true);
      setTimerStartTime(Date.now() / timeFactor);
      setNow(Date.now() / timeFactor);
      setSubmitDisabled("Timer is running");

      setTimerInterval(
        setInterval(() => {
          setNow(Date.now() / timeFactor);
        }, 200),
      );
    }
  };

  const addTimerToValue = (val: string) => {
    return numberToString((stringToNumber(val, unit) ?? 0) + ((now ?? 0) - (timerStartTime ?? 0)), unit);
  };

  const gradePicker = (options: string[]) => {
    return (
      <>
        <Pressable
          onPress={() => setGradeSelectionVisible(true)}
          style={({ pressed }) => [
            {
              flex: 1,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <TextField
            label={label}
            value={value}
            onChangeText={(text) => onChange(text)}
            keyboardType="numeric"
            editable={false}
            activityColor={activityColor}
          />
        </Pressable>
        <GradeSelection
          activityColor={activityColor}
          visible={gradeSelectionVisible}
          options={options}
          value={value}
          onSelect={onChange}
          onDismiss={() => setGradeSelectionVisible(false)}
        />
      </>
    );
  };

  const showTimePicker = () => {
    const valueHours = stringToNumber(value, unit);
    DateTimePickerAndroid.open({
      mode: "time",
      is24Hour: true,
      value: valueHours
        ? new Date(
            0,
            0,
            0,
            Math.floor((valueHours ?? 0) + 1 / 120),
            Math.floor((((valueHours ?? 0) + 1 / 120) % 1) * 60),
          )
        : new Date(),
      onChange: (event, selectedDate) => {
        if (selectedDate !== undefined) {
          const newValue = selectedDate.getHours() + selectedDate.getMinutes() / 60;
          onChange(numberToString(newValue, unit));
        }
      },
    });
  };

  return (
    <InputWrapper error={error} ref={inputWrapperRef}>
      <View style={{ flex: 1, flexDirection: "row", alignItems: "flex-end", gap: 8, marginVertical: 4 }}>
        {(() => {
          switch (unit.type) {
            case "time":
              switch (unit.unit) {
                case "hours":
                  return (
                    <>
                      <TextField
                        containerStyle={{ flex: 1 }}
                        label={label}
                        value={value}
                        onChangeText={onChange}
                        activityColor={activityColor}
                      />
                      <Button onPress={() => showTimePicker()}>
                        <MaterialCommunityIcons name="timer" size={22} color={theme.onSurface} />
                      </Button>
                    </>
                  );
                case "seconds":
                  return (
                    <>
                      <TextField
                        containerStyle={{ flex: 1 }}
                        label={label}
                        value={timerActive ? addTimerToValue(value) : value}
                        editable={!timerActive}
                        onChangeText={onChange}
                        activityColor={activityColor}
                      />
                      <Button onPress={() => resetTimer()}>
                        <MaterialCommunityIcons name="reload" size={22} color={theme.onSurface} />
                      </Button>
                      <Button onPress={() => toggleTimer(unit.unit)}>
                        <MaterialCommunityIcons
                          name={timerActive ? "pause" : "play"}
                          size={22}
                          color={theme.onSurface}
                        />
                      </Button>
                    </>
                  );
                default:
                  return null;
              }
            case "count":
              return (
                <>
                  <TextField
                    containerStyle={{ flex: 1 }}
                    label={label}
                    value={value}
                    onChangeText={(text) => onChange(text)}
                    keyboardType="numeric"
                    activityColor={activityColor}
                  />
                  <Button onPress={() => onChange(mapStringValue(unit, value, (v) => v - 1))}>
                    <MinusIcon color={theme.onSurface} />
                  </Button>
                  <Button onPress={() => onChange(mapStringValue(unit, value, (v) => v + 1))}>
                    <PlusIcon color={theme.onSurface} />
                  </Button>
                </>
              );
            case "rating":
              return (
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, marginBottom: 4, color: theme.onSurfaceVariant }}>{label}</Text>
                  <RatingInput
                    ratingUnit={unit}
                    value={stringToNumber(value, unit)}
                    onChange={(rating) => onChange(numberToString(rating, unit))}
                    activityColor={activityColor}
                  />
                </View>
              );
            case "climbing_grade":
              switch (unit.grade) {
                case "uiaa":
                  return gradePicker(uiaaGrades);
                case "yds":
                  return gradePicker(ydsGrades);
                case "french":
                  return gradePicker(frenchGrades);
                case "font":
                  return gradePicker(fontGrades);
                case "v-scale":
                  return gradePicker(vScaleGrades);
              }
            default:
              return (
                <TextField
                  containerStyle={{ flex: 1 }}
                  label={label}
                  value={value}
                  onChangeText={(text) => onChange(text)}
                  keyboardType="numeric"
                  activityColor={activityColor}
                />
              );
          }
        })()}
      </View>
    </InputWrapper>
  );
};

const getStyles = (theme: Theme) =>
  StyleSheet.create({
    unitList: {
      gap: 10,
      padding: 10,
    },
  });
