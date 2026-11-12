import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { draftKey, sameInput, type DraftInput } from "./EditDraft.ts";

const dp = (uuid: string) => ({ uuid, date: "2026-01-01" });

describe("draftKey", () => {
  test("does not depend on the order of the edited data points", () => {
    assert.equal(
      draftKey("a", { type: "edit", dataPoints: [dp("1"), dp("2")] }),
      draftKey("a", { type: "edit", dataPoints: [dp("2"), dp("1")] }),
    );
  });

  test("tells targets apart", () => {
    const keys = [
      draftKey("a", { type: "new", dataPoint: { date: "2026-01-01" } }),
      draftKey("b", { type: "new", dataPoint: { date: "2026-01-01" } }),
      draftKey("a", { type: "edit", dataPoints: [dp("1")] }),
      draftKey("a", { type: "edit", dataPoints: [dp("1"), dp("2")] }),
      draftKey("b", { type: "edit", dataPoints: [dp("1")] }),
    ];
    assert.equal(new Set(keys).size, keys.length);
  });

  test("a new data point matches whatever it was prefilled with", () => {
    assert.equal(
      draftKey("a", { type: "new", dataPoint: { date: "2026-01-01" } }),
      draftKey("a", { type: "new", dataPoint: { date: "2026-02-02", tags: ["x"] } }),
    );
  });
});

describe("sameInput", () => {
  const base: DraftInput = { day: "2026-01-01", note: "hi", tags: ["a", "b"], values: { "": "1" } };

  test("equal inputs", () => {
    assert.ok(sameInput(base, { ...base }));
  });

  test("ignores tag order", () => {
    assert.ok(sameInput(base, { ...base, tags: ["b", "a"] }));
  });

  test("a missing value equals an empty one", () => {
    assert.ok(sameInput({ ...base, values: { x: "" } }, { ...base, values: {} }));
  });

  test("notices every field", () => {
    assert.ok(!sameInput(base, { ...base, day: null }));
    assert.ok(!sameInput(base, { ...base, note: "hi!" }));
    assert.ok(!sameInput(base, { ...base, tags: ["a"] }));
    assert.ok(!sameInput(base, { ...base, values: { "": "2" } }));
  });
});
