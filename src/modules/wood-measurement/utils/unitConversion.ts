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
 * CFT (cubic feet) কে "ফুট-ইঞ্চি-পয়েন্ট" style এ ভাঙে —
 * এটা প্রকৃত ইউনিট কনভার্সন না (CFT আয়তন, বাকিগুলো দৈর্ঘ্য),
 * শুধু করাতকলের প্রথাগত display format অনুকরণ করে।
 *
 * নিয়ম:
 * ১) CFT আগে ২ decimal-এ round হবে
 * ২) rounded CFT × 12 = total inch (decimal)
 * ৩) সেটা ১ decimal-এ round হবে
 * ৪) পূর্ণ অংশ = ইঞ্চি, দশমিকের অংক (০-৯) = পয়েন্ট
 */
export interface CftBreakdown {
  feet: number;
  inches: number;
  points: number; // single digit 0-9
}

export const breakdownCft = (cft: number): CftBreakdown => {
  const sign = cft < 0 ? -1 : 1;
  const abs = Math.abs(cft);

  const roundedCft = Math.round(abs * 100) / 100;
  const totalInchesRaw = roundedCft * 12;
  const totalInchesRounded = Math.round(totalInchesRaw * 10) / 10;

  let feet = Math.floor(totalInchesRounded / 12);
  const remainingInches = totalInchesRounded - feet * 12;
  let inches = Math.floor(remainingInches);
  let point = Math.round((remainingInches - inches) * 10);

  if (point >= 10) {
    point = 0;
    inches += 1;
  }
  if (inches >= 12) {
    inches = 0;
    feet += 1;
  }

  return { feet: sign * feet, inches, points: point };
};

export const formatCftLine = (cft: number): string => {
  const roundedCft = (Math.round(Math.abs(cft) * 100) / 100) * (cft < 0 ? -1 : 1);
  const b = breakdownCft(cft);
  const feetPart = b.feet !== 0 ? `${b.feet} ফুট ` : "";
  return `${roundedCft.toFixed(2)} সিএফটি (${feetPart}${b.inches} ইঞ্চি ${b.points} পয়েন্ট)`;
};