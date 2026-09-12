import { test, describe } from "node:test";
import assert from "node:assert/strict";

import * as D from "./Date.ts";

// The range of dates worth caring about. The module itself is unbounded — these
// are only the dates the tests sweep over.
const [FIRST_YEAR, LAST_YEAR] = [1900, 2100];

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

describe("the civil calendar conversion", () => {
  const utcParts = (value: number): D.DayParts => {
    const date = new Date(value * 86_400_000);
    return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, dayOfMonth: date.getUTCDate() };
  };

  test("is anchored at the epoch", () => {
    assert.equal(D.day(1970, 1, 1).value, 0);
    assert.equal(D.day(1969, 12, 31).value, -1);
    assert.equal(D.day(1970, 1, 2).value, 1);
    // The shifted calendar's own origin, 400-year era zero.
    assert.equal(D.day(0, 3, 1).value, -719_468);
  });

  test("follows the Gregorian leap rules, including the century exceptions", () => {
    assert.equal(D.toISODate(D.day(2000, 2, 29)), "2000-02-29"); // divisible by 400: leap
    assert.equal(D.toISODate(D.day(1600, 2, 29)), "1600-02-29");
    assert.equal(D.toISODate(D.day(1900, 2, 29)), "1900-03-01"); // divisible by 100: not leap
    assert.equal(D.toISODate(D.day(2100, 2, 29)), "2100-03-01");
    assert.equal(D.toISODate(D.day(2024, 2, 29)), "2024-02-29"); // divisible by 4: leap
  });

  test("repeats exactly every 400 years", () => {
    // 146,097 days is the whole Gregorian cycle, so the calendar must land identically.
    for (const start of [D.day(1970, 1, 1), D.day(1900, 2, 28), D.day(2000, 2, 29), D.day(-500, 7, 14)]) {
      const parts = D.dayParts(start)!;
      assert.deepEqual(D.dayParts(D.add(146_097, start)), { ...parts, year: parts.year + 400 });
      assert.deepEqual(D.dayParts(D.sub(146_097, start)), { ...parts, year: parts.year - 400 });
    }
  });

  test("agrees with Date on and beyond the everyday range", () => {
    const dates: [number, number, number][] = [
      [1970, 1, 1],
      [2026, 9, 12],
      [1900, 1, 1],
      [2100, 12, 31],
      [1, 1, 1],
      [0, 1, 1],
      [-1, 12, 31],
      [-4713, 11, 24], // the Julian-day epoch, proleptic Gregorian
      [12345, 6, 7],
    ];
    for (const [year, month, dayOfMonth] of dates) {
      const value = D.day(year, month, dayOfMonth).value;
      const oracle = new Date(0);
      oracle.setUTCFullYear(year, month - 1, dayOfMonth);
      assert.equal(value, oracle.getTime() / 86_400_000, `${year}-${month}-${dayOfMonth}`);
      assert.deepEqual(D.dayParts(D.day(year, month, dayOfMonth)), { year, month, dayOfMonth });
    }
  });

  test("agrees with Date at the very ends of what Date can represent", () => {
    // Date tops out at ±8.64e15 ms, which is exactly ±100,000,000 days.
    for (const value of [-100_000_000, -99_999_999, 99_999_999, 100_000_000]) {
      const day = D.add(value, D.day(1970, 1, 1));
      assert.deepEqual(D.dayParts(day), utcParts(value));
      const { year, month, dayOfMonth } = D.dayParts(day)!;
      assert.equal(D.day(year, month, dayOfMonth).value, value);
    }
  });

  test("keeps working past Date, where Date gives up", () => {
    const far = D.day(1_000_000, 6, 15);
    assert.ok(D.isDefinite(far));
    assert.deepEqual(D.dayParts(far), { year: 1_000_000, month: 6, dayOfMonth: 15 });
    assert.equal(Number.isNaN(D.toDate(far)!.getTime()), true, "Date cannot hold it");
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

  test("weeks straddle the ends of a year", () => {
    assert.deepEqual(span(D.week("sunday", d("1900-01-01"))), ["1899-12-31", "1900-01-06"]);
    assert.deepEqual(span(D.week("monday", d("2100-12-31"))), ["2100-12-27", "2101-01-02"]);
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
    assert.equal(D.compare(D.farPast, d("-2000-01-01")), -1);
    assert.equal(D.compare(D.farFuture, d("2100-12-31")), 1);
    assert.equal(D.compare(D.farFuture, d("9999-12-31")), 1);
    assert.equal(D.compare(D.farPast, D.farPast), 0);
    assert.equal(D.compare(D.farPast, D.farFuture), -1);
  });

  test("absorb shifts, including infinite ones", () => {
    assert.deepEqual(D.add(10, D.farPast), D.farPast);
    assert.deepEqual(D.sub(10, D.farFuture), D.farFuture);
    assert.deepEqual(D.add(Infinity, D.farPast), D.farPast);
    assert.deepEqual(D.sub(Infinity, D.farFuture), D.farFuture);
    assert.deepEqual(D.add(-Infinity, D.farFuture), D.farFuture);
  });

  test("exist for every kind of period", () => {
    assert.equal(D.month(D.farFuture).value, Infinity);
    assert.equal(D.isFarFuture(D.quarter(D.farFuture)), true);
    assert.deepEqual(D.firstDay(D.month(D.farFuture)), D.farFuture);
    assert.deepEqual(D.lastDay(D.week("monday", D.farPast)), D.farPast);
    assert.deepEqual(D.add(3, D.year(D.farPast)), D.year(D.farPast));
  });

  test("are the only way to leave the calendar — remote dates are ordinary days", () => {
    assert.ok(D.isDefinite(D.day(2200, 1, 1)));
    assert.ok(D.isDefinite(D.day(1800, 1, 1)));
    assert.equal(D.toISODate(D.add(1, d("2100-12-31"))), "2101-01-01");
    assert.equal(D.toISODate(D.sub(1, d("1900-01-01"))), "1899-12-31");
    assert.equal(D.toISODate(D.firstDay(D.add(500, D.year(d("2026-01-01"))))), "2526-01-01");
  });

  test("are what shifting by an infinite amount reaches", () => {
    assert.deepEqual(D.add(Infinity, d("2026-01-01")), D.farFuture);
    assert.deepEqual(D.sub(Infinity, d("2026-01-01")), D.farPast);
    assert.ok(D.isFarFuture(D.add(Infinity, D.month(d("2026-01-01")))));
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

test("every day of 1900..2100 matches Date and round-trips through ISO text", () => {
  const last = D.day(LAST_YEAR, 12, 31);
  let day = D.day(FIRST_YEAR, 1, 1);
  let count = 0;
  while (D.compare(day, last) <= 0) {
    const iso = D.toISODate(day)!;
    assert.equal(D.fromISODate(iso)?.value, day.value, iso);
    const oracle = new Date(day.value * 86_400_000);
    const parts = D.dayParts(day)!;
    assert.equal(parts.year, oracle.getUTCFullYear(), iso);
    assert.equal(parts.month, oracle.getUTCMonth() + 1, iso);
    assert.equal(parts.dayOfMonth, oracle.getUTCDate(), iso);
    day = D.add(1, day);
    count++;
  }
  const expected = (Date.UTC(LAST_YEAR + 1, 0, 1) - Date.UTC(FIRST_YEAR, 0, 1)) / 86_400_000;
  assert.equal(count, expected, "walked the whole range, one day at a time");
});
