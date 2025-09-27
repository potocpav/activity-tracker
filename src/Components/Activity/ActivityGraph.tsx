import React, { Fragment, useLayoutEffect, useRef, useState } from "react";
import { View, Text, Platform, useWindowDimensions, Pressable, StyleSheet, FlatList } from "react-native";
import { Menu, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { Canvas, matchFont, Rect, RoundedRect, Text as SkiaText, vec, Line } from "@shopify/react-native-skia";
import useStore from "../../Model/Store";
import { DataPoint, dateListToTime, ActivityType, GraphType, WeekStart, DateList, SubUnit } from "../../Model/StoreTypes";
import { binTime, binTimeSeries, BinSize, extractValue } from "../../Model/Activity";
import AntDesign from '@expo/vector-icons/AntDesign';
import TagMenu from "../TagMenu";
import SubUnitMenu from "../SubUnitMenu";
import DropdownMenu from "../DropdownMenu";
import { getTheme } from "../../Model/Theme";
import { FlashList } from "@shopify/flash-list";
import { renderShortFormValue } from "../../Model/Unit";

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

  const graphTypes = activity.unit.type === "none" ? ["bar-count", "bar-daily-mean"] : ["box", "bar-count", "bar-sum", "line-mean"];

  const filteredValues: { date: DateList, value: number }[] = activity.dataPoints
    .map((dp: DataPoint) => ({
      date: dp.date,
      value: extractValue(dp, graph.tagFilters, graph.subUnit)
    }
    ))
    .filter(x => x.value !== null) as { date: DateList, value: number }[];


  let unit: SubUnit;
  if (graph.graphType === "bar-count") {
    unit = { type: "count" };
  } else if (graph.graphType === "bar-daily-mean") {
    unit = { type: "number", symbol: "%" };
  } else {
    switch (activity.unit.type) {
      case "none":
        unit = { type: "count" };
        break;
      case "single":
        unit = activity.unit.unit;
        break;
      case "multiple":
        unit = activity.unit.values.find((u) => u.name === graph.subUnit)?.unit ?? { type: "number", symbol: "n/a" };
        break;
    }
  }

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
        <FlatListChart
          height={300}
          binSize={graph.binSize}
          graphType={graph.graphType}
          unit={unit}
          values={filteredValues}
          weekStart={weekStart}
          xKey="t"
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

const barBoundingBox = (data: number[], stat: "mean"): BoundingBox => {
  if (data.length === 0) {
    return null;
  }
  let cmpStat;
  switch (stat) {
    case "mean":
      cmpStat = (l: number[]) => l.length > 0 ? l.reduce((a, b) => a + b, 0) / l.length : 0;
      break;
  }
  let statValue = cmpStat(data);
  return {
    min: Math.min(0, statValue),
    max: Math.max(0, statValue),
    padMin: statValue < 0 ? 15 : 0,
    padMax: statValue > 0 ? 15 : 0,
  };
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


type FlatListChartData = {
  height: number,
  binSize: BinSize,
  graphType: GraphType,
  unit: SubUnit,
  values: { date: DateList, value: number }[],
  weekStart: WeekStart,
  xKey: string,
  theme: any,
}

const FlatListChart = (
  {
    height,
    binSize,
    graphType,
    unit,
    values,
    weekStart,
    xKey,
    theme,
  }:
    FlatListChartData
) => {
  const rootRef = useRef<View>(null);
  const [rootWidth, setRootWidth] = useState(0);
  const [rootHeight, setRootHeight] = useState(0);
  const windowDimensions = useWindowDimensions();
  const font = matchFont({ fontFamily: fontFamily, fontSize: 10 * windowDimensions.fontScale });

  let stat: "mean" = "mean";

  let xAxisHeight = 30;
  let viewportHeight = rootHeight - xAxisHeight;

  const bins = binTimeSeries(binSize, values, weekStart).reverse();
  const boundingBox = mergeBoundingBoxes(bins.map(bin => barBoundingBox(bin.values, stat)));
  let yRange = boundingBoxToYRange(viewportHeight, boundingBox);
  let majorTicks = cmpMajorTicks(unit, yRange, 10);
  const majorTickLabels = majorTicks.map((tick) => renderShortFormValue(tick, unit));
  const maxTickWidth = Math.max(...majorTickLabels.map((label) => font.measureText(label).width));

  let yAxisPadding = 5;
  let yAxisWidth = maxTickWidth + yAxisPadding;
  let viewportWidth = rootWidth - yAxisWidth;
  let binWidth = viewportWidth / 15;
  let barWidth = binWidth * 0.5;

  console.log(graphType);

  // const binStats: { t: number, q0: number, q1: number, q2: number, q3: number, q4: number, count: number, sum: number, mean: number, zero: number, dailyMean: number }[]
  //   = bins.map((bin) => {
  //     const values = bin.values;
  //     if (values.length === 0) {
  //       return {
  //         t: bin.time,
  //         count: 0,
  //         sum: 0,
  //         mean: 0,
  //         zero: 0,
  //         dailyMean: 0,
  //         q0: 0,
  //         q1: 0,
  //         q2: 0,
  //         q3: 0,
  //         q4: 0,
  //       }
  //     } else {
  //       return {
  //         t: bin.time,
  //         count: values.length,
  //         sum: values.reduce((a, b) => a + b, 0),
  //         mean: values.reduce((a, b) => a + b, 0) / values.length,
  //         zero: 0,
  //         dailyMean: values.length / bin.nDays * 100,
  //         ...quartiles(values),
  //       };
  //     }
  //   });

  const yToPx = (y: number) => {
    return viewportHeight - (y - yRange.min) * viewportHeight / (yRange.max - yRange.min);
  }

  useLayoutEffect(() => {
    rootRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setRootWidth(width);
      setRootHeight(height);
    });
  }, [windowDimensions]);

  return (
    <View key="root" ref={rootRef} style={{ height, flex: 1, position: 'relative', overflow: 'hidden' }}>
      <Canvas key="grid" style={{
        position: 'absolute',
        width: rootWidth,
        height: rootHeight,
      }}>
        {majorTicks.map((tick) => {
          const tickLabel = renderShortFormValue(tick, unit);
          const tickBox = font.measureText(tickLabel);
          return (
          <Fragment key={tickLabel}>
            <Line
              p1={vec(yAxisWidth, yToPx(tick))}
              p2={vec(rootWidth, yToPx(tick))}
              color={theme.colors.onSurfaceVariant}
              strokeWidth={0}
              opacity={0.5}
            />
            <SkiaText
              x={yAxisWidth - tickBox.width - yAxisPadding}
              y={yToPx(tick) + tickBox.height * 0.4}
              color={theme.colors.onSurfaceVariant}
              font={font}
              text={tickLabel}
            />
          </Fragment>
        )})}
      </Canvas>
      <View style={{
        position: 'absolute',
        left: yAxisWidth,
        top: 0,
        width: viewportWidth,
        height: rootHeight,
      }}>
        <FlatList
          key="flashlist"
          data={bins}
          // estimatedItemSize={binWidth}
          renderItem={({ item }) => {
            let mean = item.values.reduce((a, b) => a + b, 0) / item.values.length;
            return (
              <View style={{ width: binWidth, height: rootHeight }}>
                {/* Data points */}
                {item.values.length > 0 && <View key="data view" style={{
                  width: binWidth,
                  height: viewportHeight,
                }}>
                  <View key="value text" style={{ top: yToPx(mean) - 13, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: theme.colors.primary }} numberOfLines={1} adjustsFontSizeToFit>{renderShortFormValue(mean, unit)}</Text>
                  </View>
                  <Canvas key="bar" style={{ position: 'absolute', width: binWidth, height: viewportHeight }}>
                    <RoundedRect
                      rect={{
                        rect: { x: (binWidth - barWidth) / 2, y: yToPx(0), width: barWidth, height: yToPx(mean) - yToPx(0) },
                        topLeft: vec(barWidth / 3, barWidth / 3),
                        topRight: vec(barWidth / 3, barWidth / 3),
                        bottomRight: vec(0, 0),
                        bottomLeft: vec(0, 0),

                      }}
                      color={theme.colors.primary}
                      r={barWidth / 3}
                    />
                  </Canvas>
                </View>}
                {/* X axis labels */}
                <View style={{
                  position: 'absolute',
                  top: viewportHeight,
                  width: binWidth,
                  height: xAxisHeight,
                  alignItems: 'center',
                  paddingTop: 4,
                }}>
                  <Text style={{ textAlign: 'center', fontSize: 10, color: theme.colors.onSurfaceVariant }}>
                    {xLabel(item.time, binSize)}
                  </Text>
                </View>
              </View>
            )
          }}
          keyExtractor={(item) => item.time.toString()}
          inverted={true}
          horizontal={true}
        />
      </View>
    </View>
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