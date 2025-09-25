import React, { Fragment, useLayoutEffect, useRef, useState } from "react";
import { View, Text, Platform, useWindowDimensions, Pressable, StyleSheet, FlatList } from "react-native";
import { Menu, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { useChartTransformState } from "victory-native";
import { Canvas, matchFont, Rect, RoundedRect, Text as SkiaText } from "@shopify/react-native-skia";
import useStore from "../../Model/Store";
import { DataPoint, dateListToTime, ActivityType, GraphType } from "../../Model/StoreTypes";
import { binTime, binTimeSeries, BinSize, extractValue } from "../../Model/Activity";
import AntDesign from '@expo/vector-icons/AntDesign';
import TagMenu from "../TagMenu";
import SubUnitMenu from "../SubUnitMenu";
import DropdownMenu from "../DropdownMenu";
import { getTheme } from "../../Model/Theme";

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
  const windowDimensions = useWindowDimensions();
  const font = matchFont({ fontFamily: fontFamily, fontSize: 10 * windowDimensions.fontScale });  

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  const setActivityGraph = useStore((state: any) => state.setActivityGraph);
  const cloneActivityGraph = useStore((state: any) => state.cloneActivityGraph);
  const deleteActivityGraph = useStore((state: any) => state.deleteActivityGraph);

  const styles = getStyles(theme);

  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;
  const subUnitNames = activity.unit.type === "multiple" ? activity.unit.values.map(u => u.name) : null;

  const [binMenuVisible, setBinMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [graphTypeMenuVisible, setGraphTypeMenuVisible] = useState(false);

  const [graphDialogVisible, setGraphDialogVisible] = useState(false);
  const [graphDialogNameInput, setGraphDialogNameInput] = useState(graph.label);

  const now = new Date();
  const graphWidth = windowDimensions.width * 0.9;
  const barWidth = 10 * windowDimensions.fontScale;
  const nBars = Math.floor(graphWidth / barWidth / 2);

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

  const bins = binTimeSeries(graph.binSize, activity.dataPoints, weekStart).reverse();
  const binStats: { t: number, q0: number, q1: number, q2: number, q3: number, q4: number, count: number, sum: number, mean: number, zero: number, dailyMean: number }[]
    = bins.map((bin) => {
      const values = bin.values.map((dp: DataPoint) => extractValue(dp, graph.tagFilters, graph.subUnit)).filter((v: number | null) => v !== null);
      if (values.length === 0) {
        return {
          t: bin.time,
          count: 0,
          sum: 0,
          mean: 0,
          zero: 0,
          dailyMean: 0,
          q0: 0,
          q1: 0,
          q2: 0,
          q3: 0,
          q4: 0,
        }
      } else {
        return {
          t: bin.time,
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          zero: 0,
          dailyMean: values.length / bin.nDays * 100,
          ...quartiles(values),
        };
      }
    }).filter((b) => b !== null);

  var yKeys: (keyof typeof binStats[number])[];
  if (graph.graphType === "box") {
    yKeys = ["q0", "q1", "q2", "q3", "q4"];
  } else if (graph.graphType === "bar-count") {
    yKeys = ["count", "zero"];
  } else if (graph.graphType === "bar-daily-mean") {
    yKeys = ["dailyMean", "zero"];
  } else if (graph.graphType === "bar-sum") {
    yKeys = ["sum", "zero"];
  } else if (graph.graphType === "line-mean") {
    yKeys = ["mean"];
  } else {
    throw new Error("Invalid graph type");
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

  const { domain, viewport }: { domain: { x: [number, number], y?: [number, number] }, viewport: { x: [number, number] } } = (() => {
    const firstBinTime = bins.length ? bins[0].time : now.getTime();
    const lastBinTime = bins.length ? bins[bins.length - 1].time : now.getTime();
    const nowBin = binTime(graph.binSize, now.getTime(), 0, weekStart).getTime();
    const t1 = Math.max(lastBinTime, nowBin) + approximateBinSize(graph.binSize) / 2;
    const t0view = t1 - approximateBinSize(graph.binSize) * nBars;
    const t0 = Math.min(firstBinTime - approximateBinSize(graph.binSize) / 2, t0view);

    var domain: { x: [number, number], y?: [number, number] } = { x: [t0, t1] };
    var viewport: { x: [number, number] } = { x: [t0view, t1] };
    if (graph.graphType === "box") {
      const [ymin, ymax] = [Math.min(...binStats.map((b) => b.q0)), Math.max(...binStats.map((b) => b.q4))];
      domain.y = [ymin - (ymax - ymin) * 0.05, ymax + (ymax - ymin) * 0.05];
    } else if (graph.graphType === "bar-count") {
      const ymax = Math.max(...binStats.map((b) => b.count));
      domain.y = [0, ymax * 1.1];
    } else if (graph.graphType === "bar-daily-mean") {
      const ymax = Math.max(...binStats.map((b) => b.dailyMean));
      domain.y = [0, ymax * 1.1];
    } else if (graph.graphType === "bar-sum") {
      const ymax = Math.max(...binStats.map((b) => b.sum));
      domain.y = [0, ymax * 1.1];
    } else if (graph.graphType === "line-mean") {
      const [ymin, ymax] = [Math.min(...binStats.map((b) => b.mean)), Math.max(...binStats.map((b) => b.mean))];
      domain.y = [ymin - (ymax - ymin) * 0.05, ymax + (ymax - ymin) * 0.05];
    } else {
      throw new Error("Invalid graph type");
    }
    return { domain, viewport };
  })();


  const barPlot = (values: any, zero: any, stat: string, unit?: string) => {
    return (
      <>
        {(() => {
          const elements = [];
          for (let i = 0; i < values.length; i++) {
            const label = (binStats as any)[i][stat].toFixed(0) + (unit ?? "");
            const val = values[i];
            const [vx, vy] = [val.x, val.y ?? NaN];
            const w = barWidth / 2;

            const labelSize = font.measureText(label);

            elements.push(
              <Fragment key={"bar" + i}>
                <RoundedRect
                  x={vx - w}
                  y={vy}
                  width={w * 2}
                  height={zero[i].y ?? NaN}
                  color={theme.colors.primary}
                  r={w * 2 / 3}
                />

                <SkiaText
                  key={"label" + i}
                  x={vx - labelSize.width / 2}
                  color={theme.colors.onSurface}
                  y={vy - labelSize.height / 2}
                  text={label}
                  font={font}
                ></SkiaText>
              </Fragment>
            );
          }
          return elements;
        })()}
      </>);
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
          data={binStats}
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
              <Button onPress={() => {deleteActivityGraph(activityName, graphIndex); setGraphDialogVisible(false);}}><AntDesign name="delete" size={24} color={theme.colors.onSurface} /></Button>
            )}
            <Button onPress={() => {setActivityGraph(activityName, graphIndex, { ...graph, label: graphDialogNameInput }); setGraphDialogVisible(false);}}><AntDesign name="check" size={24} color={theme.colors.onSurface} /></Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const xLabel = (t: number, binSize: BinSize) => {
  const d = new Date(t);
  if (binSize === "day") {
    return "" + d.getDate();
  } else if (binSize === "week") {
    return "" + (d.getDate());
  } else if (binSize === "month") {
    const m = d.getMonth() + 1;
    return m > 1 ? `${m}` : `'${d.getFullYear() % 100}`;
  } else if (binSize === "quarter") {
    const q = d.getMonth() / 3 + 1;
    return q > 1 ? `q${q}` : `'${d.getFullYear() % 100}`;
  } else if (binSize === "year") {
    return "" + d.getFullYear();
  } else {
    throw new Error("Invalid bin size");
  }
};

type FlatListChartData = { 
  height: number,
  binSize: BinSize,
  data: any[], 
  xKey: string,
  theme: any,
}


const FlatListChart = (
  { 
    height,
    binSize,
    data, 
    xKey, 
    theme,
  }: 
  FlatListChartData
) => {
  const rootRef = useRef<View>(null);
  const [rootWidth, setRootWidth] = useState(0);
  const [rootHeight, setRootHeight] = useState(0);
  
  let yAxisWidth = 50;
  let xAxisHeight = 50;
  let viewportWidth = rootWidth - yAxisWidth;
  let viewportHeight = rootHeight - xAxisHeight;
  let binWidth = viewportWidth / 12;
  let barWidth = binWidth * 0.5;

  let yRange = { min: 0, max: 100 };

  const yToPx = (y: number) => {
    return (y - yRange.min) * viewportHeight / (yRange.max - yRange.min);
  }

  useLayoutEffect(() => {
    rootRef.current?.measure((x, y, width, height, pageX, pageY) => {
      //do something with the measurements
      console.log(x, y, width, height, pageX, pageY);
      setRootWidth(width);
      setRootHeight(height);
    });
  }, [ /* add dependencies here */]);

  return (
    <View key="root" ref={rootRef} style={{ height, flex: 1, position: 'relative', overflow: 'hidden' }}>
      {/* <Canvas style={{ width: rootWidth, height: rootHeight }}>
        <Rect x={yAxisWidth} y={0} width={viewportWidth} height={viewportHeight} color="black" />
      </Canvas> */}
      <View key="frame" style={{ 
        position: 'absolute', 
        top: 0, 
        left: yAxisWidth, 
        width: viewportWidth, 
        height: viewportHeight, 
        borderWidth: 1, 
        borderColor: 'black' 
        }} />
      <View key="yAxis" style={{ position: 'absolute', width: yAxisWidth, height: viewportHeight, borderWidth: 1, borderColor: 'green' }}>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
        <Text>1</Text>
      </View>
      <FlatList 
        key="flatlist"
        style={{ left: yAxisWidth, top: 0, width: viewportWidth, height: viewportHeight }}
        data={data} 
        getItemLayout={(_, index) => (
          { length: binWidth, offset: binWidth * index, index }
        )}
        renderItem={({ item }) => {
          return (
            <View style={{ width: binWidth, height: rootHeight }}>
              {/* Data points */}
              <View style={{ width: binWidth, height: viewportHeight, borderWidth: 1, borderColor: 'red' }}>
                <Canvas style={{ width: binWidth, height: viewportHeight }}>
                  <RoundedRect 
                    x={(binWidth - barWidth) / 2} 
                    y={viewportHeight} 
                    width={barWidth} 
                    height={-yToPx(item.mean)} 
                    color={theme.colors.primary}
                    r={barWidth / 3} 
                  />
                </Canvas>
              </View>
              {/* X axis labels */}
              <View style={{ width: binWidth, height: xAxisHeight, alignItems: 'center', borderWidth: 1, borderColor: 'blue' }}>
                <Text style={{ fontSize: 10 }}>{xLabel(item.t, binSize)}</Text>
              </View>
            </View>
          )
        }}
        keyExtractor={(item) => item[xKey].toString()}
        extraData={data}
        removeClippedSubviews={true}
        windowSize={2}
        inverted={true}
        horizontal={true}
      />
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