import { Unit, SubUnit } from "./StoreTypes";

export const isSummable = (unit: SubUnit): boolean => {
  switch (unit.type) {
    case "number":
      return true;
    case "count":
      return true;
    case "percentage":
      return true;
    case "distance":
      return true;
    case "weight":
      return true;
    case "time":
      return true;
    case "climbing_grade":
      return false;
  }
};

// Convert a numerical value to an editable value.
// Function `reencode` must be idempotent over n, where:
//   reencode(n, u) = stringToNumber(numberToString(n, u), u)
export const numberToString = (value: number | null, unit: SubUnit): string => {
  "worklet";
  if (value === null) {
    return "";
  }
  switch (unit.type) {
    case "number":
      return value.toString();
    case "count":
      return value.toString();
    case "percentage":
      return value.toString();
    case "distance":
      return value.toString();
    case "weight":
      return value.toString();
    case "time":
      switch (unit.unit) {
        case "hours": {
          const v = Math.abs(value) + 0.5 / 3600; // add 0.5 seconds to avoid rounding errors
          const sign = value < 0 ? "-" : "";
          const hours = Math.floor(v);
          const minutes = Math.floor((v - hours) * 60);
          const seconds = Math.floor(((v - hours) * 60 - minutes) * 60);
          if (seconds == 0) {
            return `${sign}${hours}:${minutes.toString().padStart(2, "0")}`;
          } else {
            return `${sign}${hours}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
          }
        }
        case "seconds": {
          const v = Math.abs(value) + 0.5; // add 0.5 seconds to avoid rounding errors
          const sign = value < 0 ? "-" : "";
          const hours = Math.floor(v / 3600);
          const minutes = Math.floor((v - hours * 3600) / 60);
          const seconds = Math.floor(v - hours * 3600 - minutes * 60);

          const fractionalPart =
            Math.abs(value % 1) < 0.005
              ? ""
              : `.${(value % 1).toFixed(2).split(".")[1]}`;
          if (hours == 0) {
            return `${sign}${minutes.toString()}:${seconds
              .toString()
              .padStart(2, "0")}${fractionalPart}`;
          } else {
            return `${sign}${hours}:${minutes
              .toString()
              .padStart(2, "0")}:${seconds
              .toString()
              .padStart(2, "0")}${fractionalPart}`;
          }
        }
      }
    case "climbing_grade":
      switch (unit.grade) {
        case "uiaa": {
          let rem = value % 1;
          let base = Math.round(value - rem);

          if (value < 0.6) {
            return `<1`;
          } else if (value > 13.4) {
            return `>13`;
          }

          if (rem < 0.1) {
            return `${base}`;
          } else if (rem < 0.2) {
            return `${base}/${base}+`;
          } else if (rem < 0.4) {
            return `${base}+`;
          } else if (rem < 0.6) {
            return `${base}+/${base + 1}-`;
          } else if (rem < 0.8) {
            return `${base + 1}-`;
          } else if (rem < 0.9) {
            return `${base + 1}-/${base + 1}`;
          } else {
            return `${base + 1}`;
          }
        }
        case "french":
          if (value < 0.75) {
            return "<1";
          } else if (value < 2.82) {
            let w = value + 0.25;
            return `${Math.floor(w)}${w % 1 < 0.5 ? "" : "+"}`;
          } else if (value < 4.92) {
            let w = value + 0.17;
            return `${Math.floor(w)}${
              w % 1 < 0.33 ? "a" : w % 1 < 0.67 ? "b" : "c"
            }`;
          } else if (value < 9.92) {
            let w = value + 0.08;
            let r = w % 1;
            return `${Math.floor(w)}${
              r < 0.16
                ? "a"
                : r < 0.33
                ? "a+"
                : r < 0.5
                ? "b"
                : r < 0.67
                ? "b+"
                : r < 0.84
                ? "c"
                : "c+"
            }`;
          } else {
            return "≥10a";
          }
        case "font":
          if (value < 2.75) {
            return "<3";
          } else if (value < 5.75) {
            let w = value + 0.25;
            return `${Math.floor(w)}${w % 1 < 0.5 ? "" : "+"}`;
          } else if (value < 9.17) {
            let w = value + 0.08;
            let r = w % 1;
            return `${Math.floor(w)}${
              r < 0.16
                ? "A"
                : r < 0.33
                ? "A+"
                : r < 0.5
                ? "B"
                : r < 0.67
                ? "B+"
                : r < 0.84
                ? "C"
                : "C+"
            }`;
          } else {
            return ">9A";
          }
        case "v-scale":
          if (value < -1.5) {
            return "VB-";
          } else if (value < -0.5) {
            return "VB";
          } else if (value > 17.5) {
            return "V17+";
          }
          if (Math.abs((value % 1) - 0.5) < 0.1) {
            return `V${Math.round(value - 1).toString()}/V${Math.round(
              value
            ).toString()}`;
          } else {
            return `V${Math.round(value).toString()}`;
          }
        case "yds":
          const w = value + 0.12;
          if (w < 0) {
            return "<5.0";
          } else if (w < 10) {
            return `5.${Math.floor(w)}`;
          } else if (w < 16) {
            const num = Math.floor(w);
            let letter;
            if (w % 1 < 0.25) {
              letter = "a";
            } else if (w % 1 < 0.5) {
              letter = "b";
            } else if (w % 1 < 0.75) {
              letter = "c";
            } else {
              letter = "d";
            }
            return `5.${num}${letter}`;
          } else {
            return "≥5.16";
          }
      }
  }
};

// Convert an editable value to a numerical value.
// Function `reencode` must be idempotent over n, where:
//   reencode(n, u) = stringToNumber(numberToString(n, u), u)
export const stringToNumber = (value: string, unit: SubUnit): number | null => {
  if (value === "") {
    return null;
  }
  switch (unit.type) {
    case "number":
      return parseFloat(value);
    case "count":
      return parseInt(value);
    case "percentage":
      return parseFloat(value);
    case "distance":
      return parseFloat(value);
    case "weight":
      return parseFloat(value);
    case "time": {
      let n;
      switch (unit.unit) {
        case "hours": {
          if (value.match(/^\d+:\d+$/)) {
            const [hours, minutes] = value.split(":").map(Number);
            n = hours + minutes / 60;
          } else if (value.match(/^\d+:\d+:\d+$/)) {
            const [hours, minutes, seconds] = value.split(":").map(Number);
            n = hours + minutes / 60 + seconds / 3600;
          } else if (value.match(/^\d+(\.\d+)?$/)) {
            n = parseFloat(value);
          } else {
            return null;
          }
          if (!isFinite(n)) {
            return null;
          } else {
            return Math.round(n * 100000) / 100000;
          }
        }
        case "seconds": {
          if (value.match(/^\d+:\d+(\.\d+)?$/)) {
            const [minutes, seconds] = value.split(":").map(Number);
            n = minutes * 60 + seconds;
          } else if (value.match(/^\d+:\d+:\d+(\.\d+)?$/)) {
            const [hours, minutes, seconds] = value.split(":").map(Number);
            n = hours * 3600 + minutes * 60 + seconds;
          } else if (value.match(/^\d+(\.\d+)?$/)) {
            n = parseFloat(value);
          } else {
            return null;
          }
          if (!isFinite(n)) {
            return null;
          } else {
            return Math.round(n * 100) / 100;
          }
        }
      }
    }
    case "climbing_grade": {
      switch (unit.grade) {
        case "uiaa": {
          let makeUiaa = (num: string, sign: string) => {
            return (
              parseFloat(num) + (sign === "+" ? 0.33 : sign === "-" ? -0.33 : 0)
            );
          };
          let match;
          if ((match = value.match(/^([0-9]+)([+-]?)$/))) {
            return makeUiaa(match[1], match[2]);
          } else if (
            (match = value.match(/^([0-9]+)([+-]?)\/([0-9]+)([+-]?)$/))
          ) {
            return (
              (makeUiaa(match[1], match[2]) + makeUiaa(match[3], match[4])) / 2
            );
          } else {
            return null;
          }
        }
        case "french": {
          const makeFrench = (num: string, letter: string, sign: string) => {
            return (
              parseFloat(num) +
              (letter === "a"
                ? 0
                : letter === "b"
                ? 0.33
                : letter === "c"
                ? 0.67
                : 0) +
              (sign === "/+" ? 0.08 : sign === "+" ? 0.17 : 0)
            );
          };
          let match;
          if (value.match(/^[1234]$/)) {
            return parseFloat(value);
          } else if (value.match(/^[1234]\+$/)) {
            return parseFloat(value) + 0.5;
          } else if ((match = value.match(/^([3456789])([abc])(\/?\+)?$/))) {
            return makeFrench(match[1], match[2], match[3]);
          } else if (
            (match = value.match(
              /^([3456789])([abc])(\/?\+)?\/([3456789])([abc])(\/?\+)?$/
            ))
          ) {
            return (
              (makeFrench(match[1], match[2], match[3]) +
                makeFrench(match[4], match[5], match[6])) /
              2
            );
          } else {
            return null;
          }
        }
        case "yds":
          if (value.match(/^5\.[0-9]$/)) {
            return parseFloat(value.slice(2));
          } else if (value.match(/^5\.1[0-5][abcd]?$/)) {
            let num = parseFloat(value.slice(2, -1));
            let letter = value.slice(-1);
            return (
              num +
              (letter === "a"
                ? 0
                : letter === "b"
                ? 0.25
                : letter === "c"
                ? 0.5
                : letter === "d"
                ? 0.75
                : 0)
            );
          } else {
            return null;
          }
        case "font":
          if (value.match(/^[345]$/)) {
            return parseFloat(value);
          } else if (value.match(/^[345]\+$/)) {
            return parseFloat(value) + 0.5;
          } else if (value.match(/^[6789][ABC]$/)) {
            let num = parseFloat(value.slice(0, -1));
            let letter = value.slice(-1);
            return (
              num +
              (letter === "A"
                ? 0
                : letter === "B"
                ? 0.33
                : letter === "C"
                ? 0.67
                : 0)
            );
          } else if (value.match(/^[6789][ABC]\+$/)) {
            let num = parseFloat(value.slice(0, -2));
            let letter = value.slice(-2, -1);
            return (
              num +
              0.17 +
              (letter === "A"
                ? 0
                : letter === "B"
                ? 0.33
                : letter === "C"
                ? 0.67
                : 0)
            );
          } else {
            return null;
          }
        case "v-scale":
          if (value.match(/^[Vv]\d+$/)) {
            return parseFloat(value.replace(/^[vV]/, ""));
          } else if (value.match(/^[Vv]\d+\/[Vv]\d+$/)) {
            const [v1, v2] = value
              .split("/")
              .map((s) => Number(s.replace(/^[vV]/, "")));
            return (v1 + v2) / 2;
          } else {
            console.error("Invalid value: " + value);
            return null;
          }
      }
    }
  }
};

export const renderLongFormNumber = (value: number): string => {
  "worklet";
  let a = Math.abs(value);
  let e = Math.max(0, Math.floor(Math.log10(a) / 3 + 1e-10));
  let ab = a / Math.pow(1000, e);

  if (e <= 3) {
    let prefix = value < 0 ? "-" : "";
    let suffix = ["", "k", "M", "G"][e];
    if (ab < 10) {
      return `${prefix}${Math.round(ab * 100) / 100}${suffix}`;
    } else if (ab < 100) {
      return `${prefix}${Math.round(ab * 10) / 10}${suffix}`;
    } else if (ab < 1000) {
      return `${prefix}${Math.round(ab)}${suffix}`;
    } else {
      return "n/a";
    }
  } else {
    return value.toPrecision(3);
  }
};

export const renderShortFormNumber = (value: number): string => {
  "worklet";
  return renderLongFormNumber(value);
};

// Render a short form value. It should be at most ~5 characters long, and should not contain the unit.
// It is used in the calendar view, and in the graph view.
export const renderShortFormValue = (value: number, unit: SubUnit): string => {
  "worklet";
  switch (unit.type) {
    case "number":
      return renderShortFormNumber(value);
    case "count":
      return renderShortFormNumber(value);
    case "percentage":
      if (Math.abs(value) < 10) {
        return renderShortFormNumber(Math.round(value * 10) / 10) + "%";
      } else {
        return renderShortFormNumber(Math.round(value)) + "%";
      }
    case "distance":
      return renderShortFormNumber(value);
    case "weight":
      return renderShortFormNumber(value);
    case "time":
      switch (unit.unit) {
        case "hours":
          if (value > 24) {
            return renderShortFormNumber(value);
          } else if (value >= 1) {
            return numberToString(Math.round(value * 60) / 60, unit);
          } else {
            return numberToString(Math.round(value * 60) / 60, unit);
          }
        case "seconds":
          if (value >= 10 * 3600) {
            return renderShortFormNumber(Math.round(value / 3600)) + "h";
          } else if (value >= 3600) {
            return (
              renderShortFormNumber(Math.round((value / 3600) * 10) / 10) + "h"
            );
          } else if (value >= 60) {
            return numberToString(Math.round(value), unit);
          } else {
            return renderShortFormNumber(value);
          }
      }
    case "climbing_grade":
      return numberToString(value, unit);
  }
};

// Render a long form value. It should contain the unit.
// It is used in the summary views, and in the data view.
export const renderLongFormValue = (value: number, unit: SubUnit): string => {
  "worklet";
  switch (unit.type) {
    case "number": {
      let suffix = unit.symbol === "" ? "" : " " + unit.symbol;
      return renderLongFormNumber(value) + suffix;
    }
    case "count":
      return renderLongFormNumber(value);
    case "percentage":
      return renderLongFormNumber(value) + " %";
    case "distance":
      return `${renderLongFormNumber(value)} ${unit.unit}`;
    case "weight":
      return `${renderLongFormNumber(value)} ${unit.unit}`;
    case "time":
      switch (unit.unit) {
        case "hours":
          if (Math.abs(value) > 24) {
            return renderShortFormNumber(value) + " h";
          } else if (Math.abs(value) >= 1) {
            return numberToString(Math.round(value * 60) / 60, unit);
          } else {
            return numberToString(value, unit);
          }
        case "seconds":
          if (Math.abs(value) >= 10 * 3600) {
            return renderShortFormNumber(value / 3600) + " h";
          } else if (Math.abs(value) >= 60) {
            return numberToString(Math.round(value), unit);
          } else {
            return renderShortFormNumber(value) + " s";
          }
      }
    case "climbing_grade":
      return renderShortFormValue(value, unit);
  }
};

export const renderUnit = (unit: SubUnit): string => {
  switch (unit.type) {
    case "number":
      return "Number" + (unit.symbol === "" ? "" : ` (${unit.symbol})`);
    case "count":
      return "Count";
    case "percentage":
      return "Percentage";
    case "distance":
      return `Distance (${unit.unit})`;
    case "weight":
      return `Weight (${unit.unit})`;
    case "time":
      switch (unit.unit) {
        case "seconds":
          return "Time (seconds)";
        case "hours":
          return "Time (hours)";
      }
    case "climbing_grade":
      switch (unit.grade) {
        case "uiaa":
          return "Climbing Grade (UIAA)";
        case "french":
          return "Climbing Grade (French)";
        case "font":
          return "Climbing Grade (Font)";
        case "v-scale":
          return "Climbing Grade (V-Scale)";
        case "yds":
          return "Climbing Grade (YDS)";
      }
  }
};

export const uiaaGrades = [...Array(12).keys()]
  .map((n) => {
    let g = n + 1;
    return [
      `${g}-`,
      `${g}-/${g}`,
      `${g}`,
      `${g}/${g}+`,
      `${g}+`,
      `${g}+/${g + 1}-`,
    ];
  })
  .flat(Infinity) as string[];

export const frenchGrades = [
  [1, 2, 3].map((n) => [`${n}`, `${n}+`]),
  [4, 5, 6, 7, 8, 9].map((n) => [
    `${n}a`,
    `${n}a+`,
    `${n}b`,
    `${n}b+`,
    `${n}c`,
    `${n}c+`,
  ]),
].flat(Infinity) as string[];

export const fontGrades = [
  [3, 4, 5].map((n) => [`${n}`, `${n}+`]),
  [6, 7, 8].map((n) => [
    `${n}A`,
    `${n}A+`,
    `${n}B`,
    `${n}B+`,
    `${n}C`,
    `${n}C+`,
  ]),
  [["9A", "9A+"]],
].flat(Infinity) as string[];

export const ydsGrades = [
  [...Array(10).keys()].map((n) => [`5.${n}`]),
  [...Array(6).keys()].map((n) => [
    `5.1${n}a`,
    `5.1${n}b`,
    `5.1${n}c`,
    `5.1${n}d`,
  ]),
].flat(Infinity) as string[];

export const vScaleGrades = [...Array(17).keys()]
  .map((g) => {
    return [`V${g}`, `V${g}/V${g + 1}`];
  })
  .flat(Infinity) as string[];

export const mapStringValue = (
  unit: SubUnit,
  value: string,
  fn: (value: number) => number
): string => {
  return numberToString(fn(stringToNumber(value, unit) ?? 0), unit);
};

export const areUnitsEqual = (unit1: Unit, unit2: Unit): boolean => {
  if (unit1.type === "none" && unit2.type === "none") {
    return true;
  } else if (unit1.type === "single" && unit2.type === "single") {
    return areSubUnitsEqual(unit1.unit, unit2.unit);
  } else if (unit1.type === "multiple" && unit2.type === "multiple") {
    return (
      unit1.values.length === unit2.values.length &&
      unit1.values.every(
        (u1, i) =>
          u1.name === unit2.values[i].name &&
          areSubUnitsEqual(u1.unit, unit2.values[i].unit)
      )
    );
  } else {
    return false;
  }
};

export const areSubUnitsEqual = (
  subUnit1: SubUnit,
  subUnit2: SubUnit
): boolean => {
  if (subUnit1.type === subUnit2.type) {
    let subUnit2Copy: any = subUnit2; // we know the constructor is the same as subUnit1 here.
    switch (subUnit1.type) {
      case "number":
        return subUnit1.symbol === subUnit2Copy.symbol;
      case "count":
        return true;
      case "percentage":
        return true;
      case "distance":
        return subUnit1.unit === subUnit2Copy.unit;
      case "weight":
        return subUnit1.unit === subUnit2Copy.unit;
      case "time":
        return subUnit1.unit === subUnit2Copy.unit;
      case "climbing_grade":
        return subUnit1.grade === subUnit2Copy.grade;
    }
  } else {
    return false;
  }
};
