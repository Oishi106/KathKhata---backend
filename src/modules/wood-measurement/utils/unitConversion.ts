/**
 * Centralized unit conversion — the ONLY place these ratios are defined.
 * Never duplicate these conversions anywhere else in the app.
 *
 * 1 foot   = 12 inches
 * 1 inch   = 100 points
 * 1 foot   = 1200 points
 * 1 inch   = 2.54 centimeters
 * 1 foot   = 30.48 centimeters
 * 1 point  = 0.01 inch
 */

export interface LengthBreakdown {
  feet: number;
  inches: number; // remaining inches after whole feet
  points: number; // remaining points after whole inches
  totalInches: number;
  totalPoints: number;
  totalCm: number;
  totalFeetDecimal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Convert a raw value + unit into total inches (the internal base unit). */
export const toInches = (value: number, unit: "feet" | "inch" | "cm" | "point"): number => {
  switch (unit) {
    case "feet":
      return value * 12;
    case "inch":
      return value;
    case "cm":
      return value / 2.54;
    case "point":
      return value / 100;
    default:
      return value;
  }
};

/** Break a total-inches value down into feet/inch/point + all common equivalents. */
export const breakdownFromInches = (totalInches: number): LengthBreakdown => {
  const feet = Math.floor(totalInches / 12);
  const remainingInchesDecimal = totalInches - feet * 12;
  const inches = Math.floor(remainingInchesDecimal);
  const points = Math.round((remainingInchesDecimal - inches) * 100);

  return {
    feet,
    inches,
    points,
    totalInches: round2(totalInches),                        
    totalPoints: round2(totalInches * 100),    
    totalCm: round2(totalInches * 2.54),                              
    totalFeetDecimal: round2(totalInches / 12)
  };
};

/** Combine separate feet+inch+point fields (as commonly entered) into total inches. */
export const combineToInches = (feet = 0, inches = 0, points = 0): number => {
  return feet * 12 + inches + points / 100;                             
};