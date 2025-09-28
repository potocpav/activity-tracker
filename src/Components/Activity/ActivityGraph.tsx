import React, { Fragment, useLayoutEffect, useRef, useState } from "react";
import { View, Text, Platform, useWindowDimensions, Pressable, StyleSheet, FlatList } from "react-native";
import { Menu, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { Canvas, matchFont, Rect, RoundedRect, Text as SkiaText, vec, Line } from "@shopify/react-native-skia";
import useStore from "../../Model/Store";
import { DataPoint, dateListToTime, ActivityType, GraphType, WeekStart, DateList, SubUnit, GraphProps, Unit } from "../../Model/StoreTypes";
import { binTime, binTimeSeries, BinSize, extractValue } from "../../Model/Activity";
import AntDesign from '@expo/vector-icons/AntDesign';
import TagMenu from "../TagMenu";
import SubUnitMenu from "../SubUnitMenu";
import DropdownMenu from "../DropdownMenu";
import { getTheme } from "../../Model/Theme";
import { FlashList } from "@shopify/flash-list";
import { renderShortFormValue } from "../../Model/Unit";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const fontFamily = Platform.select({ default: "sans-serif" });

const approximateBinSize = (binSize: BinSize) => {
  const day = 24 * 60 * 60 * 1000;
  if (binSize === "day") {
    return day;
  } else if (binSize === "week") {
    return 7 * day;
  } else if (binSize === "month") {
    return 30 * day;
  } else if (binSize === "quarter") {
    return 365 / 4 * day;
  } else if (binSize === "year") {
    return 365 * day;
  } else {
    console.error("Invalid bin size: " + binSize);
    throw new Error("Invalid bin size: " + binSize);
  }
}

const quartiles = (values: number[]) => {
  const vs = values.filter(v => v !== null).sort((a, b) => a - b);
  const floatIndex = (i: number) => {
    const f = Math.max(0, Math.min(Math.floor(i), vs.length - 1));
    const c = Math.max(0, Math.min(Math.ceil(i), vs.length - 1));
    const a = i - f;
    return vs[f] * (1 - a) + vs[c] * a;
  };
  const q0 = vs[0];
  const q1 = floatIndex(0.25 * (vs.length - 1));
  const q2 = floatIndex(0.5 * (vs.length - 1));
  const q3 = floatIndex(0.75 * (vs.length - 1));
  const q4 = vs[vs.length - 1];
  return { q0, q1, q2, q3, q4 };
};

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
        <Button compact={true} onPress={() => cloneActivityGraph(activityName, graphIndex)}>
          <AntDesign name="plus" size={24} color={theme.colors.onSurfaceVariant} style={{ marginLeft: 6 }} />
        </Button>
      </View>
      <View key="activityGraph" style={{ width: '100%', marginVertical: 8 }}>
        <ActivityChart
          width={windowDimensions.width - insets.left - insets.right - 20}
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
              <Button onPress={() => { deleteActivityGraph(activityName, graphIndex); setGraphDialogVisible(false); }}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
            )}
            <Button onPress={() => { setActivityGraph(activityName, graphIndex, { ...graph, label: graphDialogNameInput }); setGraphDialogVisible(false); }}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
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
    return m > 1 ? `${m}` : `${m}\n${d.getFullYear()}`;
  } else if (binSize === "quarter") {
    const q = d.getMonth() / 3 + 1;
    return q > 1 ? `q${q}` : `q${q}\n${d.getFullYear()}`;
  } else if (binSize === "year") {
    return `'${d.getFullYear() % 100}`;
  } else {
    throw new Error("Invalid bin size");
  }
};

type BoundingBox = {
  min: number, // domain units
  max: number, // domain units
  padMin: number, // px units
  padMax: number, // px units
} | null;

const mergeBoundingBoxes = (boxes: BoundingBox[]): BoundingBox => {
  const validBoxes = boxes.filter((b) => b !== null);
  if (validBoxes.length === 0) {
    return null;
  } else {
    // without knowing conversion between domain and pixels, this can be only an upper bound estimate
    return {
      min: Math.min(...validBoxes.map((b) => b.min)),
      max: Math.max(...validBoxes.map((b) => b.max)),
      padMin: Math.max(...validBoxes.map((b) => b.padMin)),
      padMax: Math.max(...validBoxes.map((b) => b.padMax)),
    };
  }
}

const boundingBoxToYRange = (viewportHeight: number, box: BoundingBox): { min: number, max: number } => {
  if (box === null) {
    return { min: 0, max: 1 };
  } else {
    let vh = viewportHeight - box.padMin - box.padMax;
    let pxSize = (box.max - box.min) / vh;
    const lim1 = box.min - box.padMin * pxSize;
    const lim2 = box.max + box.padMax * pxSize;
    const min = Math.min(lim1, lim2);
    const max = Math.max(lim1, lim2);
    if (min == max) {
      return { min: min - 0.5, max: max + 0.5 };
    } else {
      return { min: min, max: max };
    }
  }
}

const barBoundingBox = (value: number | null): BoundingBox => {
  if (value === null) {
    return null;
  } else {
    return {
      min: Math.min(0, value),
      max: Math.max(0, value),
      padMin: value < 0 ? 15 : 0,
      padMax: value > 0 ? 15 : 0,
    };
  }
}

const cmpMajorTicks = (unit: SubUnit, range: { min: number, max: number }, approxNTicks: number): number[] => {
  const numberTicks = () => {
    const idealStride = (range.max - range.min) / approxNTicks;
    const stride = Math.pow(10, Math.round(Math.log10(idealStride)));

    let ticks = [];
    for (let i = Math.ceil(range.min / stride); i <= Math.floor(range.max / stride); i++) {
      ticks.push(i * stride);
    }
    return ticks;
  }

  const countTicks = () => {
    // TODO: forbid fractional ticks
    return numberTicks();
  }

  switch (unit.type) {
    case "count":
      return countTicks();

    case "number":
    case "distance":
    case "weight":
      return numberTicks();

    case "time":
      return numberTicks();

    case "climbing_grade":
      return numberTicks();
  }
}

type ActivityChart = {
  width: number,
  height: number,
  graph: GraphProps,
  dataPoints: DataPoint[],
  activityUnit: Unit,
  weekStart: WeekStart,
  theme: any,
}

const ActivityChart = (
  {
    width,
    height,
    graph,
    dataPoints,
    activityUnit,
    weekStart,
    theme,
  }:
    ActivityChart
) => {
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
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item));
      break;
    }
    case "bar-sum": {
      const value = (item: any) => item.values.length > 0 ? item.values.reduce((a: number, b: number) => a + b, 0) : null;
      renderItem = (item: any, view: ViewDimensions) => (
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item));
      break;
    }
    case "bar-daily-mean": {
      const value = (item: any) => item.values.length > 0 ? item.values.reduce((a: number, b: number) => a + b, 0) / item.nDays * 100 : null;
      renderItem = (item: any, view: ViewDimensions) => (
        <BarChart view={view} value={value(item)} unit={unit} color={theme.colors.primary} />
      );
      itemBoundingBox = (item: any) => barBoundingBox(value(item));
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
      itemBoundingBox = (item: any) => item.values.length > 0 ? {
        min: Math.min(...item.values),
        max: Math.max(...item.values),
        padMin: 10, // TODO: make more precise
        padMax: 10,
      } : null;
      break;
    }
  }

  return (<FlatListChart
    width={width}
    height={height}
    unit={unit}
    gridLineColor={theme.colors.onSurfaceVariant}
    items={items}
    renderItem={renderItem}
    itemBoundingBox={itemBoundingBox}
    itemLabel={(item) => xLabel(item.time, graph.binSize)}
  />)
}

type ViewDimensions = {
  width: number,
  height: number,
  yToPx: (y: number) => number,
}


type FlatListChartData = {
  width: number,
  height: number,
  unit: SubUnit,
  gridLineColor: string,
  items: { time: number, values: number[], nDays: number }[], // todo: swap for any[]
  renderItem: (item: any, view: ViewDimensions) => React.ReactNode,
  itemBoundingBox: (item: any) => BoundingBox,
  itemLabel: (item: any) => string,
}

const FlatListChart = (
  {
    width,
    height,
    unit,
    gridLineColor,
    items,
    renderItem,
    itemBoundingBox,
    itemLabel,
  }:
    FlatListChartData
) => {
  const rootRef = useRef<View>(null);
  const windowDimensions = useWindowDimensions();
  const font = matchFont({ fontFamily: fontFamily, fontSize: 10 * windowDimensions.fontScale });

  let topViewportPadding = 5;
  let xAxisHeight = 30;
  let viewportHeight = height - xAxisHeight - topViewportPadding;

  const boundingBox = mergeBoundingBoxes(items.map((item) => itemBoundingBox(item)));
  let yRange = boundingBoxToYRange(viewportHeight, boundingBox);
  let majorTicks = cmpMajorTicks(unit, yRange, 10);
  const majorTickLabels = majorTicks.map((tick) => renderShortFormValue(tick, unit));
  const maxTickLabelWidth = Math.max(...majorTickLabels.map((label) => font.measureText(label).width));

  let yLabelPadding = 5;
  let yAxisWidth = maxTickLabelWidth + yLabelPadding;
  let viewportWidth = width - yAxisWidth;
  let binWidth = 20 * windowDimensions.fontScale;

  const yToPx = (y: number) => {
    return viewportHeight - (y - yRange.min) * viewportHeight / (yRange.max - yRange.min);
  }
  const itemViewDimensions = { width: binWidth, height: viewportHeight, yToPx: yToPx };

  return (
    <View key="root" ref={rootRef} style={{ height, flex: 1, position: 'relative', overflow: 'hidden' }}>
      <Canvas key="grid" style={{
        position: 'absolute',
        width: width,
        height: height,
      }}>
        {majorTicks.map((tick, index) => {
          const tickBox = font.measureText(majorTickLabels[index]);
          return (
            <Fragment key={tick.toString()}>
              <Line
                p1={vec(yAxisWidth, yToPx(tick) + topViewportPadding)}
                p2={vec(width, yToPx(tick) + topViewportPadding)}
                color={gridLineColor}
                strokeWidth={0}
                opacity={0.5}
              />
              <SkiaText
                x={yAxisWidth - tickBox.width - yLabelPadding}
                y={yToPx(tick) + tickBox.height * 0.4 + topViewportPadding}
                color={gridLineColor}
                font={font}
                text={majorTickLabels[index]}
              />
            </Fragment>
          )
        })}
      </Canvas>
      <View style={{
        position: 'absolute',
        left: yAxisWidth,
        top: 0,
        width: viewportWidth,
        height: height,
      }}>
        <FlatList
          key="flashlist"
          data={items}
          // estimatedItemSize={binWidth}
          renderItem={({ item }) => {
            const drawnElement = renderItem(item, itemViewDimensions);
            const xLabelElement = (
              <View style={{
                position: 'absolute',
                top: viewportHeight,
                width: binWidth,
                height: xAxisHeight,
                alignItems: 'center',
                paddingTop: 4,
              }}>
                <Text style={{ textAlign: 'center', fontSize: 10, color: gridLineColor }}>
                  {itemLabel(item)}
                </Text>
              </View>);
            return (
              <View key={item.time.toString()} style={{top: topViewportPadding, width: binWidth, height: viewportHeight }}>
                {drawnElement}
                {xLabelElement}
              </View>
            );
          }}
          keyExtractor={(item) => item.time.toString()}
          inverted={true}
          horizontal={true}
        />
      </View>
    </View>
  );
}

const BarChart = ({
  view,
  value,
  unit,
  color
}: {
  view: ViewDimensions,
  value: number | null,
  unit: any,
  color: string,
}) => {
  let barWidth = view.width * 0.6;
  let belowZero = value !== null && value < 0;
  let labelOffset = belowZero ? 0 : 13;

  return (value !== null) && (
    <Fragment key="data view">
      <View key="value text" style={{ top: view.yToPx(value) - labelOffset, alignItems: 'center' }}>
        <Text style={{ fontSize: 9, color: color }} numberOfLines={1} adjustsFontSizeToFit>{renderShortFormValue(value, unit)}</Text>
      </View>
      <Canvas key="bar" style={{ position: 'absolute', ...view }}>
        <RoundedRect
          rect={{
            rect: { x: (view.width - barWidth) / 2, y: view.yToPx(0), width: barWidth, height: view.yToPx(value) - view.yToPx(0) },
            topLeft: belowZero ? vec(0, 0) : vec(barWidth / 3, barWidth / 3),
            topRight: belowZero ? vec(0, 0) : vec(barWidth / 3, barWidth / 3),
            bottomRight: belowZero ? vec(barWidth / 3, barWidth / 3) : vec(0, 0),
            bottomLeft: belowZero ? vec(barWidth / 3, barWidth / 3) : vec(0, 0),

          }}
          color={color}
        />
      </Canvas>
    </Fragment>
  );
}

const BoxChart = ({
  view,
  values,
  unit,
  color,
  surfaceColor,
}: {
  view: ViewDimensions,
  values: number[],
  unit: any,
  color: string,
  surfaceColor: string,
}) => {
  let barWidth = view.width * 0.5;
  let xmid = view.width / 2;

  if (values.length === 0) {
    return null;
  }
  let { q0, q1, q2, q3, q4 } = quartiles(values);
  const w = barWidth / 2;
  const ws = w * 0.4;
  const wcircle = w * 0.5;

  const q0px = view.yToPx(q0);
  const q2px = view.yToPx(q2);
  var q1px = Math.max(view.yToPx(q1), q2px + w);
  var q3px = Math.min(view.yToPx(q3), q2px - w);
  const q4px = view.yToPx(q4);

  return (
      <Canvas key="bar" style={{ position: 'absolute', ...view }}>
        <RoundedRect
          x={xmid - w}
          y={q1px}
          width={2 * w}
          height={q3px - q1px}
          color={color}
          r={w}
        />
        <RoundedRect
          x={xmid - ws}
          y={q0px}
          width={2 * ws}
          height={q4px - q0px}
          color={color}
          r={ws}
        />
        <RoundedRect
          x={xmid - wcircle}
          y={q2px - wcircle}
          width={2 * wcircle}
          height={2 * wcircle}
          color={surfaceColor}
          r={wcircle}
        />
      </Canvas>
  );
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