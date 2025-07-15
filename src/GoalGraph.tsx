import React, { Fragment, useState } from "react";
import { View, Text, Platform, TouchableOpacity } from "react-native";
import { useTheme } from 'react-native-paper';
import { getTransformComponents, setScale, setTranslate, useChartTransformState } from "victory-native";
import { CartesianChart } from "victory-native";
import {matchFont, Path, Points, Rect, Skia, Line as SkLine, vec} from "@shopify/react-native-skia";
import useStore, { GoalType, State } from "./Store";
import { useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";
import { binTime, binTimeSeries, BinSize } from "./GoalUtil";

const fontFamily = Platform.select({default: "sans-serif" });
const font = matchFont({fontFamily: fontFamily, fontSize: 10});

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

const toggleButton = (label: string, isActive: boolean, onPress: () => void, theme: any) => {
  return (
    <TouchableOpacity 
      key={label}
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
  const transformState = useChartTransformState({
    scaleX: 1.0, // Initial X-axis scale
    scaleY: 1.0, // Initial Y-axis scale
  }).state;
  const subUnitNames = typeof goal.unit === 'string' ? null : goal.unit.map((u: any) => u.name);
  const [subUnitName, setSubUnitName] = useState(subUnitNames?.[0] || null);
  const extractValue = (v: any) => subUnitName ? v.value[subUnitName] : v.value;

  const now = new Date();

  const barWidth = 5;
  
  const bins = binTimeSeries(binning, goal.dataPoints);
  const binQuartiles : {t: number, q0: number, q1: number, q2: number, q3: number, q4: number}[] = bins.map((bin) => {
    const values = bin.values.map(extractValue).filter((v: number) => v !== null);
    if (values.length === 0) {
      return null
    } else {
      return {
        ...quartiles(values),
        t: bin.time
      };
    }
  }).filter((b) => b !== null);

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
        <Text style={{ marginRight: 10, color: theme.colors.onSurface }}>Binning:</Text>
        {toggleButton("D", binning === 'day', () => setBinning('day'), theme)}
        {toggleButton("W", binning === 'week', () => setBinning('week'), theme)}
        {toggleButton("M", binning === 'month', () => setBinning('month'), theme)}
        {toggleButton("Q", binning === 'quarter', () => setBinning('quarter'), theme)}
        {toggleButton("Y", binning === 'year', () => setBinning('year'), theme)}
      </View>
      { subUnitNames && (
        <View key="subUnitNames" style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ marginRight: 10, color: theme.colors.onSurface }}>Value:</Text>
          {subUnitNames?.map((name: string) => 
            toggleButton(name, subUnitName === name, () => setSubUnitName(name), theme))}
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
          domain={{x: [now.getTime() - binSizeWindow(binning), binTime(binning, now.getTime(), 1)]}}
          domainPadding={{top: 10, bottom: 10, left: barWidth, right: barWidth * 2}}
          xKey="t" 
          yKeys={["q0", "q1", "q2", "q3", "q4"]}
          frame={{
            lineWidth: 1,
            lineColor: theme.colors.onSurfaceVariant,
          }}
          xAxis={{
            // tickValues: binQuartiles.map((q) => q.t),
            font: font,
            enableRescaling: true,
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
            tickCount: 10,
          }}
          yAxis={[
            {
              yKeys: ["q0", "q1", "q2", "q3", "q4"],
              font: font,
              tickCount: 10,
              lineColor: theme.colors.onSurfaceVariant,
              labelColor: theme.colors.onSurfaceVariant,
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
                    const q4 = points.q4[i];
                    const [q0x, q0y] = [q0.x, q0.y ?? NaN];
                    const [q4x, q4y] = [q4.x, q4.y ?? NaN];
                    const w = barWidth;
                    if (q0.y == q4.y) {
                      const path = Skia.Path.Make();
                      path.moveTo(q0x - w, q0y);
                      path.lineTo(q0x, q0y - w);
                      path.lineTo(q4x + w, q4y);
                      path.lineTo(q4x, q4y + w);
                      path.close();
                      elements.push(
                        <Fragment key={"" + i}>
                          <Path
                            path={path}
                            color={theme.colors.primaryContainer}
                          />
                          <Path
                            style="stroke"
                            path={path}
                            color={theme.colors.onSurface}
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
                      stroke.moveTo(q4x - w, q4y);
                      stroke.lineTo(q4x + w, q4y);
                      stroke.moveTo(q4x, q4y);
                      stroke.lineTo(q3x, q3y);
                      stroke.moveTo(q3x - w, q3y);
                      stroke.lineTo(q3x + w, q3y);
                      stroke.lineTo(q1x + w, q1y);
                      stroke.lineTo(q1x - w, q1y);
                      stroke.lineTo(q3x - w, q3y);
                      stroke.moveTo(q2x - w, q2y);
                      stroke.lineTo(q2x + w, q2y);
                      stroke.moveTo(q1x, q1y);
                      stroke.lineTo(q0x, q0y);
                      stroke.moveTo(q0x - w, q0y);
                      stroke.lineTo(q0x + w, q0y);

                      elements.push(
                        <Fragment key={"" + i}>
                          <Path
                            style="fill"
                            path={fill}
                            color={theme.colors.primaryContainer}
                          />
                          <Path
                            style="stroke"
                            path={stroke}
                            color={theme.colors.onSurface}
                            strokeWidth={1}
                          />
                        </Fragment>
                      );
                    }
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