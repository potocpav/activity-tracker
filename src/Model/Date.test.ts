import { test, describe } from "node:test";
import assert from "node:assert/strict";

import * as D from "./Date.ts";

/** A definite day, written the way it reads. Throws rather than returning null, so a typo in a test fails loudly. */
const d = (iso: string): D.Day => {
  const value = D.fromISODate(iso);
  assert.notEqual(value, null, `not a valid date: ${iso}`);
  return value!;
};

const span = (period: D.Period): [string | null, string | null] => [
  D.toISODate(D.firstDay(period)),
  D.toISODate(D.lastDay(period)),
];

describe("days", () => {
  test("constructs from calendar fields", () => {
    assert.equal(D.toISODate(D.day(2026, 1, 1)), "2026-01-01");
    assert.equal(D.toISODate(D.day(2026, 9, 12)), "2026-09-12");
  });

  test("out-of-range month and day fields normalise", () => {
    assert.equal(D.toISODate(D.day(2026, 13, 1)), "2027-01-01");
    assert.equal(D.toISODate(D.day(2026, 1, 32)), "2026-02-01");
    assert.equal(D.toISODate(D.day(2026, 3, 0)), "2026-02-28");
  });

  test("shifts across month, year and leap-day boundaries", () => {
    assert.equal(D.toISODate(D.add(1, d("2026-02-28"))), "2026-03-01");
    assert.equal(D.toISODate(D.add(1, d("2024-02-28"))), "2024-02-29");
    assert.equal(D.toISODate(D.add(1, d("2026-12-31"))), "2027-01-01");
    assert.equal(D.toISODate(D.sub(1, d("2026-01-01"))), "2025-12-31");
    assert.equal(D.toISODate(D.add(365, d("2026-01-01"))), "2027-01-01");
    assert.equal(D.toISODate(D.add(365, d("2024-01-01"))), "2024-12-31"); // leap year
  });

  test("is its own first and last day", () => {
    assert.deepEqual(span(d("2026-05-17")), ["2026-05-17", "2026-05-17"]);
  });

  test("knows its weekday", () => {
    assert.equal(D.weekday(d("1970-01-01")), "thursday");
    assert.equal(D.weekday(d("2026-09-12")), "saturday");
    assert.equal(D.weekday(D.farFuture), null);
  });

  test("rejects text that is not a date", () => {
    assert.equal(D.fromISODate("2026-02-31"), null); // does not exist
    assert.equal(D.fromISODate("2026-13-01"), null);
    assert.equal(D.fromISODate("2026-1-1"), null); // unpadded
    assert.equal(D.fromISODate("not a date"), null);
    assert.equal(D.fromISODate("2024-02-29")?.value, d("2024-02-29").value); // does exist
  });

  test("converts to and from a local Date", () => {
    const date = D.toDate(d("2026-09-12"))!;
    assert.deepEqual(
      [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours()],
      [2026, 9, 12, 0],
      "local midnight",
    );
    assert.equal(D.compare(D.fromDate(date), d("2026-09-12")), 0);
  });
});

describe("weeks", () => {
  test("start on the requested weekday", () => {
    // 2026-09-12 is a Saturday.
    assert.deepEqual(span(D.week("monday", d("2026-09-12"))), ["2026-09-07", "2026-09-13"]);
    assert.deepEqual(span(D.week("sunday", d("2026-09-12"))), ["2026-09-06", "2026-09-12"]);
    assert.deepEqual(span(D.week("saturday", d("2026-09-12"))), ["2026-09-12", "2026-09-18"]);
  });

  test("a day that is itself the week start opens its own week", () => {
    assert.equal(D.toISODate(D.firstDay(D.week("monday", d("2026-09-07")))), "2026-09-07");
    assert.equal(D.toISODate(D.firstDay(D.week("sunday", d("2026-09-13")))), "2026-09-13");
  });

  test("shift by whole weeks", () => {
    const week = D.week("monday", d("2026-09-12"));
    assert.deepEqual(span(D.add(4, week)), ["2026-10-05", "2026-10-11"]);
    assert.deepEqual(span(D.sub(2, week)), ["2026-08-24", "2026-08-30"]);
    assert.deepEqual(span(D.next(week)), ["2026-09-14", "2026-09-20"]);
    assert.deepEqual(span(D.prev(week)), ["2026-08-31", "2026-09-06"]);
  });

  test("weeks with different starts are different periods", () => {
    assert.equal(D.equals(D.week("monday", d("2026-09-12")), D.week("sunday", d("2026-09-12"))), false);
    assert.equal(D.equals(D.week("monday", d("2026-09-07")), D.week("monday", d("2026-09-13"))), true);
  });
});

describe("months, quarters and years", () => {
  test("month spans", () => {
    assert.deepEqual(span(D.month(d("2026-02-17"))), ["2026-02-01", "2026-02-28"]);
    assert.deepEqual(span(D.month(d("2024-02-10"))), ["2024-02-01", "2024-02-29"]);
    assert.deepEqual(span(D.month(d("2026-12-05"))), ["2026-12-01", "2026-12-31"]);
    assert.deepEqual(span(D.month(d("1900-02-15"))), ["1900-02-01", "1900-02-28"]); // 1900 is not a leap year
    assert.deepEqual(span(D.month(d("2000-02-15"))), ["2000-02-01", "2000-02-29"]); // 2000 is
  });

  test("month shifts stay on month boundaries", () => {
    const month = D.month(d("2026-01-31"));
    assert.deepEqual(span(D.add(1, month)), ["2026-02-01", "2026-02-28"]);
    assert.deepEqual(span(D.sub(2, month)), ["2025-11-01", "2025-11-30"]);
    assert.deepEqual(span(D.add(12, month)), ["2027-01-01", "2027-01-31"]);
  });

  test("quarter spans", () => {
    assert.deepEqual(span(D.quarter(d("2026-01-01"))), ["2026-01-01", "2026-03-31"]);
    assert.deepEqual(span(D.quarter(d("2026-05-17"))), ["2026-04-01", "2026-06-30"]);
    assert.deepEqual(span(D.quarter(d("2026-09-30"))), ["2026-07-01", "2026-09-30"]);
    assert.deepEqual(span(D.quarter(d("2026-12-31"))), ["2026-10-01", "2026-12-31"]);
    assert.deepEqual(span(D.add(3, D.quarter(d("2026-05-17")))), ["2027-01-01", "2027-03-31"]);
  });

  test("year spans", () => {
    assert.deepEqual(span(D.year(d("2026-07-04"))), ["2026-01-01", "2026-12-31"]);
    assert.equal(D.year(d("2026-07-04")).value, 2026);
    assert.equal(D.add(5, D.year(d("2026-07-04"))).value, 2031);
  });

  test("period indices are the documented encodings", () => {
    assert.equal(D.day(1970, 1, 1).value, 0);
    assert.equal(D.month(d("2026-03-01")).value, 2026 * 12 + 2);
    assert.equal(D.quarter(d("2026-05-17")).value, 2026 * 4 + 1);
    assert.equal(D.year(d("2026-05-17")).value, 2026);
  });
});

describe("the far past and the far future", () => {
  test("lie outside every definite day", () => {
    assert.equal(D.compare(D.farPast, d("1900-01-01")), -1);
    assert.equal(D.compare(D.farFuture, d("2100-12-31")), 1);
    assert.equal(D.compare(D.farPast, D.farPast), 0);
    assert.equal(D.compare(D.farPast, D.farFuture), -1);
  });

  test("absorb shifts", () => {
    assert.deepEqual(D.add(10, D.farPast), D.farPast);
    assert.deepEqual(D.sub(10, D.farFuture), D.farFuture);
    assert.deepEqual(D.add(Infinity, d("2026-01-01")), D.farFuture);
  });

  test("exist for every kind of period", () => {
    assert.equal(D.month(D.farFuture).value, Infinity);
    assert.equal(D.isFarFuture(D.quarter(D.farFuture)), true);
    assert.deepEqual(D.firstDay(D.month(D.farFuture)), D.farFuture);
    assert.deepEqual(D.lastDay(D.week("monday", D.farPast)), D.farPast);
    assert.deepEqual(D.add(3, D.year(D.farPast)), D.year(D.farPast));
  });

  test("are what dates outside 1900..2100 saturate to", () => {
    assert.deepEqual(D.day(2200, 1, 1), D.farFuture);
    assert.deepEqual(D.day(1800, 1, 1), D.farPast);
    assert.deepEqual(D.add(1, d("2100-12-31")), D.farFuture);
    assert.deepEqual(D.sub(1, d("1900-01-01")), D.farPast);
    assert.deepEqual(D.firstDay(D.add(500, D.year(d("2026-01-01")))), D.farFuture);
    // The week of 1900-01-01 (a Monday) fits; the Sunday-start week around it starts in 1899.
    assert.equal(D.toISODate(D.firstDay(D.week("monday", d("1900-01-01")))), "1900-01-01");
    assert.deepEqual(D.firstDay(D.week("sunday", d("1900-01-01"))), D.farPast);
  });

  test("have no calendar representation", () => {
    assert.equal(D.toISODate(D.farFuture), null);
    assert.equal(D.toDate(D.farPast), null);
    assert.equal(D.dayParts(D.farPast), null);
    assert.equal(D.isDefinite(D.farPast), false);
    assert.equal(D.isDefinite(d("2026-01-01")), true);
  });
});

describe("comparison", () => {
  test("orders days chronologically", () => {
    assert.equal(D.compare(d("2026-01-01"), d("2026-01-02")), -1);
    assert.equal(D.compare(d("2026-01-02"), d("2026-01-01")), 1);
    assert.equal(D.compare(d("2026-01-01"), d("2026-01-01")), 0);
  });

  test("equality needs the same kind of period", () => {
    assert.equal(D.equals(D.month(d("2026-02-01")), D.month(d("2026-02-28"))), true);
    assert.equal(D.equals(D.month(d("2026-02-01")), D.year(d("2026-02-01"))), false);
    assert.equal(D.equals(D.farPast, D.farFuture), false);
  });

  test("containment includes both ends", () => {
    const month = D.month(d("2026-02-17"));
    assert.equal(D.contains(month, d("2026-02-01")), true);
    assert.equal(D.contains(month, d("2026-02-28")), true);
    assert.equal(D.contains(month, d("2026-03-01")), false);
    assert.equal(D.contains(month, d("2026-01-31")), false);
    assert.equal(D.contains(D.year(d("2026-02-17")), d("2026-02-17")), true);
  });
});

test("every day in the representable range round-trips through ISO text", () => {
  let day = D.day(D.MIN_YEAR, 1, 1);
  let count = 0;
  while (D.isDefinite(day)) {
    const iso = D.toISODate(day)!;
    assert.equal(D.fromISODate(iso)?.value, day.value, iso);
    day = D.add(1, day);
    count++;
  }
  const expected = (Date.UTC(D.MAX_YEAR + 1, 0, 1) - Date.UTC(D.MIN_YEAR, 0, 1)) / 86_400_000;
  assert.equal(count, expected, "walked the whole range, one day at a time");
});
