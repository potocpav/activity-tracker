import React, { Fragment, useState } from "react";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { getTransformComponents, setScale, setTranslate, useChartTransformState } from "victory-native";
import { CartesianChart } from "victory-native";
import {matchFont, Path, Points, Rect, Line as SkLine, vec} from "@shopify/react-native-skia";
import { GoalType, State } from "./Store";
import { useStore } from "zustand";
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";

const fontFamily = Platform.select({default: "sans-serif" });
const font = matchFont({fontFamily: fontFamily, fontSize: 10});

type BinSize = "day" | "week" | "month" | "quarter" | "year";

const binSizeWindow = (binSize: BinSize) => {
  const day = 24 * 60 * 60 * 1000;
  if (binSize === "day") {
    return 31 * day;
  } else if (binSize === "week") {
    return 20 * 7 * day;
  } else if (binSize === "month") {
    return 20 * 30 * day;
  } else if (binSize === "quarter") {
    return 20 * 365 / 4 * day;
  } else if (binSize === "year") {
    return 20 * 365 * day;
  } else {
    throw new Error("Invalid bin size");
  }
}

const binTime = (binSize: BinSize, t0: Date, i: number) => {
  const offset = t0.getTimezoneOffset();
  if (binSize === "day") {
    return new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + i, 0, -offset);
  } else if (binSize === "week") {
    const dayOfWeek = t0.getDay();
    return new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() - dayOfWeek + i * 7, 0, -offset);
  } else if (binSize === "month") {
    return new Date(t0.getFullYear(), t0.getMonth() + i, 1, 0, -offset);
  } else if (binSize === "quarter") {
    const month = t0.getMonth()
    return new Date(t0.getFullYear(), month - (month % 3) + i * 3, 1, 0, -offset);
  } else if (binSize === "year") {
    return new Date(t0.getFullYear() + i, 0, 1, 0, -offset);
  } else {
    throw new Error("Invalid bin size");
  }
};


const binTimeSeries = (binSize: BinSize, dataPoints: any[]) => {
  const t0 = dataPoints[0].time;

  var bins: {time: Date, values: any[]}[] = [{time: binTime(binSize, t0, 0), values: []}];
  var binIx = 0;
  for (let i = 0; i < dataPoints.length; i++) {
    const dp = dataPoints[i];
    var newBin = false;
    while (binTime(binSize, t0, binIx+1) <= dp.time) {
      binIx++;
      newBin = true;
    }
    if (newBin) {
      bins.push({time: binTime(binSize, t0, binIx), values: []});
    }
    bins[bins.length-1].values.push(dp);
  };
  return bins;
};

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

const toggleButton = (label: string, isActive: boolean, onPress: () => void) => {
  return (
    <TouchableOpacity 
      style={{ 
        padding: 8, 
        marginHorizontal: 4, 
        backgroundColor: isActive ? '#007AFF' : '#E5E5EA',
        borderRadius: 6
      }}
      onPress={onPress}
    >
      <Text style={{ color: isActive ? 'white' : 'black', fontWeight: 'bold' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const GoalGraph = ({ route }: { route: any }) => {
  const { goal } = route.params;
  const [binning, setBinning] = useState<"day" | "week" | "month" | "quarter" | "year">("day");
  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;
  const subUnitNames = typeof goal.unit === 'string' ? null : goal.unit.map((u: any) => u.name);
  const [subUnitName, setSubUnitName] = useState(subUnitNames?.[0] || null);
  const extractValue = (v: any) => subUnitName ? v.value[subUnitName] : v.value;

  const now = new Date();

  const barWidth = 5;
  
  let bins = binTimeSeries(binning, goal.dataPoints);
  const binQuartiles : {t: number, q0: number, q1: number, q2: number, q3: number, q4: number}[] = bins.map((bin) => ({
    ...quartiles(bin.values.map(extractValue)),
    t: bin.time.getTime()
  }));


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

  return (
    <View style={{ flex: 1, padding: 10 }}>
      {/* Binning selection buttons */}
      <View key="binningButtons" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ marginRight: 10 }}>Binning:</Text>
        {toggleButton("D", binning === 'day', () => setBinning('day'))}
        {toggleButton("W", binning === 'week', () => setBinning('week'))}
        {toggleButton("M", binning === 'month', () => setBinning('month'))}
        {toggleButton("Q", binning === 'quarter', () => setBinning('quarter'))}
        {toggleButton("Y", binning === 'year', () => setBinning('year'))}
      </View>
      { subUnitNames && (
        <View key="subUnitNames" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ marginRight: 10 }}>Value:</Text>
          {subUnitNames?.map((name: string) => 
            toggleButton(name, subUnitName === name, () => setSubUnitName(name)))}
        </View>
      )}

      {/* <Text>Goal Graph Placeholder</Text> */}
      <View key="goalGraph" style={{flex: 1, width: '100%'}}>
        <CartesianChart 
          data={binQuartiles} 
          transformState={transformState}
          transformConfig={{
            pan: { dimensions: "x" },
            pinch: { enabled: false }
          }}
          padding={{bottom: 10}}
          domain={{x: [now.getTime() - binSizeWindow(binning), now.getTime()]}}
          domainPadding={{left: barWidth, right: barWidth}}
          xKey="t" 
          yKeys={["q0", "q1", "q2", "q3", "q4"]}
          frame={{
            lineWidth: 1,
          }}
          xAxis={{
            // tickValues: binQuartiles.map((q) => q.t),
            font: font,
            enableRescaling: true,

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
            tickCount: 10,
          }}
          yAxis={[
            {
              yKeys: ["q0", "q1", "q2", "q3", "q4"],
              font: font,
              tickCount: 10,
            },
          ]}
          >              
          {({ points }) =>  {
            return (
              <>
                {(() => {
                  const elements = [];
                  for (let i = 0; i < points.q0.length; i++) {
                    const q0 = points.q0[i];
                    const q1 = points.q1[i];
                    const q2 = points.q2[i];
                    const q3 = points.q3[i];
                    const q4 = points.q4[i];
                    const w = barWidth;
                    const rectPoints = [
                      vec(q1.x - w, q1.y || 0), 
                      vec(q1.x + w, q1.y || 0), 
                      vec(q3.x + w, q3.y || 0), 
                      vec(q3.x - w, q3.y || 0),
                      vec(q1.x - w, q1.y || 0),
                    ];
                    elements.push(
                      <Fragment key={"" + i}>
                      <Rect 
                        key={"rect fill" + i}
                        x={q1.x - w}
                        y={q1.y || 0}
                        width={2 * w}
                        height={(q3.y || 0) - (q1.y || 0)}
                        color="lightblue"
                      />
                      <SkLine
                        key={"q0 line" + i}
                        p1={vec(q0.x - w, q0.y || 0)}
                        p2={vec(q0.x + w, q0.y || 0)}
                        color="black"
                        strokeWidth={1}
                      />                      
                      <SkLine
                        key={"q2 line" + i}
                        p1={vec(q2.x - w, q2.y || 0)}
                        p2={vec(q2.x + w, q2.y || 0)}
                        color="black"
                        strokeWidth={1}
                      />
                      <SkLine
                        key={"q4 line" + i}
                        p1={vec(q4.x - w, q4.y || 0)}
                        p2={vec(q4.x + w, q4.y || 0)}
                        color="black"
                        strokeWidth={1}
                      />
                      <SkLine
                        key={"bottom line" + i}
                        p1={vec(q0.x, q0.y || 0)}
                        p2={vec(q1.x, q1.y || 0)}
                        color="black"
                        strokeWidth={1}
                      />
                      <SkLine
                        key={"top line" + i}
                        p1={vec(q3.x, q3.y || 0)}
                        p2={vec(q4.x, q4.y || 0)}
                        color="black"
                        strokeWidth={1}
                      />
                      <Points
                        key={"rect" + i}
                        points={rectPoints}
                        color="black"
                        strokeWidth={1}
                        mode="polygon"
                      />
                      </Fragment>
                    );
                  }
                  return elements;
                })()}
              </>
            );
          }}
        </CartesianChart>
      </View>
    </View>
  );
};

export default GoalGraph; 