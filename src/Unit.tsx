import { Unit, SubUnit } from "./StoreTypes";

export const renderLongFormNumber = (value: number): string => {
  return `${Math.round(value * 10) / 10}`;
}

export const renderShortFormNumber = (value: number): string => {
  return `${Math.round(value * 10) / 10}`;
}

export const renderLongFormValue = (value: number, unit: SubUnit): string => {
  switch (unit.type) {
    case "number":
      let suffix1 = unit.symbol === "" ? "" : " " + unit.symbol;
      return renderLongFormNumber(value) + suffix1;
    case "count":
      return renderLongFormNumber(value);
    case "weight":
      return `${renderLongFormNumber(value)} ${unit.unit}`;
    case "time":
      let suffix2;
      if (unit.unit === "seconds") {
        suffix2 = "s";
      } else if (unit.unit === "minutes") {
        suffix2 = "m";
      } else if (unit.unit === "hours") {
        suffix2 = "h";
      }
      return `${renderLongFormNumber(value)} ${suffix2}`;
    case "climbing_grade":
      return `${renderLongFormNumber(value)} ${unit.grade}`;
  }
}

export const toInputValue = (value: number, unit: SubUnit): string => {
  switch (unit.type) {
    case "number":
      return value.toString();
    case "count":
      return value.toString();
    case "weight":
      return value.toString();
    case "time":
      return value.toString();
    case "climbing_grade":
      return value.toString();
  }
}

export const fromInputValue = (value: string, unit: SubUnit): number => {
  switch (unit.type) {
    case "number":
      return parseFloat(value);
    case "count":
      return parseInt(value);
    case "weight":
      return parseFloat(value);
    case "time":
      return parseFloat(value);
    case "climbing_grade":
      return parseFloat(value);
  }
}


export const areUnitsEqual = (unit1: Unit, unit2: Unit): boolean => {
  if (unit1.type === "none" && unit2.type === "none") {
    return true;
  } else if (unit1.type === "single" && unit2.type === "single") {
    return areSubUnitsEqual(unit1.unit, unit2.unit);
  } else if (unit1.type === "multiple" && unit2.type === "multiple") {
    return unit1.values.length === unit2.values.length && unit1.values.every((u1, i) => areSubUnitsEqual(u1.unit, unit2.values[i].unit));
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