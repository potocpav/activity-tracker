import type { DataPoint, ISODate, TagName, Unit } from "./StoreTypes";

/**
 * Unsaved input of the Edit Data Point screen. Kept so that the input survives the
 * screen going away without the user leaving it: the app being killed, or a locked
 * activity locking up when the app is backgrounded.
 *
 * Pure (no React Native imports), so it can be tested under plain node.
 */

/** What the Edit Data Point screen is opened on. */
export type InputData =
  | {
      type: "new";
      dataPoint: Partial<DataPoint>;
    }
  | {
      type: "edit";
      dataPoints: DataPoint[];
    };

/** The input fields of the screen. Values are keyed by sub-unit name, "" for a single unit. */
export type DraftInput = {
  day: ISODate | null;
  note: string;
  tags: TagName[];
  values: Record<string, string>;
};

export type EditDraft = DraftInput & {
  /** Which screen the draft belongs to, see `draftKey` */
  key: string;
  /** The activity's unit when the draft was taken; values are only restored while it holds */
  unit: Unit;
};

/**
 * Identifies the edit target: a new data point of an activity, or a particular set of its
 * data points. Uses the activity uuid rather than its (index-based) path, so reordering
 * activities does not break the match.
 */
export const draftKey = (activityUuid: string, inputData: InputData): string =>
  inputData.type === "new"
    ? `${activityUuid}:new`
    : `${activityUuid}:edit:${inputData.dataPoints
        .map((dp) => dp.uuid)
        .sort()
        .join(",")}`;

const sameSet = (a: string[], b: string[]): boolean => {
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.length === sb.length && sa.every((x, i) => x === sb[i]);
};

/** Whether two inputs hold the same data. Tag order does not matter. */
export const sameInput = (a: DraftInput, b: DraftInput): boolean => {
  const valueKeys = new Set([...Object.keys(a.values), ...Object.keys(b.values)]);
  return (
    a.day === b.day &&
    a.note === b.note &&
    sameSet(a.tags, b.tags) &&
    [...valueKeys].every((k) => (a.values[k] ?? "") === (b.values[k] ?? ""))
  );
};
