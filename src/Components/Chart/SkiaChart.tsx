import React, { Fragment, useRef, useState } from "react";
import { View, Text, Platform, useWindowDimensions, FlatList, LayoutChangeEvent, LayoutRectangle } from "react-native";
import { Canvas, matchFont, Text as SkiaText, vec, Line, Skia, Path, rect, Group } from "@shopify/react-native-skia";
import { SubUnit } from "../../Model/StoreTypes";
import { renderShortFormValue } from "../../Model/Unit";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useAnimatedReaction, useSharedValue, runOnJS, SharedValue, useDerivedValue, makeMutable } from "react-native-reanimated";
import { BoundingBox, cmpMajorTicks, boundingBoxToRange } from "./Common";

const fontFamily = Platform.select({ default: "sans-serif" });

export type Rect = {
  x: { min: number, max: number },
  y: { min: number, max: number },
}

type Viewport = {
  left: number,
  right: number,
  top: number,
  bottom: number,
}

type SkiaChartData = {
  gridLineColor: string,
  view: SharedValue<Rect>,
  domain: Rect,
  children?: React.ReactNode,
}

export const xToViewport = (view: Rect, x: number) => {
  'worklet'
  return (x - view.x.min) * (view.x.max - view.x.min) / (view.x.max - view.x.min);
}

export const yToViewport = (view: Rect, y: number) => {
  'worklet'
  return (y - view.y.min) * (view.y.max - view.y.min) / (view.y.max - view.y.min);
}

const xToCanvas = (view: Rect, viewport: Viewport, x: number) => {
  "worklet"
  return (x - view.x.min) * (viewport.right - viewport.left) / (view.x.max - view.x.min) + viewport.left;
}

const yToCanvas = (view: Rect, viewport: Viewport, y: number) => {
  "worklet"
  return viewport.bottom - (y - view.y.min) * (viewport.bottom - viewport.top) / (view.y.max - view.y.min);
}

const SkiaChart = (
  {
    gridLineColor,
    view,
    domain,
    children,
  }:
    SkiaChartData
) => {
  const [hasMeasuredLayoutSize, setHasMeasuredLayoutSize] = useState(false);
  const [size, setSize] = useState<LayoutRectangle | null>(null);
  const rootRef = useRef<View>(null);
  const windowDimensions = useWindowDimensions();
  const font = matchFont({ fontFamily: fontFamily, fontSize: 10 * windowDimensions.fontScale });

  const xLabelPadding = 4;
  const yLabelPadding = 5;
  const xNumTicks = 10;
  const yNumTicks = 10;

  const unitX: SubUnit = { type: "time", unit: "seconds" };
  const xTicks = cmpMajorTicks(unitX, domain.x, xNumTicks);
  const xTickLabels = xTicks.map((tick) => renderShortFormValue(tick, unitX));
  const xTickLabelBoxes = xTickLabels.map((label) => font.measureText(label));

  const viewport: Viewport = (() => {
    const topViewportPadding = 5;
    const xAxisHeight = font.measureText("0:0").height + xLabelPadding;
    const viewportHeight = (size?.height ?? 0) - xAxisHeight - topViewportPadding;

    const maxTickLabelWidth = font.measureText("000.0").width;
    const yAxisWidth = maxTickLabelWidth + yLabelPadding;
    const viewportWidth = (size?.width ?? 0) - yAxisWidth;

    return {
      left: yAxisWidth,
      right: yAxisWidth + viewportWidth,
      top: topViewportPadding,
      bottom: topViewportPadding + viewportHeight,
    }
  })();

  const viewportClip = rect(viewport.left, viewport.top, viewport.right - viewport.left, viewport.bottom - viewport.top);

  // const xTickLine = [...Array(xNumTicks * 2).keys()].map((i) => ({
  //   p1: useDerivedValue(() =>
  //     vec(xToCanvas(view.value, viewport, xTicks[i]), viewport.top)),
  //   p2: useDerivedValue(() =>
  //     vec(xToCanvas(view.value, viewport, xTicks[i]), viewport.bottom)),
  //   labelX: useDerivedValue(() =>
  //     xToCanvas(view.value, viewport, xTicks[i]) - xTickLabelBoxes[i]?.width / 2),
  //   labelY: useDerivedValue(() =>
  //     viewport.bottom + xLabelPadding - xTickLabelBoxes[i]?.y),
  //   label: xTickLabels[i]
  // }));

  const xTickLine = xTicks.map((tick, i) => ({
    p1: makeMutable(vec(NaN, NaN)),
    p2: makeMutable(vec(NaN, NaN)),
    labelX: makeMutable(NaN),
    labelY: makeMutable(NaN),
    label: xTickLabels[i]
  }));

  const unitY: SubUnit = { type: "weight", unit: "kg" };
  const yTicks = cmpMajorTicks(unitY, domain.y, 10);
  const yTickLabels = yTicks.map((tick) => renderShortFormValue(tick, unitY));
  const yTickLabelBoxes = yTickLabels.map((label) => font.measureText(label));

  const yTickLine = [...Array(yNumTicks * 2).keys()].map((i) => ({
    p1: useDerivedValue(() =>
      vec(viewport.left, yToCanvas(view.value, viewport, yTicks[i]))),
    p2: useDerivedValue(() =>
      vec(viewport.right, yToCanvas(view.value, viewport, yTicks[i]))),
    labelX: useDerivedValue(() =>
      viewport.left - yTickLabelBoxes[i]?.width - yLabelPadding),
    labelY: useDerivedValue(() =>
      yToCanvas(view.value, viewport, yTicks[i]) + yTickLabelBoxes[i]?.height * 0.4)
  }));

  const onLayout = React.useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      setHasMeasuredLayoutSize(true);
      setSize(layout);
    },
    [],
  );

  const framePath = Skia.Path.Make();
  const w = 1;
  framePath.moveTo(viewport.left + w / 2, viewport.top + w / 2);
  framePath.lineTo(viewport.right - w / 2, viewport.top + w / 2);
  framePath.lineTo(viewport.right - w / 2, viewport.bottom - w / 2);
  framePath.lineTo(viewport.left + w / 2, viewport.bottom - w / 2);
  framePath.close();

  useAnimatedReaction(
    () => {
      return view.value;
    },
    (view, _) => {
      for (let i = 0; i < xTickLine.length; i++) {
        xTickLine[i].p1.value = vec(xToCanvas(view, viewport, xTicks[i]), viewport.top);
        xTickLine[i].p2.value = vec(xToCanvas(view, viewport, xTicks[i]), viewport.bottom);
        xTickLine[i].labelX.value = xToCanvas(view, viewport, xTicks[i]) - xTickLabelBoxes[i]?.width / 2;
        xTickLine[i].labelY.value = viewport.bottom + xLabelPadding - xTickLabelBoxes[i]?.y;
      }
    },
  );

  return (
    <View key="root" ref={rootRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }} onLayout={onLayout}>
      {hasMeasuredLayoutSize && <>
        <Canvas key="grid" style={{
          position: 'absolute',
          width: size?.width,
          height: size?.height,
        }}>
          <Path key="frame" style="stroke" strokeJoin="round" strokeWidth={w} path={framePath} color={gridLineColor} />
          {xTickLine.slice(0, 5).map((tick, index) => {

            return (
              <Fragment key={`x-${tick.label}`}>
                <Group key={`x-${tick.label}-group`} clip={viewportClip}>
                  <Line
                    clip={viewportClip}
                    p1={tick.p1}
                    p2={tick.p2}
                    color={gridLineColor}
                    strokeWidth={0}
                    opacity={0.5}
                  />
                </Group>
                <SkiaText
                  key={`x-${tick.label}-text`}
                  x={tick.labelX}
                  y={tick.labelY}
                  color={gridLineColor}
                  font={font}
                  text={tick.label}
                />
              </Fragment>
            )
          })}
          {yTicks.map((tick, index) => {
            return (
              <Fragment key={`y-${yTickLabels[index]}`}>
                <Group clip={viewportClip}>
                  <Line
                    clip={viewportClip}
                    p1={yTickLine[index].p1}
                    p2={yTickLine[index].p2}
                    color={gridLineColor}
                    strokeWidth={0}
                    opacity={0.5}
                  />
                </Group>
                <SkiaText
                  x={yTickLine[index].labelX}
                  y={yTickLine[index].labelY}
                  color={gridLineColor}
                  font={font}
                  text={yTickLabels[index]}
                />
              </Fragment>
            )
          })}
          {children}
        </Canvas>
        <View style={{
          position: 'absolute',
          left: viewport.left,
          top: viewport.top,
          width: viewport.right - viewport.left,
          height: viewport.bottom - viewport.top,
        }}>
          
        </View>
      </>}
    </View>
  );
}


export default SkiaChart;