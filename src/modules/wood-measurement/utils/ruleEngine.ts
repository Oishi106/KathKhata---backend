import { RuleFormulaType } from "../models/measurementRule.model";

export interface RoundLogInput {
  girth: number; // পরিধি / বেয়ার
  length: number; // দৈর্ঘ্য / আড়ে
  quantity: number;
}

export interface SizeCutInput {
  length: number;
  width: number;
  thickness: number;
  quantity: number;
}

/**
 * Round log CFT — girth given in FEET.
 * Bangladeshi sawmill standard: CFT = (Girth × Girth × Length) / 16
 */
export const calculateRoundLogFeet = (input: RoundLogInput): number => {
  const { girth, length, quantity } = input;
  return ((girth * girth * length) / 16) * quantity;
};

/**
 * Round log CFT — girth given in INCHES.
 * Bangladeshi sawmill standard: CFT = (Length × Girth × Girth) / 2304
 */
export const calculateRoundLogInch = (input: RoundLogInput): number => {
  const { girth, length, quantity } = input;
  return ((length * girth * girth) / 2304) * quantity;
};

/**
 * Size-cut (sawn/dimensional) CFT.
 * Standard board formula: (Length(in) × Width(in) × Thickness(in) × Qty) / 144
 */
export const calculateSizeCut = (input: SizeCutInput): number => {
  const { length, width, thickness, quantity } = input;
  return (length * width * thickness * quantity) / 144;
};

/**
 * Central dispatcher — every calculation in the app must go through here.
 * AI / controllers only ever call this function; they never compute CFT
 * themselves, per the module's core design requirement.
 */
export const runRuleEngine = (
  formulaType: RuleFormulaType,
  input: RoundLogInput | SizeCutInput
): number => {
  switch (formulaType) {
    case "round_log_feet":
      return round2(calculateRoundLogFeet(input as RoundLogInput));
    case "round_log_inch":
      return round2(calculateRoundLogInch(input as RoundLogInput));
    case "size_cut":
      return round2(calculateSizeCut(input as SizeCutInput));
    default:
      throw new Error(`Unknown formula type: ${formulaType}`);
  }
};

const round2 = (n: number) => Math.round(n * 100) / 100;