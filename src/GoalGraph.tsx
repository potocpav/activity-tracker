import React from "react";
import { View, Text, Platform } from "react-native";
import { Line } from "victory-native";
import { CartesianChart } from "victory-native";
import {matchFont} from "@shopify/react-native-skia";
import { GoalType, State } from "./Store";
import { useStore } from "zustand";

const fontFamily = Platform.select({default: "sans-serif" });
const font = matchFont({fontFamily: fontFamily});

// const binTimeSeries = (dataPoints: {t: number, w: number}[], binSize: number) => {
//   const bins = {};
//   dataPoints.forEach((dp) => {
//     const binIndex = Math.floor(dp.t / binSize);
//     bins[binIndex] = (bins[binIndex] || 0) + dp.w;
//   });
//   return bins;
// };

const GoalGraph = ({ route }: { route: any }) => {
  const { goal } = route.params;
  const dataPoints : {t: number, w: number}[] = goal.dataPoints.map((dp: any) => ({
    t: dp.time,
    w: dp.value,
  }));
  
  // const goals = useStore((state: any) => state.goals);
  // const goal = goals?.find((g: GoalType) => g.id === goalId);
  
  return (
    <View style={{ width: '100%', flex: 1, padding: 10 }}>
      {/* <Text>Goal Graph Placeholder</Text> */}

      <CartesianChart 
        data={dataPoints} 
        xKey="t" 
        yKeys={["w"]}
        frame={{
          lineWidth: 1,
        }}
        xAxis={{
          font: font,
        }}
        yAxis={[
          {
            yKeys: ["w"],
            font: font,
            tickCount: 10,
          },
          // {
          //   yKeys: ["w"],
          //   tickValues: [0, Math.round(maxWeight * 10) / 10],
          //   axisSide: "right",
          //   font: font,
          //   tickCount: 10,
          // }
        ]}
        >              
        {({ points }) => (
          //👇 pass a PointsArray to the Line component, as well as options.
          <>
          <Line
            points={points.w}
            color="black"
            strokeWidth={2}
          />
        </>
        )}
      </CartesianChart>
    </View>
  );
};

export default GoalGraph; 