import React, { Fragment, useState } from "react";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { Chip, useTheme, Menu, Button } from 'react-native-paper';
import { getTransformComponents, Line, Scatter, setScale, setTranslate, useChartTransformState } from "victory-native";
import { CartesianChart } from "victory-native";
import {matchFont, Path, RoundedRect, Skia} from "@shopify/react-native-skia";
import useStore, { GoalType, Tag } from "./Store";
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
  const [binMenuVisible, setBinMenuVisible] = useState(false);
  const [tags, setTags] = useState<{name: string, state: "yes" | "no" | "maybe"}[]>(goal.tags.map((t: Tag) => ({name: t.name, state: "maybe"})));
  const [graphType, setGraphType] = useState<"box" | "bar-count" | "bar-sum" | "line-mean">("box");
  const graphTypes = ["box", "bar-count", "bar-sum", "line-mean"];
  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;
  const subUnitNames = typeof goal.unit === 'string' ? null : goal.unit.map((u: any) => u.name);
  const [subUnitName, setSubUnitName] = useState(subUnitNames?.[0] || null);
  const [subUnitMenuVisible, setSubUnitMenuVisible] = useState(false);
  const [tagsMenuVisible, setTagsMenuVisible] = useState(false);
  const [graphTypeMenuVisible, setGraphTypeMenuVisible] = useState(false);

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
  const barHeight = 5;
  
  var ticks = [];
  if (goal.dataPoints.length > 0) {
    var tick_t = binTime(binning, goal.dataPoints[0].time, 0);
    for (let i = 0; tick_t < now.getTime(); i++) {
      tick_t = binTime(binning, goal.dataPoints[0].time, i);
      ticks.push(tick_t);
      if (i > 1000) {
        break; // limit
      }
    }
  }

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

  const graphLabel = (gType: any) => {
    if (gType === "box") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="barchart" size={24} color={theme.colors.onSurfaceVariant} /><Text style={{ color: theme.colors.onSurfaceVariant }}>Box</Text></View>);
    } else if (gType === "bar-count") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="barschart" size={24} color={theme.colors.onSurfaceVariant} /><Text style={{ color: theme.colors.onSurfaceVariant }}>Count</Text></View>);
    } else if (gType === "bar-sum") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="barschart" size={24} color={theme.colors.onSurfaceVariant} /><Text style={{ color: theme.colors.onSurfaceVariant }}>Sum</Text></View>);
    } else if (gType === "line-mean") {
      return (<View style={{flexDirection: 'row', alignItems: 'center'}}><AntDesign name="linechart" size={24} color={theme.colors.onSurfaceVariant} /><Text style={{ color: theme.colors.onSurfaceVariant }}>Mean</Text></View>);
    }
  }

  const {domain, viewport} : {domain: {x: [number, number], y?: [number, number]}, viewport: {x: [number, number]}} = (() => {
    const firstBinTime = bins.length ? bins[0].time : now.getTime();
    const lastBinTime = bins.length ? bins[bins.length - 1].time : now.getTime();
    const nowBin = binTime(binning, now.getTime(), 0);
    const t1 = Math.max(lastBinTime, nowBin) + approximateBinSize(binning) / 2;
    const t0view = t1 - approximateBinSize(binning) * 15;
    const t0 = Math.min(firstBinTime - approximateBinSize(binning) / 2, t0view);
    
    var domain : {x: [number, number], y?: [number, number]} = {x: [t0, t1]};
    var viewport : {x: [number, number]} = {x: [t0view, t1]};
    if (graphType === "box") {
      const [ymin, ymax] = [Math.min(...binStats.map((b) => b.q0)), Math.max(...binStats.map((b) => b.q4))];
      domain.y = [ymin + (ymax - ymin) * 0.05, ymax + (ymax - ymin) * 0.05];
    } else if (graphType === "bar-count") {
      domain.y = [0, Math.max(...binStats.map((b) => b.count))];
    } else if (graphType === "bar-sum") {
      domain.y = [0, Math.max(...binStats.map((b) => b.sum))];
    } else if (graphType === "line-mean") {
      domain.y = [Math.min(...binStats.map((b) => b.mean)), Math.max(...binStats.map((b) => b.mean))];
    } else {
      throw new Error("Invalid graph type");
    }
    return {domain, viewport};
  })();


  // const [xDomain, setXDomain] = useState<[number, number]>(domain.x);

  const kx = useSharedValue(1);
  const ky = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const resetTransform = () => {
    tx.value = withTiming(0);
  }

    // transformState.matrix.value = setScale(transformState.matrix.value, 1, 1);
  // transformState.matrix.value = setTranslate(transformState.matrix.value, 0, 0);

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

  const binningLabels: Record<typeof binning, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
    quarter: "Quarter",
    year: "Year"
  };

  return (
    <View style={{ flex: 1, padding: 10, backgroundColor: theme.colors.background }}>
      {/* Menus row */}
      <View key="menusRow" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
        {/* Binning menu */}
        <Menu
          visible={binMenuVisible}
          onDismiss={() => setBinMenuVisible(false)}
          anchor={
            <Button compact={true} onPress={() => setBinMenuVisible(true)} style={{ marginRight: 8 }}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Text style={{ marginRight: 10, color: theme.colors.onSurfaceVariant }}>{binningLabels[binning]}</Text>
                <AntDesign name="down" size={16} color={theme.colors.onSurfaceVariant} />
      </View>
            </Button>
          }
        >
          {Object.entries(binningLabels).map(([key, label]) => (
            <Menu.Item
              key={key}
              onPress={() => {
                setBinMenuVisible(false);
                resetTransform();
                setBinning(key as typeof binning);
              }}
              title={label}
              leadingIcon={binning === key ? "check" : undefined}
            />
          ))}
        </Menu>
        {/* SubUnit menu */}
        {subUnitNames && (
          <Menu
            visible={subUnitMenuVisible}
            onDismiss={() => setSubUnitMenuVisible(false)}
            anchor={
              <Button compact={true} onPress={() => setSubUnitMenuVisible(true)} style={{ marginRight: 8 }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{ marginRight: 10, color: theme.colors.onSurfaceVariant }}>{subUnitName}</Text>
                  <AntDesign name="down" size={16} color={theme.colors.onSurfaceVariant} />
                </View>
              </Button>
            }
          >
            {subUnitNames.map((name: string) => (
              <Menu.Item
                key={name}
                onPress={() => {
                  setSubUnitMenuVisible(false);
                  setSubUnitName(name);
                }}
                title={name}
                leadingIcon={subUnitName === name ? "check" : undefined}
              />
            ))}
          </Menu>
        )}
        {/* Tags menu */}
        {goal.tags.length > 0 && (
          <Menu
            visible={tagsMenuVisible}
            onDismiss={() => setTagsMenuVisible(false)}
            anchor={
              <Button compact={true} onPress={() => setTagsMenuVisible(true)} style={{ marginRight: 8 }}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={{ marginRight: 10, color: theme.colors.onSurfaceVariant }}>
                    Tags
                    {(() => {
                      const yesTags = tags.filter(t => t.state === 'yes').map(t => t.name);
                      const noTags = tags.filter(t => t.state === 'no').map(t => t.name);
                      if (yesTags.length === 0 && noTags.length === 0) 
                        return '';
                      else
                        return '*';
                    })()}
                  </Text>
                  <AntDesign name="down" size={16} color={theme.colors.onSurfaceVariant} />
                </View>
              </Button>
            }
          >
            {goal.tags.map((tag: Tag) => {
              const state = tags.find((t) => t.name === tag.name)?.state;
              let icon = undefined;
              let title = tag.name;
              if (state === 'yes') icon = 'check';
              else if (state === 'no') icon = 'close';
              return (
                <Menu.Item
                  key={tag.name}
                  onPress={() => {
                    setTags(tags.map((t) => t.name === tag.name ? {
                      ...t,
                      state: t.state === 'maybe' ? 'yes' : t.state === 'yes' ? 'no' : 'maybe'
                    } : t));
                  }}
                  title={title}
                  leadingIcon={icon}
                />
              );
            })}
          </Menu>
        )}
        {/* Graph type menu */}
        <Menu
          visible={graphTypeMenuVisible}
          onDismiss={() => setGraphTypeMenuVisible(false)}
          anchor={
            <Button compact={true} onPress={() => setGraphTypeMenuVisible(true)}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                {graphLabel(graphType)}
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
                setGraphType(type as "box" | "bar-count" | "bar-sum" | "line-mean");
              }}
              title={<View style={{flexDirection: 'row', alignItems: 'center'}}>{graphLabel(type)}</View>}
              leadingIcon={graphType === type ? "check" : undefined}
            />
          ))}
        </Menu>
      </View>

      <View key="goalGraph" style={{height: '50%', width: '100%'}}>
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
          xKey="t" 
          yKeys={yKeys}
          // frame={{
          //   lineWidth: 1,
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
              if (binning === "day") {
                return "" + d.getDate();
              } else if (binning === "week") {
                return "" + (d.getDate() + 1);
              } else if (binning === "month") {
                const m = d.getMonth() + 1;
                return m > 1 ? `${m}` : `'${d.getFullYear() % 100}`;
              } else if (binning === "quarter") {
                const q = d.getMonth() / 3 + 1;
                return q > 1 ? `q${q}` : `'${d.getFullYear() % 100}`;
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
              // lineWidth: ,
              lineColor: theme.colors.onSurfaceVariant,
              labelColor: theme.colors.onSurfaceVariant,
            },
          ]}
          >
          {({ points }) => {
            if (graphType === "box") {
              return (
                <>
                  {(() => {
                  const elements = [];
                  for (let i = 0; i < points.q0.length; i++) {
                    const w = barWidth;
                    const h = barHeight;
                    
                    const ws = w*0.4;
                    const hs = h*0.4;

                      const q0 = points.q0[i];
                      const q1 = points.q1[i];
                      const q2 = points.q2[i];
                      const q3 = points.q3[i];
                      const q4 = points.q4[i];
                      const [q0x, q0y] = [q0.x, q0.y ?? NaN];
                      var [q1x, q1y] = [q1.x, q1.y ?? NaN];
                      const [q2x, q2y] = [q2.x, q2.y ?? NaN];
                      var [q3x, q3y] = [q3.x, q3.y ?? NaN];
                      const [q4x, q4y] = [q4.x, q4.y ?? NaN];

                      if (q1.y == q3.y) { 
                        q1y -= h;
                        q3y += h;
                      }

                      elements.push(
                        <Fragment key={"" + i}>
                          <RoundedRect
                            x={q1x - w}
                            y={q1y}
                            width={2*w}
                            height={q3y - q1y}
                            color={theme.colors.primary}
                            r={w/2}
                          />
                          <RoundedRect
                            x={q0x - ws}
                            y={q0y}
                            width={2*ws}
                            height={q4y - q0y}
                            color={theme.colors.primary}
                            r={ws}
                          />
                          <RoundedRect
                            x={q2x - w * 1.7}
                            y={q2y - hs}
                            width={2 * w * 1.7}
                            height={3 * hs}
                            color={theme.colors.primary}
                            r={ws}
                          />
                        </Fragment>
                      );
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