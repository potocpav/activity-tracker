import React, { Fragment, useState } from "react";
import { View, Text, Platform } from "react-native";
import { useTheme, Menu, Button } from 'react-native-paper';
import { getTransformComponents, Line, Scatter, setScale, setTranslate, useChartTransformState } from "victory-native";
import { CartesianChart } from "victory-native";
import { matchFont, Path, RoundedRect, Skia, Text as SkiaText } from "@shopify/react-native-skia";
import useStore from "./Store";
import { DataPoint, dateListToTime, ActivityType, GraphType, Tag, TagFilter } from "./StoreTypes";
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { binTime, binTimeSeries, BinSize, extractValue } from "./ActivityUtil";
import AntDesign from '@expo/vector-icons/AntDesign';
import { lightPalette, darkPalette } from "./Color";
import TagMenu from "./TagMenu";
import SubUnitMenu from "./SubUnitMenu";
import DropdownMenu from "./DropdownMenu";

const fontFamily = Platform.select({ default: "sans-serif" });
const font = matchFont({ fontFamily: fontFamily, fontSize: 10 });

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
    console.log("Invalid bin size: " + binSize);
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

const ActivityGraph = ({ activityName }: { activityName: string }) => {
  const theme = useTheme();
  const activities = useStore((state: any) => state.activities);
  const activity = activities.find((a: ActivityType) => a.name === activityName);
  const themeState = useStore((state: any) => state.theme);
  const palette = themeState === "dark" ? darkPalette : lightPalette;
  const activityColor = palette[activity.color];

  if (!activity) {
    return <Text>Activity not found</Text>;
  }

  const setActivityGraph = useStore((state: any) => state.setActivityGraph);

  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;
  const subUnitNames = Array.isArray(activity.unit) ? activity.unit.map((u: any) => u.name) : null;

  const [binMenuVisible, setBinMenuVisible] = useState(false);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [graphTypeMenuVisible, setGraphTypeMenuVisible] = useState(false);

  const now = new Date();
  const barWidth = 5;

  var ticks = [];
  if (activity.dataPoints.length > 0) {
    var tick_t = binTime(activity.graph.binSize, dateListToTime(activity.dataPoints[0].date), 0, activity.weekStart);
    for (let i = 0; tick_t < now.getTime(); i++) {
      tick_t = binTime(activity.graph.binSize, dateListToTime(activity.dataPoints[0].date), i, activity.weekStart);
      ticks.push(tick_t);
      if (i > 1000) {
        break; // limit
      }
    }
  }

  const bins = binTimeSeries(activity.graph.binSize, activity.dataPoints, activity.weekStart);
  const binStats: { t: number, q0: number, q1: number, q2: number, q3: number, q4: number, count: number, sum: number, mean: number, zero: number, dailyMean: number }[]
    = bins.map((bin) => {
      const values = bin.values.map((dp: DataPoint) => extractValue(dp, activity.graph.tagFilters, activity.graph.subUnit)).filter((v: number | null) => v !== null);
      if (values.length === 0) {
        return null
      } else {
        return {
          ...quartiles(values),
          count: values.length,
          sum: values.reduce((a, b) => a + b, 0),
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          zero: 0,
          dailyMean: values.length / bin.nDays * 100,
          t: bin.time
        };
      }
    }).filter((b) => b !== null);

  var yKeys: (keyof typeof binStats[number])[];
  if (activity.graph.graphType === "box") {
    yKeys = ["q0", "q1", "q2", "q3", "q4"];
  } else if (activity.graph.graphType === "bar-count") {
    yKeys = ["count", "zero"];
  } else if (activity.graph.graphType === "bar-daily-mean") {
    yKeys = ["dailyMean", "zero"];
  } else if (activity.graph.graphType === "bar-sum") {
    yKeys = ["sum", "zero"];
  } else if (activity.graph.graphType === "line-mean") {
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
    const nowBin = binTime(activity.graph.binSize, now.getTime(), 0, activity.weekStart);
    const t1 = Math.max(lastBinTime, nowBin) + approximateBinSize(activity.graph.binSize) / 2;
    const t0view = t1 - approximateBinSize(activity.graph.binSize) * 15;
    const t0 = Math.min(firstBinTime - approximateBinSize(activity.graph.binSize) / 2, t0view);

    var domain: { x: [number, number], y?: [number, number] } = { x: [t0, t1] };
    var viewport: { x: [number, number] } = { x: [t0view, t1] };
    if (activity.graph.graphType === "box") {
      const [ymin, ymax] = [Math.min(...binStats.map((b) => b.q0)), Math.max(...binStats.map((b) => b.q4))];
      domain.y = [ymin - (ymax - ymin) * 0.05, ymax + (ymax - ymin) * 0.05];
    } else if (activity.graph.graphType === "bar-count") {
      const ymax = Math.max(...binStats.map((b) => b.count));
      domain.y = [0, ymax * 1.1];
    } else if (activity.graph.graphType === "bar-daily-mean") {
      const ymax = Math.max(...binStats.map((b) => b.dailyMean));
      domain.y = [0, ymax * 1.1];
    } else if (activity.graph.graphType === "bar-sum") {
      const ymax = Math.max(...binStats.map((b) => b.sum));
      domain.y = [0, ymax * 1.1];
    } else if (activity.graph.graphType === "line-mean") {
      const [ymin, ymax] = [Math.min(...binStats.map((b) => b.mean)), Math.max(...binStats.map((b) => b.mean))];
      domain.y = [ymin - (ymax - ymin) * 0.05, ymax + (ymax - ymin) * 0.05];
    } else {
      throw new Error("Invalid graph type");
    }
    return { domain, viewport };
  })();

  const kx = useSharedValue(1);
  const ky = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);


  const resetTransform = () => {
    tx.value = withTiming(0);
  }

  // enforce limits when panning
  useAnimatedReaction(
    () => {
      return transformState.panActive.value || transformState.zoomActive.value;
    },
    (cv, pv) => {
      if (!cv && pv) {
        const vals = getTransformComponents(transformState.matrix.value);
        kx.value = vals.scaleX;
        tx.value = vals.translateX;

        if (tx.value < 0) {
          tx.value = withTiming(0);
        }

        // const limit = 300;
        // if (tx.value > limit) {
        //   tx.value = withTiming(limit);
        // }
      }
    },
  );


  useAnimatedReaction(
    () => {
      return { kx: kx.value, ky: ky.value, tx: tx.value, ty: ty.value };
    },
    ({ kx, ky, tx, ty }) => {
      const m = setTranslate(transformState.matrix.value, tx, ty);
      transformState.matrix.value = setScale(m, kx, ky);
    },
  );

  const barPlot = (values: any, zero: any, stat: string, unit?: string) => {
    return (
      <>
        {(() => {
          const elements = [];
          for (let i = 0; i < values.length; i++) {
            const label = (binStats as any)[i][stat].toFixed(0) + (unit ?? "");
            const val = values[i];
            const [vx, vy] = [val.x, val.y ?? NaN];
            const w = barWidth;

            const fill = Skia.Path.Make();
            fill.moveTo(vx - w, vy);
            fill.lineTo(vx + w, vy);
            fill.lineTo(vx + w, zero[i].y ?? NaN);
            fill.lineTo(vx - w, zero[i].y ?? NaN);
            fill.close()

            const labelSize = font.measureText(label);

            elements.push(
              <Fragment key={"bar" + i}>
                <Path
                  style="fill"
                  path={fill}
                  color={activityColor}
                />

                <SkiaText
                  key={"label" + i}
                  x={vx - labelSize.width / 2}
                  color={activityColor}
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

  const binningLabels: Record<typeof activity.graph.binSize, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
    quarter: "Quarter",
    year: "Year"
  };
  const binningOptions = Object.entries(binningLabels).map(([key, label]) => ({ key, label }));

  const graphTypes = activity.unit === null ? ["bar-count", "bar-daily-mean"] : ["box", "bar-count", "bar-sum", "line-mean"];

  return (
    <View style={{ flex: 1, padding: 10, marginVertical: 16, backgroundColor: theme.colors.background }}>
      <View key="activityGraph" style={{ height: 300, width: '100%' }}>
        <CartesianChart
          data={binStats}
          transformState={transformState}
          transformConfig={{
            pan: { dimensions: "x" },
            pinch: { enabled: false }
          }}
          padding={{ bottom: 10 }}
          domain={domain}
          viewport={viewport}
          xKey="t"
          yKeys={yKeys}
          // frame={{
          //   lineWidth: 0,
          //   lineColor: theme.colors.onSurfaceVariant,
          // }}
          xAxis={{
            tickValues: ticks, // binStats.map((q) => q.t),
            font: font,
            // enableRescaling: true,
            lineWidth: 0,
            lineColor: theme.colors.onSurfaceVariant,
            labelColor: theme.colors.onSurfaceVariant,

            formatXLabel: (t: number) => {
              const d = new Date(t);
              if (activity.graph.binSize === "day") {
                return "" + d.getDate();
              } else if (activity.graph.binSize === "week") {
                return "" + (d.getDate() + 1);
              } else if (activity.graph.binSize === "month") {
                const m = d.getMonth() + 1;
                return m > 1 ? `${m}` : `'${d.getFullYear() % 100}`;
              } else if (activity.graph.binSize === "quarter") {
                const q = d.getMonth() / 3 + 1;
                return q > 1 ? `q${q}` : `'${d.getFullYear() % 100}`;
              } else if (activity.graph.binSize === "year") {
                return "" + d.getFullYear();
              } else {
                throw new Error("Invalid bin size");
              }
            },
            tickCount: 1000,
          }}
          yAxis={[
            {
              yKeys: yKeys,
              font: font,
              tickCount: 10,
              // lineWidth: 1,
              lineColor: theme.colors.outline,
              labelColor: theme.colors.outline,
            },
          ]}
        >
          {({ points }) => {
            if (activity.graph.graphType === "box") {
              return (
                <>
                  {(() => {
                    const elements = [];
                    for (let i = 0; i < points.q0.length; i++) {
                      const w = barWidth;
                      const ws = w * 0.4;
                      const wcircle = w * 0.5;

                      const q0 = points.q0[i];
                      const q1 = points.q1[i];
                      const q2 = points.q2[i];
                      const q3 = points.q3[i];
                      const q4 = points.q4[i];
                      const [q0x, q0y] = [q0.x, q0.y ?? NaN];
                      const [q2x, q2y] = [q2.x, q2.y ?? NaN];
                      var [q1x, q1y] = [q1.x, Math.max(q1.y ?? NaN, q2y + w)];
                      var [q3x, q3y] = [q3.x, Math.min(q3.y ?? NaN, q2y - w)];
                      const [q4x, q4y] = [q4.x, q4.y ?? NaN];

                      elements.push(
                        <Fragment key={"" + i}>
                          <RoundedRect
                            x={q1x - w}
                            y={q1y}
                            width={2 * w}
                            height={q3y - q1y}
                            color={activityColor}
                            r={w}
                          />
                          <RoundedRect
                            x={q0x - ws}
                            y={q0y}
                            width={2 * ws}
                            height={q4y - q0y}
                            color={activityColor}
                            r={ws}
                          />
                          <RoundedRect
                            x={q2x - wcircle}
                            y={q2y - wcircle}
                            width={2 * wcircle}
                            height={2 * wcircle}
                            color={theme.colors.surface}
                            r={wcircle}
                          />
                        </Fragment>
                      );
                    }
                    return elements;
                  })()}
                </>
              );
            } else if (activity.graph.graphType === "bar-count") {
              return barPlot(points.count, points.zero, "count");
            } else if (activity.graph.graphType === "bar-daily-mean") {
              return barPlot(points.dailyMean, points.zero, "dailyMean", "%");
            } else if (activity.graph.graphType === "bar-sum") {
              return barPlot(points.sum, points.zero, "sum");
            } else if (activity.graph.graphType === "line-mean") {
              return (
                <>
                  <Line
                    points={points.mean}
                    color={activityColor}
                    strokeWidth={4}
                  />
                  <Scatter
                    points={points.mean}
                    shape="circle"
                    radius={7}
                    style="fill"
                    color={theme.colors.surface}
                  />
                  <Scatter
                    points={points.mean}
                    shape="circle"
                    radius={5}
                    style="fill"
                    color={activityColor}
                  />
                </>
              );
            }
          }}
        </CartesianChart>
      </View>
      <View key="menusRow" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
        {/* Binning menu */}
        <DropdownMenu
          options={binningOptions}
          selectedKey={activity.graph.binSize}
          onSelect={(key) => {
            resetTransform();
            setActivityGraph(activityName, { ...activity.graph, binSize: key as BinSize });
          }}
          visible={binMenuVisible}
          setVisible={setBinMenuVisible}
          themeColors={theme.colors}
        />
        {/* SubUnit menu */}
        <SubUnitMenu
          subUnitNames={subUnitNames}
          subUnitName={activity.graph.subUnit}
          setSubUnitName={(name) => setActivityGraph(activityName, { ...activity.graph, subUnit: name })}
          menuVisible={subUnitMenuVisible}
          setMenuVisible={setSubUnitMenuVisible}
          themeColors={theme.colors}
        />
        {/* Tags menu */}
        <TagMenu
          tags={activity.graph.tagFilters}
          onChange={(tags) => setActivityGraph(activityName, { ...activity.graph, tagFilters: tags })}
          menuVisible={tagsMenuVisible}
          setMenuVisible={setTagsMenuVisible}
          activityTags={activity.tags}
          palette={palette}
          themeColors={theme.colors}
        />
        {/* Graph type menu */}
        <Menu
          visible={graphTypeMenuVisible}
          onDismiss={() => setGraphTypeMenuVisible(false)}
          anchor={
            <Button compact={true} onPress={() => setGraphTypeMenuVisible(true)}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {graphLabel(activity.graph.graphType)}
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
                setActivityGraph(activityName, { ...activity.graph, graphType: type as GraphType });
              }}
              title={<View style={{ flexDirection: 'row', alignItems: 'center' }}>{graphLabel(type)}</View>}
              trailingIcon={activity.graph.graphType === type ? "check" : undefined}
            />
          ))}
        </Menu>
      </View>
    </View>
  );
};

export default ActivityGraph; 