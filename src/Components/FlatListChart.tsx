import React, { Fragment, useRef } from "react";
import { View, Text, Platform, useWindowDimensions, FlatList } from "react-native";
import { Canvas, matchFont, RoundedRect, Text as SkiaText, vec, Line } from "@shopify/react-native-skia";
import { SubUnit, BinSize } from "../Model/StoreTypes";
import { renderShortFormValue } from "../Model/Unit";

const fontFamily = Platform.select({ default: "sans-serif" });

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

export type BoundingBox = {
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

export const barBoundingBox = (value: number | null): BoundingBox => {
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
  const numberStride = () => {
    const idealStride = (range.max - range.min) / approxNTicks;
    const logBase = Math.pow(10, 1/3); 
    const logStride = Math.round(Math.log(idealStride) / Math.log(logBase));
    let fractionalStride = 0;
    switch ((Math.round(logStride) % 3 + 3) % 3) {
      case 0:
        fractionalStride = 1;
        break;
      case 1:
        fractionalStride = 2;
        break;
      case 2:
        fractionalStride = 5;
        break;
    }
    const stride = Math.pow(10, Math.floor(logStride / 3)) * fractionalStride;
    return stride;
  }

  const stridedTicks = (stride: number) => {
    let ticks = [];
    for (let i = Math.ceil(range.min / stride); i <= Math.floor(range.max / stride); i++) {
      ticks.push(i * stride);
    }
    return ticks;
  }

  let stride = Infinity;

  switch (unit.type) {
    case "count":
      stride = numberStride();
      break;
    case "number":
    case "distance":
    case "weight":
      stride = numberStride();
      break;
    
    case "time":
      stride = numberStride();
      break;
    case "climbing_grade":
      break;  
  }
  return stridedTicks(stride);
}

export type ViewDimensions = {
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
  itemBoundingBox: (item: any, itemWidthPx: number) => BoundingBox,
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
  let binWidth = 20 * windowDimensions.fontScale;

  const boundingBox = mergeBoundingBoxes(items.map((item) => itemBoundingBox(item, binWidth)));
  let yRange = boundingBoxToYRange(viewportHeight, boundingBox);
  let majorTicks = cmpMajorTicks(unit, yRange, 10);
  const majorTickLabels = majorTicks.map((tick) => renderShortFormValue(tick, unit));
  const maxTickLabelWidth = Math.max(...majorTickLabels.map((label) => font.measureText(label).width));

  let yLabelPadding = 5;
  let yAxisWidth = maxTickLabelWidth + yLabelPadding;
  let viewportWidth = width - yAxisWidth;

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
              <View key={item.time.toString()} style={{ top: topViewportPadding, width: binWidth, height: viewportHeight }}>
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

export const BarChart = ({
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

export const BoxChart = ({
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

export default FlatListChart; 