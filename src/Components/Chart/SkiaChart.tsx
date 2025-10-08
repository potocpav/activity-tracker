import React, { Fragment, useRef, useState, useEffect } from "react";
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

export type Viewport = {
  left: number,
  right: number,
  top: number,
  bottom: number,
}

export const xToCanvas = (view: Rect, viewport: Viewport, x: number) => {
  "worklet"
  return (x - view.x.min) * (viewport.right - viewport.left) / (view.x.max - view.x.min) + viewport.left;
}

export const yToCanvas = (view: Rect, viewport: Viewport, y: number) => {
  "worklet"
  return viewport.bottom - (y - view.y.min) * (viewport.bottom - viewport.top) / (view.y.max - view.y.min);
}


type SkiaChartData = {
  gridLineColor: string,
  view: SharedValue<Rect>,
  viewportShared: SharedValue<Viewport>,
  children?: React.ReactNode,
}

const SkiaChart = (
  {
    gridLineColor,
    view,
    viewportShared,
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

  useEffect(() => {
    viewportShared.value = viewport;
  }, [viewport]);

  const viewportClip = rect(viewport.left, viewport.top, viewport.right - viewport.left, viewport.bottom - viewport.top);

  const xTickLine = [...Array(xNumTicks * 2).keys()].map((i) => ({
    x: useSharedValue(NaN),
    p1: useSharedValue(vec(NaN, NaN)),
    p2: useSharedValue(vec(NaN, NaN)),
    labelX: useSharedValue(NaN),
    labelY: useSharedValue(NaN),
    label: useSharedValue("")
  }));

  const yTickLine = [...Array(yNumTicks * 2).keys()].map((i) => ({
    y: useSharedValue(NaN),
    p1: useSharedValue(vec(NaN, NaN)),
    p2: useSharedValue(vec(NaN, NaN)),
    labelX: useSharedValue(NaN),
    labelY: useSharedValue(NaN),
    label: useSharedValue("")
  }));

  useAnimatedReaction(
    () => {
      return {
        view: view.value,
      };
    },
    (value, oldValue) => {
      if (Math.floor(value.view.x.max) !== Math.floor((oldValue?.view.x.max ?? 0))) {
        const unitX: SubUnit = { type: "time", unit: "seconds" };
        const xTicks = cmpMajorTicks(unitX, value.view.x, xNumTicks);
        const xTickLabels = xTicks.map((tick) => renderShortFormValue(tick, unitX));
        const xTickLabelBoxes = xTickLabels.map((label) => font.measureText(label));

        xTickLine.forEach((state, index) => {
          state.x.value = xTicks[index];
          state.p1.value = vec(xToCanvas(value.view, viewport, xTicks[index]), viewport.top);
          state.p2.value = vec(xToCanvas(value.view, viewport, xTicks[index]), viewport.bottom);
          state.labelX.value = xToCanvas(value.view, viewport, xTicks[index]) - xTickLabelBoxes[index]?.width / 2;
          state.labelY.value = viewport.bottom + xLabelPadding - xTickLabelBoxes[index]?.y;
          state.label.value = xTickLabels[index] ?? "";
        });
      }
    }
  );

  useAnimatedReaction(
    () => {
      return {
        view: view.value,
      };
    },
    (value, oldValue) => {
      if (Math.floor(value.view.y.max) !== Math.floor(oldValue?.view.y.max ?? 0)) {
        const unitY: SubUnit = { type: "weight", unit: "kg" };
        const yTicks = cmpMajorTicks(unitY, { min: value.view.y.min, max: value.view.y.max + 2 }, yNumTicks);
        const yTickLabels = yTicks.map((tick) => renderShortFormValue(tick, unitY));
        const yTickLabelBoxes = yTickLabels.map((label) => font.measureText(label));

        yTickLine.forEach((state, index) => {
          state.y.value = yTicks[index];
          state.p1.value = vec(viewport.left, yToCanvas(value.view, viewport, yTicks[index]));
          state.p2.value = vec(viewport.right, yToCanvas(value.view, viewport, yTicks[index]));
          state.labelX.value = viewport.left - yTickLabelBoxes[index]?.width - yLabelPadding;
          state.labelY.value = yToCanvas(value.view, viewport, yTicks[index]) + yTickLabelBoxes[index]?.height * 0.4;
          state.label.value = yTickLabels[index] ?? "";
        });
      }
    },
  );

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
        xTickLine[i].p1.value = vec(xToCanvas(view, viewport, xTickLine[i].x.value), viewport.top);
        xTickLine[i].p2.value = vec(xToCanvas(view, viewport, xTickLine[i].x.value), viewport.bottom);
        xTickLine[i].labelX.value = xToCanvas(view, viewport, xTickLine[i].x.value) - 5;
        xTickLine[i].labelY.value = viewport.bottom + xLabelPadding + 7;
      }

      for (let i = 0; i < yTickLine.length; i++) {
        yTickLine[i].p1.value = vec(viewport.left, yToCanvas(view, viewport, yTickLine[i].y.value));
        yTickLine[i].p2.value = vec(viewport.right, yToCanvas(view, viewport, yTickLine[i].y.value));
        yTickLine[i].labelX.value = viewport.left - 15 - yLabelPadding;
        yTickLine[i].labelY.value = yToCanvas(view, viewport, yTickLine[i].y.value) + 3;
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

          <Group clip={viewportClip}>
            {xTickLine.map((tick, index) =>
            (
              <Line
                key={`x-${index}`}
                clip={viewportClip}
                p1={tick.p1}
                p2={tick.p2}
                color={gridLineColor}
                strokeWidth={0}
                opacity={0.5}
              />
            )
            )}
            {yTickLine.map((tick, index) =>
            (
              <Line
                key={`y-${index}`}
                clip={viewportClip}
                p1={tick.p1}
                p2={tick.p2}
                color={gridLineColor}
                strokeWidth={0}
                opacity={0.5}
              />
            )
            )}
          </Group>
          <Fragment>
            {xTickLine.map((tick, index) =>
            (
              <SkiaText
                key={`x-${index}-text`}
                x={tick.labelX}
                y={tick.labelY}
                color={gridLineColor}
                font={font}
                text={tick.label}
              />
            )
            )}
            {yTickLine.map((tick, index) =>
            (
              <SkiaText
                key={`y-${index}-text`}
                x={tick.labelX}
                y={tick.labelY}
                color={gridLineColor}
                font={font}
                text={tick.label}
              />
            )
            )}
          </Fragment>
          <Group clip={viewportClip}>
            {children}
          </Group>
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