import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fc from "fast-check";

import * as D from "./Date.ts";

// --- generators ------------------------------------------------------------

const WEEK_STARTS: readonly D.WeekStart[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

type Kind = D.Period["type"];
const KINDS: readonly Kind[] = ["day", "week", "month", "quarter", "year"];

const periodOf = (kind: Kind, weekStart: D.WeekStart, day: D.Day): D.Period => {
  switch (kind) {
    case "day":
      return day;
    case "week":
      return D.week(weekStart, day);
    case "month":
      return D.month(day);
    case "quarter":
      return D.quarter(day);
    case "year":
      return D.year(day);
  }
};

const arbWeekStart = fc.constantFrom(...WEEK_STARTS);

// Days are unbounded, but only everyday dates behave usefully, so that is what the
// properties are stated over. Built with `day` alone — the primitive constructor —
// so the generator does not lean on the arithmetic the properties are meant to test.
const [FIRST_YEAR, LAST_YEAR] = [1900, 2100];

const arbDefiniteDay = fc
  .date({
    min: new Date(Date.UTC(FIRST_YEAR, 0, 1)),
    max: new Date(Date.UTC(LAST_YEAR, 11, 31)),
    noInvalidDate: true,
  })
  .map((date) => D.day(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()));

const arbInfiniteDay = fc.constantFrom(D.farPast, D.farFuture);

const arbDay = fc.oneof({ arbitrary: arbDefiniteDay, weight: 9 }, { arbitrary: arbInfiniteDay, weight: 1 });

/** A day together with one of the periods containing it — most laws need both ends of that relation. */
const arbSampleFrom = (day: fc.Arbitrary<D.Day>) =>
  fc.record({ kind: fc.constantFrom(...KINDS), weekStart: arbWeekStart, day }).map((sample) => ({
    ...sample,
    period: periodOf(sample.kind, sample.weekStart, sample.day),
  }));

const arbSample = arbSampleFrom(arbDay);
const arbDefiniteSample = arbSampleFrom(arbDefiniteDay);
const arbPeriod = arbSample.map(({ period }) => period);

// Shifts stay modest, so that a shifted everyday date is still an everyday date:
// days are unbounded, but calendar arithmetic goes through Date and stops meaning
// anything hundreds of thousands of years out. The infinite shifts are the
// interesting extreme instead — they land on the far past or far future.
const arbShift = fc.oneof(
  { arbitrary: fc.integer({ min: -5_000, max: 5_000 }), weight: 9 },
  { arbitrary: fc.constantFrom(Infinity, -Infinity), weight: 1 },
);

// --- oracles ---------------------------------------------------------------

const WEEKDAY_INDEX: Record<D.WeekStart, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const parts = (day: D.Day): D.DayParts => {
  const value = D.dayParts(day);
  assert.notEqual(value, null);
  return value!;
};

const utcMillis = (day: D.Day): number => {
  const { year, month, dayOfMonth } = parts(day);
  return Date.UTC(year, month - 1, dayOfMonth);
};

const isoOfMillis = (millis: number): string => new Date(millis).toISOString().slice(0, 10);

const definite = (...periods: D.Period[]) => fc.pre(periods.every(D.isDefinite));
const ends = (period: D.Period) => [D.firstDay(period), D.lastDay(period)] as const;
const lengthInDays = (period: D.Period) => D.lastDay(period).value - D.firstDay(period).value + 1;

// --- the period algebra ----------------------------------------------------

describe("shifting periods", () => {
  test("shifting by zero changes nothing", () => {
    fc.assert(fc.property(arbPeriod, (period) => assert.deepEqual(D.add(0, period), period)));
  });

  test("sub is add in the other direction", () => {
    fc.assert(fc.property(arbPeriod, arbShift, (period, n) => assert.deepEqual(D.sub(n, period), D.add(-n, period))));
  });

  test("sub undoes add", () => {
    fc.assert(
      fc.property(arbPeriod, arbShift, (period, n) => {
        const moved = D.add(n, period);
        definite(period, moved);
        assert.deepEqual(D.sub(n, moved), period);
      }),
    );
  });

  test("shifts compose", () => {
    fc.assert(
      fc.property(arbPeriod, arbShift, arbShift, (period, m, n) => {
        const once = D.add(n, period);
        const twice = D.add(m, once);
        definite(period, once, twice, D.add(m + n, period));
        assert.deepEqual(twice, D.add(m + n, period));
      }),
    );
  });

  test("shifting forward moves a period strictly forward", () => {
    fc.assert(
      fc.property(arbPeriod, arbShift, arbShift, (period, m, n) => {
        fc.pre(m < n);
        const [earlier, later] = [D.add(m, period), D.add(n, period)];
        definite(period, earlier, later);
        assert.equal(D.compare(D.firstDay(earlier), D.firstDay(later)), -1);
      }),
    );
  });

  test("the far past and the far future absorb every shift", () => {
    fc.assert(
      fc.property(arbSampleFrom(arbInfiniteDay), arbShift, ({ period }, n) => {
        assert.deepEqual(D.add(n, period), period);
        assert.deepEqual(D.sub(n, period), period);
      }),
    );
  });

  test("every result is a well-formed period, never NaN", () => {
    fc.assert(
      fc.property(arbPeriod, arbShift, (period, n) => {
        const moved = D.add(n, period);
        assert.equal(moved.type, period.type);
        assert.equal(D.isDefinite(moved), D.isDefinite(period) && Number.isFinite(n));
        for (const value of [moved.value, ...ends(moved).map((day) => day.value)]) {
          assert.equal(Number.isNaN(value), false);
        }
      }),
    );
  });
});

describe("first and last day", () => {
  test("a period never ends before it starts", () => {
    fc.assert(
      fc.property(arbPeriod, (period) => {
        const [first, last] = ends(period);
        assert.ok(D.compare(first, last) <= 0);
      }),
    );
  });

  test("a period contains its own first and last day", () => {
    fc.assert(
      fc.property(arbPeriod, (period) => {
        const [first, last] = ends(period);
        assert.ok(D.contains(period, first));
        assert.ok(D.contains(period, last));
      }),
    );
  });

  test("consecutive periods are adjacent, leaving no day uncovered", () => {
    fc.assert(
      fc.property(arbPeriod, (period) => {
        definite(period);
        assert.deepEqual(D.add(1, D.lastDay(period)), D.firstDay(D.next(period)));
      }),
    );
  });

  test("the far past and the far future have no extent", () => {
    fc.assert(
      fc.property(arbSampleFrom(arbInfiniteDay), ({ day, period }) => {
        assert.deepEqual(ends(period), [day, day]);
      }),
    );
  });
});

describe("the period containing a day", () => {
  test("contains that day", () => {
    fc.assert(fc.property(arbSample, ({ day, period }) => assert.ok(D.contains(period, day))));
  });

  test("is the same period for any day it contains", () => {
    fc.assert(
      fc.property(arbDefiniteSample, ({ kind, weekStart, period }) => {
        const [first, last] = ends(period);
        assert.ok(D.equals(periodOf(kind, weekStart, first), period));
        assert.ok(D.equals(periodOf(kind, weekStart, last), period));
      }),
    );
  });

  test("agrees with containment", () => {
    fc.assert(
      fc.property(arbDefiniteSample, arbDefiniteDay, ({ kind, weekStart, period }, other) => {
        assert.equal(D.contains(period, other), D.equals(periodOf(kind, weekStart, other), period));
      }),
    );
  });

  test("nests: a day sits in its month, in its quarter, in its year", () => {
    fc.assert(
      fc.property(arbDefiniteDay, (day) => {
        const [month, quarter, year] = [D.month(day), D.quarter(day), D.year(day)];
        const ascending = [
          D.firstDay(year),
          D.firstDay(quarter),
          D.firstDay(month),
          day,
          D.lastDay(month),
          D.lastDay(quarter),
          D.lastDay(year),
        ];
        for (const [earlier, later] of ascending.slice(1).map((next, i) => [ascending[i], next] as const)) {
          assert.ok(D.compare(earlier, later) <= 0);
        }
      }),
    );
  });
});

describe("calendar shapes", () => {
  test("a week starts on its week start and runs for seven days", () => {
    fc.assert(
      fc.property(arbDefiniteDay, arbWeekStart, (day, weekStart) => {
        const week = D.week(weekStart, day);
        assert.equal(D.weekday(D.firstDay(week)), weekStart);
        assert.equal(lengthInDays(week), 7);
      }),
    );
  });

  test("months, quarters and years have the lengths calendars have", () => {
    fc.assert(
      fc.property(arbDefiniteDay, (day) => {
        assert.ok([28, 29, 30, 31].includes(lengthInDays(D.month(day))));
        assert.ok([90, 91, 92].includes(lengthInDays(D.quarter(day))));
        assert.ok([365, 366].includes(lengthInDays(D.year(day))));
      }),
    );
  });

  test("adding n weeks is adding 7n days", () => {
    fc.assert(
      fc.property(arbDefiniteDay, arbWeekStart, arbShift, (day, weekStart, n) => {
        const week = D.week(weekStart, day);
        const shifted = D.firstDay(D.add(n, week));
        definite(shifted);
        assert.deepEqual(shifted, D.add(7 * n, D.firstDay(week)));
      }),
    );
  });

  test("adding 12 months, or 4 quarters, is adding a year", () => {
    fc.assert(
      fc.property(arbDefiniteDay, fc.integer({ min: -100, max: 100 }), (day, n) => {
        const month = D.add(12 * n, D.month(day));
        const quarter = D.add(4 * n, D.quarter(day));
        assert.equal(D.year(D.firstDay(month)).value, D.year(day).value + n);
        assert.equal(parts(D.firstDay(month)).month, parts(D.firstDay(D.month(day))).month);
        assert.equal(D.year(D.firstDay(quarter)).value, D.year(day).value + n);
        assert.deepEqual(D.firstDay(quarter), D.firstDay(D.quarter(D.firstDay(month))));
      }),
    );
  });
});

// --- checked against Date, an independent implementation of the same calendar

describe("agreement with Date", () => {
  test("days are the days Date thinks they are", () => {
    fc.assert(
      fc.property(arbDefiniteDay, (day) => {
        assert.equal(D.toISODate(day), isoOfMillis(utcMillis(day)));
        assert.equal(WEEKDAY_INDEX[D.weekday(day)!], new Date(utcMillis(day)).getUTCDay());
      }),
    );
  });

  test("shifting days is shifting by 86,400,000 milliseconds", () => {
    fc.assert(
      fc.property(arbDefiniteDay, arbShift, (day, n) => {
        const shifted = D.add(n, day);
        definite(shifted);
        assert.equal(D.toISODate(shifted), isoOfMillis(utcMillis(day) + n * 86_400_000));
      }),
    );
  });

  test("month, quarter and year ends are the ends Date computes", () => {
    fc.assert(
      fc.property(arbDefiniteDay, (day) => {
        const { year, month } = parts(day);
        const quarterMonth = Math.floor((month - 1) / 3) * 3 + 1;
        assert.equal(D.toISODate(D.firstDay(D.month(day))), isoOfMillis(Date.UTC(year, month - 1, 1)));
        assert.equal(D.toISODate(D.lastDay(D.month(day))), isoOfMillis(Date.UTC(year, month, 0)));
        assert.equal(D.toISODate(D.firstDay(D.quarter(day))), isoOfMillis(Date.UTC(year, quarterMonth - 1, 1)));
        assert.equal(D.toISODate(D.lastDay(D.quarter(day))), isoOfMillis(Date.UTC(year, quarterMonth + 2, 0)));
        assert.equal(D.toISODate(D.firstDay(D.year(day))), isoOfMillis(Date.UTC(year, 0, 1)));
        assert.equal(D.toISODate(D.lastDay(D.year(day))), isoOfMillis(Date.UTC(year, 11, 31)));
      }),
    );
  });
});

// --- conversions, ordering, saturation --------------------------------------

describe("conversions", () => {
  test("ISO text round-trips", () => {
    fc.assert(
      fc.property(arbDefiniteDay, (day) => {
        assert.deepEqual(D.fromISODate(D.toISODate(day)!), day);
      }),
    );
  });

  test("Date round-trips", () => {
    fc.assert(
      fc.property(arbDefiniteDay, (day) => {
        assert.deepEqual(D.fromDate(D.toDate(day)!), day);
      }),
    );
  });

  test("the far past and the far future have no calendar form", () => {
    fc.assert(
      fc.property(arbSampleFrom(arbInfiniteDay), ({ day }) => {
        assert.equal(D.toISODate(day), null);
        assert.equal(D.toDate(day), null);
        assert.equal(D.dayParts(day), null);
        assert.equal(D.weekday(day), null);
      }),
    );
  });
});

describe("ordering", () => {
  test("orders days the way their ISO text sorts", () => {
    fc.assert(
      fc.property(arbDefiniteDay, arbDefiniteDay, (a, b) => {
        const [textA, textB] = [D.toISODate(a)!, D.toISODate(b)!];
        assert.equal(D.compare(a, b), textA < textB ? -1 : textA > textB ? 1 : 0);
      }),
    );
  });

  test("is antisymmetric", () => {
    // Summed rather than negated: -0 !== 0 under a strict equality assertion.
    fc.assert(fc.property(arbDay, arbDay, (a, b) => assert.equal(D.compare(a, b) + D.compare(b, a), 0)));
  });

  test("is transitive", () => {
    fc.assert(
      fc.property(arbDay, arbDay, arbDay, (a, b, c) => {
        fc.pre(D.compare(a, b) <= 0 && D.compare(b, c) <= 0);
        assert.ok(D.compare(a, c) <= 0);
      }),
    );
  });

  test("equality is reflexive and symmetric, and separates the kinds of period", () => {
    fc.assert(
      fc.property(arbPeriod, arbPeriod, (a, b) => {
        assert.ok(D.equals(a, a));
        assert.equal(D.equals(a, b), D.equals(b, a));
        if (D.equals(a, b)) assert.equal(a.type, b.type);
      }),
    );
  });
});

describe("the far past and the far future", () => {
  test("lie outside every definite day, however remote", () => {
    fc.assert(
      fc.property(fc.integer({ min: -200_000, max: 200_000 }), fc.integer({ min: 1, max: 12 }), (year, month) => {
        const remote = D.day(year, month, 1);
        assert.ok(D.isDefinite(remote));
        assert.equal(D.compare(D.farPast, remote), -1);
        assert.equal(D.compare(D.farFuture, remote), 1);
      }),
    );
  });

  test("are what an infinite shift reaches, from any period", () => {
    fc.assert(
      fc.property(arbPeriod, (period) => {
        fc.pre(D.isDefinite(period));
        assert.ok(D.isFarFuture(D.add(Infinity, period)));
        assert.ok(D.isFarPast(D.sub(Infinity, period)));
        assert.deepEqual(D.firstDay(D.add(Infinity, period)), D.farFuture);
        assert.deepEqual(D.lastDay(D.sub(Infinity, period)), D.farPast);
      }),
    );
  });

  test("absorb every shift, so nothing ever escapes them", () => {
    fc.assert(
      fc.property(arbSampleFrom(arbInfiniteDay), arbShift, arbShift, ({ day, period }, m, n) => {
        assert.deepEqual(D.add(m, D.add(n, period)), period);
        assert.deepEqual(D.sub(m, D.add(n, period)), period);
        assert.deepEqual(ends(D.add(n, period)), [day, day]);
        assert.equal(D.isDefinite(D.add(n, period)), false);
      }),
    );
  });

  test("stay put under every conversion back to a period", () => {
    fc.assert(
      fc.property(arbSampleFrom(arbInfiniteDay), ({ day, kind, weekStart }) => {
        const period = periodOf(kind, weekStart, day);
        assert.equal(period.value, day.value);
        assert.deepEqual(D.firstDay(period), day);
        assert.deepEqual(D.lastDay(period), day);
      }),
    );
  });
});
