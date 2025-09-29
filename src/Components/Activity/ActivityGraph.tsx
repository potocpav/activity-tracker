import React, { useState } from "react";
import { View, Text, useWindowDimensions, Pressable, StyleSheet, FlatList, ToastAndroid } from "react-native";
import { Menu, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import useStore from "../../Model/Store";
import { DataPoint, dateListToTime, ActivityType, GraphType, WeekStart, DateList, SubUnit, GraphProps, Unit } from "../../Model/StoreTypes";
import { binTime, binTimeSeries, BinSize, extractValue } from "../../Model/Activity";
import AntDesign from '@expo/vector-icons/AntDesign';
import TagMenu from "../TagMenu";
import SubUnitMenu from "../SubUnitMenu";
import DropdownMenu from "../DropdownMenu";
import { getTheme } from "../../Model/Theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FlatListChart, { BarChart, BoxChart, barBoundingBox, ViewDimensions } from "../FlatListChart";


const ActivityGraph = ({ activityName, graphIndex }: { activityName: string, graphIndex: number }) => {
  const activities = useStore((state: any) => state.activities);
  const activity: ActivityType = activities.find((a: ActivityType) => a.name === activityName);
  const graph = activity.graphs[graphIndex];
  const weekStart = useStore((state: any) => state.weekStart);
  const theme = getTheme(activity.color);
  const insets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();

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

  const now = new Date();

  var ticks = [];
  if (activity.dataPoints.length > 0) {
    var tick_t = binTime(graph.binSize, dateListToTime(activity.dataPoints[0].date), 0, weekStart).getTime();
    for (let i = 0; tick_t < now.getTime(); i++) {
      tick_t = binTime(graph.binSize, dateListToTime(activity.dataPoints[0].date), i, weekStart).getTime();
      ticks.push(tick_t);
      if (i > 1000) {
        break; // limit
      }
    }
  }

  const graphLabel = (gType: any) => {
    if (gType === "box") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="barchart" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Box</Text>
        </View>
      );
    } else if (gType === "bar-count") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="barschart" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Count</Text>
        </View>
      );
    } else if (gType === "bar-daily-mean") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="barschart" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Daily Mean</Text>
        </View>
      );
    } else if (gType === "bar-sum") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="barschart" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Sum</Text>
        </View>
      );
    } else if (gType === "line-mean") {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AntDesign name="linechart" size={24} color={theme.colors.onSurfaceVariant} />
          <Text style={{ marginLeft: 6, color: theme.colors.onSurfaceVariant }}>Mean</Text>
        </View>
      );
    }
  }

  const binningLabels: Record<typeof graph.binSize, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
    quarter: "Quarter",
    year: "Year"
  };
  const binningOptions = Object.entries(binningLabels).map(([key, label]) => ({ key, label }));

  const graphTypes = activity.unit.type === "none" ? ["bar-count", "bar-daily-mean"] : ["box", "bar-count", "bar-sum"];

  return (
    <View style={{ flex: 1, padding: 10, marginVertical: 16, backgroundColor: theme.colors.background }}>
      <View style={styles.headerContainer}>
        <Pressable onPress={() => setGraphDialogVisible(true)} android_ripple={{ color: theme.colors.outline, foreground: false }}>
          <Text style={styles.headerText}>{graph.label}</Text>
        </Pressable>
      </View>
      <View key="activityGraph" style={{ width: '100%', marginVertical: 8 }}>
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
            // TODO: reset viewport
            setActivityGraph(activityName, graphIndex, { ...graph, binSize: key as BinSize });
          }}
          visible={binMenuVisible}
          setVisible={setBinMenuVisible}
          themeColors={theme.colors}
        />
        {/* SubUnit menu */}
        <SubUnitMenu
          subUnitNames={subUnitNames}
          subUnitName={graph.subUnit}
          setSubUnitName={(name) => setActivityGraph(activityName, graphIndex, { ...graph, subUnit: name })}
          menuVisible={subUnitMenuVisible}
          setMenuVisible={setSubUnitMenuVisible}
          themeColors={theme.colors}
        />
        {/* Tags menu */}
        <TagMenu
          tags={graph.tagFilters}
          onChange={(tags) => setActivityGraph(activityName, graphIndex, { ...graph, tagFilters: tags })}
          menuVisible={tagsMenuVisible}
          setMenuVisible={setTagsMenuVisible}
          activityTags={activity.tags}
          activity={activity}
        />
        {/* Graph type menu */}
        <Menu
          visible={graphTypeMenuVisible}
          onDismiss={() => setGraphTypeMenuVisible(false)}
          anchor={
            <Button compact={true} onPress={() => setGraphTypeMenuVisible(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {graphLabel(graph.graphType)}
                <AntDesign name="down" size={16} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 6 }} />
              </View>
            </Button>
          }
        >
          {graphTypes.map((type) => (
            <Menu.Item
              key={type}
              onPress={() => {
                setGraphTypeMenuVisible(false);
                setActivityGraph(activityName, graphIndex, { ...graph, graphType: type as GraphType });
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
            {activity.graphs.length > 1 && (
              <Button onPress={() => {
                deleteActivityGraph(activityName, graphIndex);
                setGraphDialogVisible(false);
                ToastAndroid.show('Graph deleted', ToastAndroid.SHORT);
              }}>
                <AntDesign name="delete" size={22} color={theme.colors.onSurface} />
              </Button>
            )}
            <Button onPress={() => {
              cloneActivityGraph(activityName, graphIndex);
              setGraphDialogVisible(false);
              ToastAndroid.show('Graph cloned', ToastAndroid.SHORT);
            }}>
              <AntDesign name="copy1" size={22} color={theme.colors.onSurface} />
            </Button>
            <Button onPress={() => {
              setActivityGraph(activityName, graphIndex, { ...graph, label: graphDialogNameInput });
              setGraphDialogVisible(false);
            }}>
              <AntDesign name="check" size={22} color={theme.colors.onSurface} />
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const xLabel = (t: number, binSize: BinSize) => {
  const d = new Date(t);
  if (binSize === "day") {
    const date = d.getDate();
    return date > 1 ? `${date}` : `${date}\n${d.toLocaleString('default', { month: 'short' })}`;
  } else if (binSize === "week") {
    const date = d.getDate();
    return date > 7 ? `${date}` : `${date}\n${d.toLocaleString('default', { month: 'short' })}`;
  } else if (binSize === "month") {
    const m = d.getMonth() + 1;
    return m > 1 ? `${m}` : `${m}\n'${d.getFullYear() % 100}`;
  } else if (binSize === "quarter") {
    const q = d.getMonth() / 3 + 1;
    return q > 1 ? `q${q}` : `q${q}\n'${d.getFullYear() % 100}`;
  } else if (binSize === "year") {
    return `'${d.getFullYear() % 100}`;
  } else {
    throw new Error("Invalid bin size");
  }
};


type ActivityChart = {
  height: number,
  graph: GraphProps,
  dataPoints: DataPoint[],
  activityUnit: Unit,
  weekStart: WeekStart,
  theme: any,
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

  const filteredValues: { date: DateList, value: number }[] = dataPoints
    .map((dp: DataPoint) => ({
      date: dp.date,
      value: extractValue(dp, graph.tagFilters, graph.subUnit)
    }
    ))
    .filter(x => x.value !== null) as { date: DateList, value: number }[];

  const items = binTimeSeries(graph.binSize, filteredValues, weekStart).reverse();

  let unit: SubUnit;
  if (graph.graphType === "bar-count") {
    unit = { type: "count" };
  } else if (graph.graphType === "bar-daily-mean") {
    unit = { type: "number", symbol: "%" };
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

  let renderItem;
  let itemBoundingBox;
  switch (graph.graphType) {
    case "bar-count": {
      const value = (item: any) => item.values.length > 0 ? item.values.length : null;
      renderItem = (item: any, view: ViewDimensions) => (
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} fontScale={windowDimensions.fontScale} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item), windowDimensions.fontScale);
      break;
    }
    case "bar-sum": {
      const value = (item: any) => item.values.length > 0 ? item.values.reduce((a: number, b: number) => a + b, 0) : null;
      renderItem = (item: any, view: ViewDimensions) => (
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} fontScale={windowDimensions.fontScale} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item), windowDimensions.fontScale);
      break;
    }
    case "bar-daily-mean": {
      const value = (item: any) => item.values.length > 0 ? item.values.reduce((a: number, b: number) => a + b, 0) / item.nDays * 100 : null;
      renderItem = (item: any, view: ViewDimensions) => (
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} fontScale={windowDimensions.fontScale} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item), windowDimensions.fontScale);
      break;
    }
    case "line-mean": {
      const value = (item: any) => item.values.length > 0 ? item.values.reduce((a: number, b: number) => a + b, 0) / item.values.length : null;
      renderItem = (item: any, view: ViewDimensions) => (value(item) !== null) && (
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item));
      break;
    }
    case "box": {
      renderItem = (item: any, view: ViewDimensions) => (
        <BoxChart view={view} values={item.values} unit={unit} color={theme.colors.primary} surfaceColor={theme.colors.surface} />
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

  return (<FlatListChart
    height={height}
    unit={unit}
    gridLineColor={theme.colors.onSurfaceVariant}
    items={items}
    renderItem={renderItem}
    itemBoundingBox={itemBoundingBox}
    itemLabel={(item) => xLabel(item.time, graph.binSize)}
  />)
}

const getStyles = (theme: any) => StyleSheet.create({
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

export default ActivityGraph; 