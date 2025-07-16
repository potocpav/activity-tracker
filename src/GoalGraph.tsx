import React, { Fragment, useState } from "react";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { Chip, useTheme } from 'react-native-paper';
import { Bar, getTransformComponents, Line, Scatter, setScale, setTranslate, useChartTransformState } from "victory-native";
import { CartesianChart } from "victory-native";
import {matchFont, Path, Points, Rect, Skia, Line as SkLine, vec} from "@shopify/react-native-skia";
import useStore, { GoalType, State, Tag } from "./Store";
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { binTime, binTimeSeries, BinSize } from "./GoalUtil";
import AntDesign from '@expo/vector-icons/AntDesign';

const fontFamily = Platform.select({default: "sans-serif" });
const font = matchFont({fontFamily: fontFamily, fontSize: 10});

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
    throw new Error("Invalid bin size");
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
  return {q0, q1, q2, q3, q4};
};

const toggleButton = (key: string, label: React.ReactNode, isActive: boolean, onPress: () => void, theme: any) => {
  return (
    <TouchableOpacity 
      key={key}
      style={{ 
        padding: 8, 
        marginHorizontal: 4, 
        backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
        borderRadius: 6
      }}
      onPress={onPress}
    >
      <Text style={{ 
        color: isActive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant, 
        fontWeight: 'bold' 
      }}>{label}</Text>
    </TouchableOpacity>
  );
}

const GoalGraph = ({ route }: { route: any }) => {
  const theme = useTheme();
  const { goalName } = route.params;
  const goals = useStore((state: any) => state.goals);
  const goal = goals.find((g: GoalType) => g.name === goalName);
  
  if (!goal) {
    return <Text>Goal not found</Text>;
  }

  const [binning, setBinning] = useState<"day" | "week" | "month" | "quarter" | "year">("day");
  const [tags, setTags] = useState<{name: string, state: "yes" | "no" | "maybe"}[]>(goal.tags.map((t: Tag) => ({name: t.name, state: "maybe"})));
  const [graphType, setGraphType] = useState<"box" | "bar-count" | "bar-sum" | "line-mean">("box");
  const graphTypes = ["box", "bar-count", "bar-sum", "line-mean"];
  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;
  const subUnitNames = typeof goal.unit === 'string' ? null : goal.unit.map((u: any) => u.name);
  const [subUnitName, setSubUnitName] = useState(subUnitNames?.[0] || null);

  const extractValue = (dataPoint: any) => {
    const requiredTags = tags.filter((t) => t.state === "yes");
    const negativeTags = tags.filter((t) => t.state === "no");
    const hasAllRequiredTags = requiredTags.every((t) => dataPoint.tags.includes(t.name));
    const hasAnyNegativeTags = negativeTags.some((t) => dataPoint.tags.includes(t.name));
    if (hasAllRequiredTags && !hasAnyNegativeTags) {
      const value = subUnitName ? dataPoint.value[subUnitName] : dataPoint.value;
      return value;
    } else {
      return null;
    }
  }

  const now = new Date();

  const barWidth = 5;
  
  const bins = binTimeSeries(binning, goal.dataPoints);
  const binStats : {t: number, q0: number, q1: number, q2: number, q3: number, q4: number, count: number, sum: number, mean: number, zero: number}[] = bins.map((bin) => {
    const values = bin.values.map(extractValue).filter((v: number) => v !== null);
    if (values.length === 0) {
      return null
    } else {
      return {
        ...quartiles(values),
        count: values.length,
        sum: values.reduce((a, b) => a + b, 0),
        mean: values.reduce((a, b) => a + b, 0) / values.length,
        zero: 0,
        t: bin.time
      };
    }
  }).filter((b) => b !== null);


  var yKeys : (keyof typeof binStats[number])[]; 
  if (graphType === "box") {
    yKeys = ["q0", "q1", "q2", "q3", "q4"];
  } else if (graphType === "bar-count") {
    yKeys = ["count", "zero"];
  } else if (graphType === "bar-sum") {
    yKeys = ["sum", "zero"];
  } else if (graphType === "line-mean") {
    yKeys = ["mean"];
  } else {
    throw new Error("Invalid graph type");
  }

  const graphLabel = (gType: any) => {;
    if (gType === "box") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="barchart" size={24} color="black" /><Text>Box</Text></View>);
    } else if (gType === "bar-count") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="barschart" size={24} color="black" /><Text>Count</Text></View>);
    } else if (gType === "bar-sum") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="barschart" size={24} color="black" /><Text>Sum</Text></View>);
    } else if (gType === "line-mean") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="linechart" size={24} color="black" /><Text>Mean</Text></View>);
    }
  }

  const {domain, viewport} : {domain: {x: [number, number], y?: [number]}, viewport: {x: [number, number]}} = (() => {
    const nowBin = binTime(binning, now.getTime(), 0);
    const t1 = Math.max(bins[bins.length - 1].time, nowBin) + approximateBinSize(binning) / 2;
    const t0view = t1 - approximateBinSize(binning) * 15;
    const t0 = Math.min(bins[0].time  - approximateBinSize(binning) / 2, t0view);

    console.log(new Date(t0), new Date(t0view), new Date(t1));
    
    var domain : {x: [number, number], y?: [number]} = {x: [t0, t1]};
    var viewport : {x: [number, number]} = {x: [t0view, t1]};
    if (graphType === "box") {

    } else if (graphType === "bar-count") {
      domain.y = [0];
    } else if (graphType === "bar-sum") {
      domain.y = [0];
    } else if (graphType === "line-mean") {

    } else {
      throw new Error("Invalid graph type");
    }
    return {domain, viewport};
  })();

  const k = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  // enforce limits when panning
  useAnimatedReaction(
    () => {
      return transformState.panActive.value || transformState.zoomActive.value;
    },
    (cv, pv) => {
      if (!cv && pv) {
        const vals = getTransformComponents(transformState.matrix.value);
        k.value = vals.scaleX;
        tx.value = vals.translateX;
        ty.value = vals.translateY;

        k.value = withTiming(1);
        tx.value = withTiming(0);
        ty.value = withTiming(0);
      }
    },
  );

  useAnimatedReaction(
    () => {
      return { k: k.value, tx: tx.value, ty: ty.value };
    },
    ({ k, tx, ty }) => {
      const m = setTranslate(transformState.matrix.value, tx, ty);
      transformState.matrix.value = setScale(m, k);
    },
  );

  const barPlot = (values: any, zero: any) => {
    return (
      <>
        {(() => {
        const elements = [];
        for (let i = 0; i < values.length; i++) {
          const val = values[i];
          const [vx, vy] = [val.x, val.y ?? NaN];
          const w = barWidth;

            const fill = Skia.Path.Make();
            fill.moveTo(vx - w, vy);
            fill.lineTo(vx + w, vy);
            fill.lineTo(vx + w, zero[i].y ?? NaN);
            fill.lineTo(vx - w, zero[i].y ?? NaN);
            fill.close()        

            elements.push(
              <Fragment key={"" + i}>
                <Path
                  style="fill"
                  path={fill}
                  color={theme.colors.primary}
                />
              </Fragment>
            );
        }
        return elements;
      })()}
    </>);
  }

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Binning selection buttons */}
      <View key="binningButtons" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        {toggleButton("D", "Day", binning === 'day', () => setBinning('day'), theme)}
        {toggleButton("W", "Week", binning === 'week', () => setBinning('week'), theme)}
        {toggleButton("M", "Month", binning === 'month', () => setBinning('month'), theme)}
        {toggleButton("Q", "Quarter", binning === 'quarter', () => setBinning('quarter'), theme)}
        {toggleButton("Y", "Year", binning === 'year', () => setBinning('year'), theme)}
      </View>
      { subUnitNames && (
        <View key="subUnitNames" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ marginRight: 10, color: theme.colors.onSurface }}>Value:</Text>
          {subUnitNames?.map((name: string) => 
            toggleButton(name, name, subUnitName === name, () => setSubUnitName(name), theme))}
        </View>
      )}

      { goal.tags.length > 0 && (
        <View key="tags" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ marginRight: 10, color: theme.colors.onSurface }}>Tags:</Text>
          {goal.tags.map((tag: Tag) => 
            <Chip 
              key={tag.name} 
              icon={(() => {
                const state = tags.find((t) => t.name === tag.name)?.state;
                if (state === "yes") {
                  return "check";
                } else if (state === "no") {
                  return "close";
                } else {
                  return "";
                }
              })()}
              selected={tags.find((t) => t.name === tag.name)?.state === "yes"}
              style={{ marginRight: 10 }}
              onLongPress={() => {
                setTags(tags.map((t) => t.name === tag.name ? {...t, state: t.state === "maybe" ? "no" : "maybe"} : t));
              }}
              onPress={() => {
                setTags(tags.map((t) => t.name === tag.name ? {...t, state: t.state === "maybe" ? "yes" : "maybe"} : t));
              }}
            >{tag.name}</Chip>
            )}
        </View>
      )}

      <View key="graphTypeButtons" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        {graphTypes.map((type) => toggleButton(type, graphLabel(type), graphType === type, () => setGraphType(type as "box" | "bar-count" | "bar-sum" | "line-mean"), theme))}
      </View>

      <View key="goalGraph" style={{flex: 1, width: '100%'}}>
        <CartesianChart 
          data={binStats} 
          transformState={transformState}
          transformConfig={{
            pan: { dimensions: "x" },
            pinch: { enabled: false }
          }}
          padding={{bottom: 10}}
          domain={domain}
          viewport={viewport}
          domainPadding={{top: 10, bottom: 0, left: barWidth, right: barWidth}}
          xKey="t" 
          yKeys={yKeys}
          // frame={{
          //   lineWidth: 1,
          //   lineColor: theme.colors.onSurfaceVariant,
          // }}
          xAxis={{
            tickValues: binStats.map((q) => q.t),
            font: font,
            // enableRescaling: true,
            lineColor: theme.colors.onSurfaceVariant,
            labelColor: theme.colors.onSurfaceVariant,

            formatXLabel: (t: number) => {
              const d = new Date(t);
              if (binning === "day") {
                return "" + d.getDate();
              } else if (binning === "week") {
                return "" + (d.getDate() + 1);
              } else if (binning === "month") {
                return "" + (d.getMonth() + 1);
              } else if (binning === "quarter") {
                return "q" + (d.getMonth() / 3 + 1);
              } else if (binning === "year") {
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
              lineColor: theme.colors.onSurfaceVariant,
              labelColor: theme.colors.onSurfaceVariant,
            },
          ]}
          >
          {({ points, chartBounds }) => {
            if (graphType === "box") {
              return (
                <>
                  {(() => {
                  const elements = [];
                  for (let i = 0; i < points.q0.length; i++) {
                    const q0 = points.q0[i];
                    const q4 = points.q4[i];
                    const [q0x, q0y] = [q0.x, q0.y ?? NaN];
                    const [q4x, q4y] = [q4.x, q4.y ?? NaN];
                    const w = barWidth;
                    if (q0.y == q4.y) {
                      const path = Skia.Path.Make();
                      path.moveTo(q0x - w, q0y - w);
                      path.lineTo(q0x + w, q0y - w);
                      path.lineTo(q4x + w, q4y + w);
                      path.lineTo(q4x - w, q4y + w);
                      path.close();
                      elements.push(
                        <Fragment key={"" + i}>
                          <Path
                            path={path}
                            color={theme.colors.primary}
                          />
                          <Path
                            style="stroke"
                            path={path}
                            color={theme.colors.primary}
                            strokeWidth={1}
                          />                          
                        </Fragment>
                      );
                    } else {
                      const q1 = points.q1[i];
                      const q2 = points.q2[i];
                      const q3 = points.q3[i];
                      const [q1x, q1y] = [q1.x, q1.y ?? NaN];
                      const [q2x, q2y] = [q2.x, q2.y ?? NaN];
                      const [q3x, q3y] = [q3.x, q3.y ?? NaN];

                      const fill = Skia.Path.Make();
                      fill.moveTo(q3x - w, q3y);
                      fill.lineTo(q3x + w, q3y);
                      fill.lineTo(q1x + w, q1y);
                      fill.lineTo(q1x - w, q1y);
                      fill.close()        

                      const stroke = Skia.Path.Make();
                      stroke.moveTo(q4x, q4y);
                      stroke.lineTo(q3x, q3y);
                      stroke.moveTo(q2x - w, q2y);
                      stroke.lineTo(q2x + w, q2y);
                      stroke.moveTo(q1x, q1y);
                      stroke.lineTo(q0x, q0y);

                      const q2stroke = Skia.Path.Make();
                      q2stroke.moveTo(q2x - w, q2y);
                      q2stroke.lineTo(q2x + w, q2y);

                      elements.push(
                        <Fragment key={"" + i}>
                          <Path
                            style="fill"
                            path={fill}
                            color={theme.colors.primary}
                          />
                          <Path
                            style="stroke"
                            path={stroke}
                            color={theme.colors.primary}
                            strokeWidth={w*0.7}
                          />
                          <Path
                            style="stroke"
                            path={q2stroke}
                            color={theme.colors.onSurface}
                            strokeWidth={w*0.5}
                          />
                        </Fragment>
                      );
                    }
                  }
                  return elements;
                })()}
              </>
            );
            } else if (graphType === "bar-count") {
              return barPlot(points.count, points.zero);
            } else if (graphType === "bar-sum") {
              return barPlot(points.sum, points.zero);
            } else if (graphType === "line-mean") {
              return (
                <>
                <Line
                  points={points.mean}
                  color={theme.colors.primary}
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
                  color={theme.colors.primary}
                />
                </>
              );
            }
          }}
        </CartesianChart>
      </View>
    </View>
  );
};

export default GoalGraph; 