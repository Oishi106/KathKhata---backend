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
  inches: number;
  points: number;
  totalInches: number;
  totalPoints: number;
  totalCm: number;
  totalFeetDecimal: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

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

export const combineToInches = (feet = 0, inches = 0, points = 0): number => {
  return feet * 12 + inches + points / 100;
};

/**
 * CFT (cubic feet) কে "ফুট-ইঞ্চি-পা" style এ ভাঙে —
 * এটা প্রকৃত ইউনিট কনভার্সন না (CFT আয়তন, বাকিগুলো দৈর্ঘ্য),
 * করাতকলের বইয়ের প্রথাগত (base-12) display format অনুসরণ করে।
 *
 * নিয়ম (বইয়ের টেবিল থেকে verify করা):
 * ১) CFT-কে আগে থেকে কোনো round করা হয় না
 * ২) Ft   = floor(CFT)
 * ৩) rem1 = (CFT − Ft) × 12   →   In = floor(rem1)
 * ৪) rem2 = (rem1 − In) × 12  →   Pa = floor(rem2)
 * ৫) প্রতিটা ধাপে round নয়, floor (truncate)। ১ ইঞ্চি = ১২ Pa (base-12, রেঞ্জ ০-১১)
 */
export interface CftBreakdown {
  feet: number;
  inches: number;
  points: number; // 0-11 (base-12 "Pa")
}

export const breakdownCft = (cft: number): CftBreakdown => {
  const sign = cft < 0 ? -1 : 1;
  const abs = Math.abs(cft);

  const feet = Math.floor(abs);
  const rem1 = (abs - feet) * 12;
  const inches = Math.floor(rem1);
  const rem2 = (rem1 - inches) * 12;
  const points = Math.floor(rem2);

  return { feet: sign * feet, inches, points };
};

export const formatCftLine = (cft: number): string => {
  const displayCft = round2(cft);
  const b = breakdownCft(cft);
  const feetPart = b.feet !== 0 ? `${b.feet} ফুট ` : "";
  return `${displayCft.toFixed(2)} সিএফটি (${feetPart}${b.inches} ইঞ্চি ${b.points} পা)`;
};