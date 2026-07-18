import React, { Fragment, useRef, useState } from "react";
import { View, Text, Platform, useWindowDimensions, FlatList, LayoutChangeEvent, LayoutRectangle } from "react-native";
import { Canvas, matchFont, RoundedRect, Text as SkiaText, vec, Line } from "@shopify/react-native-skia";
import { SubUnit } from "../../Model/StoreTypes";
import { renderShortFormValue } from "../../Model/Unit";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { BoundingBox, cmpMajorTicks, boundingBoxToRange } from "./Common";

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

export const barBoundingBox = (value: number | null, fontScale: number): BoundingBox => {
  if (value === null) {
    return null;
  } else {
    return {
      min: Math.min(0, value),
      max: Math.max(0, value),
      padMin: value < 0 ? 15 * fontScale : 0,
      padMax: value > 0 ? 15 * fontScale : 0,
    };
  }
}

export type ViewDimensions = {
  width: number,
  height: number,
  yToPx: (y: number) => number,
}


type FlatListChartData = {
  height: number,
  unit: SubUnit,
  gridLineColor: string,
  items: { time: number, values: number[], nDays: number, dayIndex?: number }[], // todo: swap for any[]
  renderItem: (params: { item: any, index: number, view: ViewDimensions }) => React.ReactNode,
  itemBoundingBox: (item: any, itemWidthPx: number) => BoundingBox,
  itemLabel: (item: any) => string,
  setSelectedRange?: (range: { min: number, max: number } | null) => void,
}

const FlatListChart = (
  {
    height,
    unit,
    gridLineColor,
    items,
    renderItem,
    itemBoundingBox,
    itemLabel,
    setSelectedRange,
  }:
    FlatListChartData
) => {
  const [hasMeasuredLayoutSize, setHasMeasuredLayoutSize] = useState(false);
  const [size, setSize] = useState<LayoutRectangle | null>(null);
  const rootRef = useRef<View>(null);
  const windowDimensions = useWindowDimensions();
  const font = matchFont({ fontFamily: fontFamily, fontSize: 10 * windowDimensions.fontScale });
  const width = size?.width ?? 0;

  const topViewportPadding = 5;
  const xAxisHeight = 30 * windowDimensions.fontScale;
  const viewportHeight = height - xAxisHeight - topViewportPadding;
  const targetBinWidth = 20 * windowDimensions.fontScale;

  const boundingBox = mergeBoundingBoxes(items.map((item) => itemBoundingBox(item, targetBinWidth)));
  const yRange = boundingBoxToRange(viewportHeight, boundingBox);
  const majorTicks = cmpMajorTicks(unit, yRange, 10);
  const majorTickLabels = majorTicks.map((tick) => renderShortFormValue(tick, unit));
  const maxTickLabelWidth = Math.max(...majorTickLabels.map((label) => font.measureText(label).width));

  const yLabelPadding = 5;
  const yAxisWidth = maxTickLabelWidth + yLabelPadding;
  const viewportWidth = (size?.width ?? 0) - yAxisWidth;
  // make viewportWidth a multiple of binWidth
  const binWidth = viewportWidth / Math.round(viewportWidth / targetBinWidth);

  const yToPx = (y: number) => {
    return viewportHeight - (y - yRange.min) * viewportHeight / (yRange.max - yRange.min);
  }
  const itemViewDimensions = { width: binWidth, height: viewportHeight, yToPx: yToPx };

  const onLayout = React.useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setHasMeasuredLayoutSize(true);
      setSize(layout);
    },
    [],
  );

  const scrollX = useSharedValue(0);
  const selectedRangeShared = useSharedValue<{ p0: number, p1: number } | null>(null);
  const getIndex = (num: number) => {
    "worklet"
    return Math.min(items.length - 1, Math.max(0, Math.floor((viewportWidth - num + scrollX.value) / binWidth)));
  };
  const panGesture = Gesture
    .Pan()
    .activateAfterLongPress(300)
    .onStart((event) => {
      selectedRangeShared.set({ p0: getIndex(event.x), p1: getIndex(event.x) });
    })
    .onUpdate((event) => {
      selectedRangeShared.set({ p0: selectedRangeShared.value?.p0 ?? getIndex(event.x), p1: getIndex(event.x) });
    })
  const tapGesture = Gesture
    .Tap()
    .onEnd((event) => {
      const tapIndex = getIndex(event.x);
      if ((selectedRangeShared.value?.p0 !== selectedRangeShared.value?.p1) || selectedRangeShared.value?.p1 === tapIndex) {
        selectedRangeShared.set(null);
      } else {
        selectedRangeShared.set({ p0: tapIndex, p1: tapIndex });
      }
    });
  const gesture = Gesture.Race(panGesture, tapGesture);

  useAnimatedReaction(
    () => {
      return selectedRangeShared.value;
    },
    (currentValue, previousValue) => {
      if (setSelectedRange) {
        if (currentValue?.p0 !== previousValue?.p0 || currentValue?.p1 !== previousValue?.p1) {
          if (!currentValue || items.length === 0) {
            scheduleOnRN(setSelectedRange, null);
          } else {
            scheduleOnRN(setSelectedRange, {
              min: Math.min(currentValue.p0, currentValue.p1),
              max: Math.max(currentValue.p0, currentValue.p1)
            });
          }
        }
      }
    }
  );

  return (
    <View key="root" ref={rootRef} style={{ height, flex: 1, position: 'relative', overflow: 'hidden' }} onLayout={onLayout}>
      {hasMeasuredLayoutSize && <>
        <Canvas key="grid" style={{
          position: 'absolute',
          width: size?.width,
          height: size?.height,
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
        <GestureDetector gesture={gesture}>
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
              onScroll={(event) => {
                scrollX.set(event.nativeEvent.contentOffset.x);
              }}
              renderItem={({ item, index }) => {
                const drawnElement = renderItem({ item, index, view: itemViewDimensions });
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
                  <View style={{ top: topViewportPadding, width: binWidth, height: viewportHeight }}>
                    {drawnElement}
                    {xLabelElement}
                  </View>
                );
              }}
              keyExtractor={(item) => `${item.time.toString()}-${item.dayIndex?.toString() ?? ""}`}
              inverted={true}
              horizontal={true}
            />
          </View>
        </GestureDetector>
      </>}
    </View>
  );
}

export const BarChart = ({
  view,
  value,
  unit,
  color,
  fontScale,
}: {
  view: ViewDimensions,
  value: number | null,
  unit: any,
  color: string,
  fontScale: number,
}) => {
  let barWidth = view.width * 0.6;
  let belowZero = value !== null && value < 0;
  let labelOffset = belowZero ? 0 : 13 * fontScale;

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
  const q1px = Math.max(view.yToPx(q1), q2px + w);
  const q3px = Math.min(view.yToPx(q3), q2px - w);
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