import React, { useState } from "react";
import { View, Text, useWindowDimensions, StyleSheet, ToastAndroid, Pressable } from "react-native";
import { Menu, Portal, Dialog, TextInput } from 'react-native-paper';
import useStore from "../../Model/Store";
import { DataPoint, dateListToTime, ActivityType, GraphType, WeekStart, DateList, SubUnit, GraphProps, Unit, BinSize, BinnableSize, ActivityPath, State } from "../../Model/StoreTypes";
import { binTime, binTimeSeries, cmpDateList, extractValue } from "../../Model/Activity";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import TagMenu from "../TagMenu";
import SubUnitMenu from "../SubUnitMenu";
import DropdownMenu from "../DropdownMenu";
import { useAppTheme } from "../../Model/Theme";
import FlatListChart, { BarChart, BoxChart, barBoundingBox, ViewDimensions } from "../Chart/FlatListChart";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { renderLongFormValue, isSummable } from "../../Model/Unit";
import { Canvas, Line, vec } from "@shopify/react-native-skia";
import { ChevronDownIcon, DeleteButton, ButtonRow, CopyButton, CheckButton, Button } from "../Element";


const ActivityGraph = ({ activityPath, graphIndex }: { activityPath: ActivityPath, graphIndex: number }) => {
  const activity: ActivityType = useStore((state: State) => state.activities[activityPath.tabId]?.activities[activityPath.activityId]);
  const graph = activity.graphs[graphIndex];
  const weekStart = useStore((state: any) => state.weekStart);
  const theme = useAppTheme(activity.color);

  const setActivityGraph = useStore((state: any) => state.setActivityGraph);
  const cloneActivityGraph = useStore((state: any) => state.cloneActivityGraph);
  const deleteActivityGraph = useStore((state: any) => state.deleteActivityGraph);

  const styles = getStyles(theme);

  const subUnitNames = activity.unit.type === "multiple" ? activity.unit.values.map(u => u.name) : null;

  const [binMenuVisible, setBinMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [graphTypeMenuVisible, setGraphTypeMenuVisible] = useState(false);

  const [graphDialogVisible, setGraphDialogVisible] = useState(false);
  const [graphDialogNameInput, setGraphDialogNameInput] = useState(graph.label);

  const graphLabel = (gType: any) => {
    if (gType === "box") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="chart-waterfall" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Box</Text>
        </View>
      );
    } else if (gType === "bar-count") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Count</Text>
        </View>
      );
    } else if (gType === "bar-daily-mean") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Daily Mean</Text>
        </View>
      );
    } else if (gType === "bar-sum") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="chart-bar" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Sum</Text>
        </View>
      );
    } else if (gType === "line-mean") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="chart-line" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Mean</Text>
        </View>
      );
    }
  }

  let binningLabels;
  if (activity.unit.type === "none") {
    binningLabels = {
      day: "Day",
      week: "Week",
      month: "Month",
      quarter: "Quarter",
      year: "Year"
    };
  } else {
    binningLabels = {
      point: "Point",
      day: "Day",
      week: "Week",
      month: "Month",
      quarter: "Quarter",
      year: "Year"
    };
  }
  const binningOptions = Object.entries(binningLabels).map(([key, label]) => ({ key, label }));

  const graphTypes = activity.unit.type === "none" ? ["bar-count", "bar-daily-mean"] : ["box", "bar-count", "bar-sum"];

  return (
    <View style={styles.container}>
      <ButtonRow>
        <Button onPress={() => setGraphDialogVisible(true)}>
          <Text style={styles.headerText}>{graph.label}</Text>
        </Button>
      </ButtonRow>
      <View key="activityGraph">
        <ActivityChart
          key={`activityChart-${graph.binSize}`}
          height={300}
          graph={graph}
          dataPoints={activity.dataPoints}
          activityUnit={activity.unit}
          weekStart={weekStart}
          theme={theme}
        />
      </View>
      <View key="menusRow" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Binning menu */}
        <DropdownMenu
          options={binningOptions}
          selectedKey={graph.binSize}
          onSelect={(key) => {
            setActivityGraph(activityPath, graphIndex, { ...graph, binSize: key as BinSize });
          }}
          visible={binMenuVisible}
          setVisible={setBinMenuVisible}
          themeColors={theme.colors}
        />
        {/* SubUnit menu */}
        <SubUnitMenu
          subUnitNames={subUnitNames}
          subUnitName={graph.subUnit}
          setSubUnitName={(name) => setActivityGraph(activityPath, graphIndex, { ...graph, subUnit: name })}
          menuVisible={subUnitMenuVisible}
          setMenuVisible={setSubUnitMenuVisible}
          themeColors={theme.colors}
        />
        {/* Tags menu */}
        <TagMenu
          tags={graph.tagFilters}
          onChange={(tags) => setActivityGraph(activityPath, graphIndex, { ...graph, tagFilters: tags })}
          menuVisible={tagsMenuVisible}
          setMenuVisible={setTagsMenuVisible}
          activityTags={activity.tags}
          activity={activity}
        />
        {/* Graph type menu */}
        <Menu
          key={graphTypeMenuVisible ? "open" : "closed"}
          visible={graphTypeMenuVisible}
          onDismiss={() => setGraphTypeMenuVisible(false)}
          anchor={
            <Button onPress={() => setGraphTypeMenuVisible(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                {graphLabel(graph.graphType)}
                <ChevronDownIcon color={theme.colors.onSurfaceVariant} />
              </View>
            </Button>
          }
        >
          {graphTypes.map((type) => (
            <Menu.Item
              key={type}
              onPress={() => {
                setGraphTypeMenuVisible(false);
                setActivityGraph(activityPath, graphIndex, { ...graph, graphType: type as GraphType });
              }}
              title={<View style={{ flexDirection: 'row', alignItems: 'center' }}>{graphLabel(type)}</View>}
              trailingIcon={graph.graphType === type ? "check" : undefined}
            />
          ))}
        </Menu>
      </View>
      <Portal>
        <Dialog visible={graphDialogVisible} onDismiss={() => setGraphDialogVisible(false)}>
          <Dialog.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <TextInput label="Graph Name" defaultValue={graphDialogNameInput} onChangeText={setGraphDialogNameInput} mode="outlined" />
              </View>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <ButtonRow>
              {activity.graphs.length > 1 && (
                <DeleteButton onPress={() => {
                  deleteActivityGraph(activityPath, graphIndex);
                  setGraphDialogVisible(false);
                  ToastAndroid.show('Graph deleted', ToastAndroid.SHORT);
                }} color={theme.colors.onSurface} />
              )}
              <CopyButton onPress={() => {
                cloneActivityGraph(activityPath, graphIndex);
                setGraphDialogVisible(false);
                ToastAndroid.show('Graph cloned', ToastAndroid.SHORT);
              }} color={theme.colors.onSurface} />
              <CheckButton onPress={() => {
                setActivityGraph(activityPath, graphIndex, { ...graph, label: graphDialogNameInput });
                setGraphDialogVisible(false);
              }} color={theme.colors.onSurface} />
            </ButtonRow>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const xLabel = (t: number, binSize: BinSize, dayIndex?: number) => {
  const d = new Date(t);
  switch (binSize) {
    case "point": {
      if (dayIndex !== undefined && dayIndex === 0) {
        const date = d.getDate();
        return date > 1 ? `${date}` : `${date}\n${d.toLocaleString('default', { month: 'short' })}`;
      } else {
        return "";
      }
    }
    case "day": {
      const date = d.getDate();
      return date > 1 ? `${date}` : `${date}\n${d.toLocaleString('default', { month: 'short' })}`;
    }
    case "week": {
      const date = d.getDate();
      return date > 7 ? `${date}` : `${date}\n${d.toLocaleString('default', { month: 'short' })}`;
    }
    case "month": {
      const m = d.getMonth() + 1;
      return m > 1 ? `${m}` : `${m}\n'${d.getFullYear() % 100}`;
    }
    case "quarter": {
      const q = d.getMonth() / 3 + 1;
      return q > 1 ? `q${q}` : `q${q}\n'${d.getFullYear() % 100}`;
    }
    case "year": {
      return `'${d.getFullYear() % 100}`;
    }
  }
};

const StatBox = ({
  theme,
  unit,
  stats,
  onPress,
}: {
  theme: any,
  unit: SubUnit,
  stats: Stats,
  onPress: () => void,
}) => {
  return (
    <View style={{ position: 'relative' }}>
      <Animated.View
        key="stats"
        entering={FadeInUp}
        exiting={FadeOutUp}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          left: 0,
          minHeight: 60,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 8,
          padding: 8,
          backgroundColor: theme.colors.surface,
          elevation: 1,
          flexDirection: 'column',
          zIndex: 1,
        }}>
        <Pressable style={{ flex: 1 }} onPress={onPress}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Text style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                Count: {Math.round(stats.count)}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 100 }}>
              <Text style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                Mean: {isFinite(stats.mean) ? renderLongFormValue(stats.mean, unit) : "-"}
              </Text>
            </View>
          </View>
          {stats.regression && (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ flex: 1, minWidth: 100 }}>
                <Text style={{ color: theme.colors.onSurface }} numberOfLines={1}>
                  {`${stats.regression.slope >= 0 ? "+" : ""}${renderLongFormValue(stats.regression.slope * 1e3 * 3600 * 24 * 30, unit)} per month`}
                </Text>
              </View>
            </View>
          )}
        </Pressable>
      </Animated.View>
    </View>
  );
}


const SelectedRangeBox = ({
  theme,
  selectedRange,
  index,
  view,
  cornerRadius,
}: {
  theme: any,
  selectedRange: { min: number, max: number },
  index: number,
  view: ViewDimensions,
  cornerRadius: number,
}) => {
  return (
    <View
      style={{
        position: 'absolute',
        ...view,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderRightWidth: index === selectedRange.min ? 1 : 0,
        borderLeftWidth: index === selectedRange.max ? 1 : 0,
        borderTopRightRadius: index === selectedRange.min ? cornerRadius : 0,
        borderBottomLeftRadius: index === selectedRange.max ? cornerRadius : 0,
        borderTopLeftRadius: index === selectedRange.max ? cornerRadius : 0,
        borderBottomRightRadius: index === selectedRange.min ? cornerRadius : 0,
        borderColor: theme.colors.outline,
        borderWidth: 1,
        opacity: selectedRange.max >= index && selectedRange.min <= index ? 1 : 0,
      }}
    />
  );
}

type Stats = {
  regression: { slope: number, intercept: number } | null,
  mean: number,
  count: number,
}

const RegressionLine = ({
  theme,
  regression,
  time,
  view,
  weekStart,
  binSize,
}: {
  theme: any,
  regression: { slope: number, intercept: number },
  time: number,
  view: ViewDimensions,
  weekStart: WeekStart,
  binSize: BinnableSize,
}) => {
  const x0 = binTime(binSize, time, -1, weekStart).getTime();
  const x1 = binTime(binSize, time, 1, weekStart).getTime();
  const y0 = view.yToPx(regression.intercept + regression.slope * x0);
  const y1 = view.yToPx(regression.intercept + regression.slope * x1);
  return (
    <Canvas style={{ position: 'absolute', ...view }}>
      <Line
        p1={vec(-view.width / 2, y0)}
        p2={vec(view.width * 3 / 2, y1)}
        color={theme.colors.outline}
        strokeWidth={2}
        strokeCap="round"
      />
    </Canvas>
  );
};

type ActivityChart = {
  height: number,
  graph: GraphProps,
  dataPoints: DataPoint[],
  activityUnit: Unit,
  weekStart: WeekStart,
  theme: any,
}

const linearRegression = (values: { x: number, y: number }[]) => {
  const sum = (v: number[]) => v.reduce((acc, v) => acc + v, 0);
  const sx = sum(values.map((v) => v.x));
  const sy = sum(values.map((v) => v.y));
  const sxx = sum(values.map((v) => v.x * v.x));
  const syy = sum(values.map((v) => v.y * v.y));
  const sxy = sum(values.map((v) => v.x * v.y));
  const n = values.length;
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  return { slope, intercept };
}

const ActivityChart = (
  {
    height,
    graph,
    dataPoints,
    activityUnit,
    weekStart,
    theme,
  }:
    ActivityChart
) => {
  const windowDimensions = useWindowDimensions();

  const [selectedRange, setSelectedRange] = useState<{ min: number, max: number } | null>(null);

  const filteredValues: { date: DateList, value: number }[] = dataPoints
    .map((dp: DataPoint) => ({
      date: dp.date,
      value: extractValue(dp, graph.tagFilters, graph.subUnit)
    }
    ))
    .filter(x => x.value !== null) as { date: DateList, value: number }[];

  let items: { time: number, values: any[], nDays: number, dayIndex?: number }[];
  if (graph.binSize === "point") {
    items = [];
    let dayIndex = 0;
    let lastDate = null;
    for (let i = 0; i < filteredValues.length; i++) {
      if (lastDate === null || cmpDateList(lastDate, filteredValues[i].date) !== 0) {
        lastDate = filteredValues[i].date;
        dayIndex = 0;
      } else {
        dayIndex++;
      }
      items.push({ time: dateListToTime(filteredValues[i].date), values: [filteredValues[i].value], nDays: 1, dayIndex });
    }
    items.reverse();
  } else {
    items = binTimeSeries(graph.binSize as BinnableSize, filteredValues, weekStart).reverse();
  }

  let unit: SubUnit;
  if (graph.graphType === "bar-count") {
    unit = { type: "count" };
  } else if (graph.graphType === "bar-daily-mean") {
    unit = { type: "percentage" };
  } else {
    switch (activityUnit.type) {
      case "none":
        unit = { type: "count" };
        break;
      case "single":
        unit = activityUnit.unit;
        break;
      case "multiple":
        unit = activityUnit.values.find((u) => u.name === graph.subUnit)?.unit ?? { type: "number", symbol: "n/a" };
        break;
    }
  }

  let selectionStats: Stats | null = null;
  if (selectedRange) {
    let rangeValues: { x: number, y: number }[] = [];
    let regression: { slope: number, intercept: number } | null = null;
    const rangeItems = items.slice(selectedRange.min, selectedRange.max + 1);
    switch (graph.graphType) {
      case "bar-daily-mean":
        rangeValues = rangeItems.map((item) => ({ x: item.time, y: item.values.length * 100 / item.nDays }));
        break;
      case "bar-sum":
        rangeValues = rangeItems.map((item) => ({ x: item.time, y: item.values.reduce((a: number, b: number) => a + b, 0) }));
        break;
      case "bar-count":
        rangeValues = rangeItems.map((item) => ({ x: item.time, y: item.values.length }));
        break;
      case "box":
        rangeValues = rangeItems.map((item) => item.values.map((y) => ({ x: item.time, y }))).flat();
        break;
    }
    if (isSummable(unit) && rangeItems.length >= 1 && graph.binSize !== "point") {
      const { slope, intercept } = linearRegression(rangeValues);
      if (isSummable(unit) && selectedRange.max - selectedRange.min >= 1 && isFinite(slope) && isFinite(intercept)) {
        regression = { slope, intercept };
      }
    }
    selectionStats = {
      regression: regression,
      mean: rangeValues.reduce((a, b) => a + b.y, 0) / rangeValues.length,
      count: rangeItems.reduce((a, b) => a + b.values.length, 0),
    };
  }

  let renderItem;
  let itemBoundingBox;
  switch (graph.graphType) {
    case "bar-count":
    case "bar-sum":
    case "bar-daily-mean": {
      let value: (item: any) => number | null;
      switch (graph.graphType) {
        case "bar-count":
          value = (item: any) => item.values.length > 0 ? item.values.length : null;
          break;
        case "bar-sum":
          value = (item: any) => item.values.length > 0 ? item.values.reduce((a: number, b: number) => a + b, 0) : null;
          break;
        case "bar-daily-mean":
          value = (item: any) => item.values.reduce((a: number, b: number) => a + b, 0) / item.nDays * 100;
          break;
      }
      renderItem = ({ item, index, view }: { item: any, index: number, view: ViewDimensions }) => (
        <>
          {selectedRange && <SelectedRangeBox theme={theme} selectedRange={selectedRange} index={index} view={view} cornerRadius={4} />}
          {selectionStats?.regression && graph.binSize !== "point" && <RegressionLine theme={theme} regression={selectionStats.regression} time={item.time} weekStart={weekStart} binSize={graph.binSize} view={view} />}
          <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} fontScale={windowDimensions.fontScale} />
        </>
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item), windowDimensions.fontScale);
      break;
    }
    case "box": {
      renderItem = ({ item, index, view }: { item: any, index: number, view: ViewDimensions }) => (
        <>
          {selectedRange && <SelectedRangeBox theme={theme} selectedRange={selectedRange} index={index} view={view} cornerRadius={10} />}
          {selectionStats?.regression && graph.binSize !== "point" && <RegressionLine theme={theme} regression={selectionStats.regression} time={item.time} view={view} weekStart={weekStart} binSize={graph.binSize} />}
          <BoxChart view={view} values={item.values} color={theme.colors.primary} surfaceColor={theme.colors.surface} />
        </>
      );
      itemBoundingBox = (item: any, itemWidthPx: number) => item.values.length > 0 ? {
        min: Math.min(...item.values),
        max: Math.max(...item.values),
        padMin: itemWidthPx / 2,
        padMax: itemWidthPx / 2,
      } : null;
      break;
    }
  }

  return (
    <>
      <FlatListChart
        height={height}
        unit={unit}
        gridLineColor={theme.colors.onSurfaceVariant}
        items={items}
        renderItem={renderItem}
        itemBoundingBox={itemBoundingBox}
        itemLabel={(item) => xLabel(item.time, graph.binSize, item.dayIndex)}
        setSelectedRange={setSelectedRange}
      />
      {selectionStats && <StatBox
        onPress={() => setSelectedRange(null)}
        theme={theme}
        unit={unit}
        stats={selectionStats}
      />}
    </>
  )
}

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

export default ActivityGraph; 