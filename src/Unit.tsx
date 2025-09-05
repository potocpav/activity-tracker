import { Unit, SubUnit } from "./StoreTypes";

export const isSummable = (unit: SubUnit): boolean => {
  switch (unit.type) {
    case "number":
      return true;
    case "count":
      return true;
    case "weight":
      return true;
    case "time":
      return true;
    case "climbing_grade":
      return false;
  }
}

export const renderLongFormNumber = (value: number): string => {
  let a = Math.abs(value);
  let e = Math.max(0, Math.floor(Math.log10(a) / 3 + 1e-10));
  let ab = a / Math.pow(1000, e);
  
  if (e <=3) {
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
}

export const renderShortFormNumber = (value: number): string => {
  return renderLongFormNumber(value);
}

// Render a short form value. It should be at most ~5 characters long, and should not contain the unit.
// It is used in the calendar view, and in the graph view.
export const renderShortFormValue = (value: number, unit: SubUnit): string => {
  switch (unit.type) {
    case "number":
      return renderShortFormNumber(value);
    case "count":
      return renderShortFormNumber(value);
    case "weight":
      return renderShortFormNumber(value);
    case "time":
      switch (unit.unit) {
        case "hours":
          if (value > 24) {
            return renderShortFormNumber(value);
          } else {
            return toInputValue(value, unit);
          }
        case "seconds":
          if (value > 10 * 3600) {
            return renderShortFormNumber(value / 3600) + " h";
          } else {
            return toInputValue(value, unit);
          }
      }
    case "climbing_grade":
      switch (unit.grade) {
        case "uiaa": {
          let rem = value % 1;
          let base = Math.round(value - rem);

          if (base < 0.9) {
            return `<1`;
          } else if (base > 13.1) {
            return `>13`;
          }

          if (rem < 0.1) {
            return `${base}`;
          } else if (rem < 0.2) {
            return `${base}/${base}+`;
          } else if (rem < 0.4) {
            return `${base}+`;
          } else if (rem < 0.6) {
            return `${base}+/${base+1}-`;
          } else if (rem < 0.8) {
            return `${base+1}-`;
          } else if (rem < 0.9) {
            return `${base+1}-/${base+1}`;
          } else {
            return `${base+1}`;
          }
        }
        case "french":
          return renderShortFormNumber(value);
        case "font":
          return renderShortFormNumber(value);
        case "v-scale":
          if (value < -1.5) {
            return "VB-";
          } else if (value < -0.5) {
            return "VB";
          } else if (value > 17.5) {
            return "V17+"
          }
          if (Math.abs(value % 1 - 0.5) < 0.1) {
            return `V${Math.round(value-1).toString()}/V${Math.round(value).toString()}`;
          } else {
            return `V${Math.round(value).toString()}`;
          }
      }
  }
}

// Render a long form value. It should contain the unit.
// It is used in the summary views, and in the data view.
export const renderLongFormValue = (value: number, unit: SubUnit): string => {
  switch (unit.type) {
    case "number": {
        let suffix = unit.symbol === "" ? "" : " " + unit.symbol;
        return renderLongFormNumber(value) + suffix;
    }
    case "count":
      return renderLongFormNumber(value);
    case "weight":
      return `${renderLongFormNumber(value)} ${unit.unit}`;
    case "time":
      return renderShortFormValue(value, unit);
    case "climbing_grade":
      return renderShortFormValue(value, unit);
  }
}

export const renderUnit = (unit: SubUnit): string => {
  switch (unit.type) {
    case "number":
      return "Number" + (unit.symbol === "" ? "" : ` (${unit.symbol})`);
    case "count":
      return "Count";
    case "weight":
      switch (unit.unit) {
        case "kg":
          return "Weight (kg)";
        case "lb":
          return "Weight (lb)";
      }
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
      }
  }
}

// Convert a numerical value to an editable value.
// Function `reencode` must be idempotent over n, where:
//   reencode(n, u) = fromInputValue(toInputValue(n, u), u)
export const toInputValue = (value: number | null, unit: SubUnit): string => {
  if (value === null) {
    return "";
  }
  switch (unit.type) {
    case "number":
      return value.toString();
    case "count":
      return value.toString();
    case "weight":
      return value.toString();
    case "time":
      switch (unit.unit) {
        case "hours": {
          const v = value + 0.5/3600; // add 0.5 seconds to avoid rounding errors
          const hours = Math.floor(v);
          const minutes = Math.floor((v - hours) * 60);
          const seconds = Math.floor(((v - hours) * 60 - minutes) * 60);
          if (seconds == 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}`;
          } else {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }
        case "seconds": {
          const v = value + 0.5; // add 0.5 seconds to avoid rounding errors
          const hours = Math.floor(v / 3600);
          const minutes = Math.floor((v - hours * 3600) / 60);
          const seconds = Math.floor(v - hours * 3600 - minutes * 60);

          if (hours == 0) {
            return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
          } else {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
          }
        }
      }
    case "climbing_grade":
      return value.toString();
  }
}


// Convert an editable value to a numerical value.
// Function `reencode` must be idempotent over n, where:
//   reencode(n, u) = fromInputValue(toInputValue(n, u), u)
export const fromInputValue = (value: string, unit: SubUnit): number | null => {
  switch (unit.type) {
    case "number":
      return parseFloat(value);
    case "count":
      return parseInt(value);
    case "weight":
      return parseFloat(value);
    case "time": {
      let n;
      switch (unit.unit) {
        case "hours": {
          if (value.match(/^\d+:\d+$/)) {
            const [hours, minutes] = value.split(':').map(Number);
            n = hours + minutes / 60;
          } else if (value.match(/^\d+:\d+:\d+$/)) {
            const [hours, minutes, seconds] = value.split(':').map(Number);
            n = hours + minutes / 60 + seconds / 3600;
          } else if (value.match(/^\d+(.\d+)?$/)) {
            n = parseFloat(value);
          } else {
            return null;
          }
          if (!isFinite(n)) {
            return null;
          } else {
            return Math.floor(n * 100000) / 100000;
          }
        }
        case "seconds": {
          let n = parseFloat(value);
          if (!isFinite(n) || n < 0) {
            return null;
          } else {
            return Math.floor(n * 100000) / 100000;
          }
        }
      }
    }
    case "climbing_grade": {
      value = value.replace(/^[vV]/, '');
      const n = parseFloat(value);
      if (!isFinite(n) || n < 0) {
        return null;
      } else {
        return n;
      }
    }
  }
}


export const areUnitsEqual = (unit1: Unit, unit2: Unit): boolean => {
  if (unit1.type === "none" && unit2.type === "none") {
    return true;
  } else if (unit1.type === "single" && unit2.type === "single") {
    return areSubUnitsEqual(unit1.unit, unit2.unit);
  } else if (unit1.type === "multiple" && unit2.type === "multiple") {
    return unit1.values.length === unit2.values.length && unit1.values.every(
      (u1, i) => u1.name === unit2.values[i].name && areSubUnitsEqual(u1.unit, unit2.values[i].unit));
  } else {
    return false;
  }
}

export const areSubUnitsEqual = (subUnit1: SubUnit, subUnit2: SubUnit): boolean => {
  if (subUnit1.type === subUnit2.type) {
    let subUnit2Copy : any = subUnit2; // we know the constructor is the same as subUnit1 here.
    switch (subUnit1.type) {
      case "number":
        return subUnit1.symbol === subUnit2Copy.symbol;
      case "count":
        return true;
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
}