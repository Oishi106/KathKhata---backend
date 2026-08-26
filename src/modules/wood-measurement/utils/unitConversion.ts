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

/**
 * CFT (cubic feet) কে "ফুট-ইঞ্চি-পয়েন্ট" style এ ভাঙে —
 * এটা প্রকৃত ইউনিট কনভার্সন না (CFT আয়তন, বাকিগুলো দৈর্ঘ্য),
 * শুধু করাতকলের প্রথাগত display format অনুকরণ করে। PDF/স্লিপে
 * CFT ভ্যালুর পাশে readable breakdown দেখানোর জন্য ব্যবহার হয়।
 */
export interface CftBreakdown {
  feet: number;
  inches: number;
  points: number;
}

export const breakdownCft = (cft: number): CftBreakdown => {
  const sign = cft < 0 ? -1 : 1;
  const abs = Math.abs(cft);

  const feet = Math.floor(abs);
  const inchDecimal = (abs - feet) * 12;
  let inches = Math.floor(inchDecimal);
  let points = Math.round((inchDecimal - inches) * 100);

  // rounding overflow (e.g. points === 100) সামলানো
  let finalFeet = feet;
  if (points >= 100) {
    points = 0;
    inches += 1;
  }
  if (inches >= 12) {
    inches = 0;
    finalFeet += 1;
  }

  return { feet: sign * finalFeet, inches, points };
};

/** PDF/স্লিপে সরাসরি বসানোর জন্য রেডি স্ট্রিং — যেমন "0.03 সিএফটি (0 ইঞ্চি 36 পয়েন্ট)" */
export const formatCftLine = (cft: number): string => {
  const b = breakdownCft(cft);
  const feetPart = b.feet !== 0 ? `${b.feet} ফুট ` : "";
  return `${cft.toFixed(2)} সিএফটি (${feetPart}${b.inches} ইঞ্চি ${b.points} পয়েন্ট)`;
};