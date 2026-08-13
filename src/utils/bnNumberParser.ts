// বাংলা ১-৯৯ প্রতিটা সংখ্যার নিজস্ব শব্দ (ইংরেজির মতো compositional না),
// তাই পুরো তালিকা হার্ডকোড করা হয়েছে। এর সাথে ১০০-৯০০ (একশ-নয়শ) ও গুণক শব্দ (হাজার/লাখ/কোটি)।
const WORD_VALUES: Record<string, number> = {
  শূন্য: 0,
  এক: 1, দুই: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9,
  দশ: 10, এগারো: 11, বারো: 12, তেরো: 13, চৌদ্দ: 14, পনেরো: 15, ষোলো: 16, সতেরো: 17, আঠারো: 18, উনিশ: 19,
  বিশ: 20, একুশ: 21, বাইশ: 22, তেইশ: 23, চব্বিশ: 24, পঁচিশ: 25, ছাব্বিশ: 26, সাতাশ: 27, আটাশ: 28, ঊনত্রিশ: 29,
  ত্রিশ: 30, একত্রিশ: 31, বত্রিশ: 32, তেত্রিশ: 33, চৌত্রিশ: 34, পঁয়ত্রিশ: 35, ছত্রিশ: 36, সাঁইত্রিশ: 37, আটত্রিশ: 38, ঊনচল্লিশ: 39,
  চল্লিশ: 40, একচল্লিশ: 41, বিয়াল্লিশ: 42, তেতাল্লিশ: 43, চুয়াল্লিশ: 44, পঁয়তাল্লিশ: 45, ছেচল্লিশ: 46, সাতচল্লিশ: 47, আটচল্লিশ: 48, ঊনপঞ্চাশ: 49,
  পঞ্চাশ: 50, একান্ন: 51, বায়ান্ন: 52, তিপ্পান্ন: 53, চুয়ান্ন: 54, পঞ্চান্ন: 55, ছাপ্পান্ন: 56, সাতান্ন: 57, আটান্ন: 58, ঊনষাট: 59,
  ষাট: 60, একষট্টি: 61, বাষট্টি: 62, তেষট্টি: 63, চৌষট্টি: 64, পঁয়ষট্টি: 65, ছেষট্টি: 66, সাতষট্টি: 67, আটষট্টি: 68, ঊনসত্তর: 69,
  সত্তর: 70, একাত্তর: 71, বাহাত্তর: 72, তিয়াত্তর: 73, চুয়াত্তর: 74, পঁচাত্তর: 75, ছিয়াত্তর: 76, সাতাত্তর: 77, আটাত্তর: 78, ঊনআশি: 79,
  আশি: 80, একাশি: 81, বিরাশি: 82, তিরাশি: 83, চুরাশি: 84, পঁচাশি: 85, ছিয়াশি: 86, সাতাশি: 87, আটাশি: 88, ঊননব্বই: 89,
  নব্বই: 90, একানব্বই: 91, বিরানব্বই: 92, তিরানব্বই: 93, চুরানব্বই: 94, পঁচানব্বই: 95, ছিয়ানব্বই: 96, সাতানব্বই: 97, আটানব্বই: 98, নিরানব্বই: 99,
  একশ: 100, দুইশ: 200, তিনশ: 300, চারশ: 400, পাঁচশ: 500, ছয়শ: 600, সাতশ: 700, আটশ: 800, নয়শ: 900
};

const SCALE_WORDS: Record<string, number> = {
  হাজার: 1000,
  লাখ: 100000,
  লক্ষ: 100000,
  কোটি: 10000000
};

const BN_DIGIT_MAP: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
};

function toArabicDigits(token: string): string {
  return token.replace(/[০-৯]/g, (d) => BN_DIGIT_MAP[d] ?? d);
}

function isDigitToken(token: string): boolean {
  const cleaned = toArabicDigits(token).replace(/,/g, "");
  return /^\d+(\.\d+)?$/.test(cleaned);
}

function digitTokenValue(token: string): number {
  return parseFloat(toArabicDigits(token).replace(/,/g, ""));
}

function isNumberAtom(token: string): boolean {
  const clean = token.replace(/[,।.]/g, "");
  return clean in WORD_VALUES || clean in SCALE_WORDS || isDigitToken(clean);
}

function atomValue(token: string): { value: number; isScale: boolean } {
  const clean = token.replace(/[,।.]/g, "");
  if (clean in SCALE_WORDS) return { value: SCALE_WORDS[clean], isScale: true };
  if (clean in WORD_VALUES) return { value: WORD_VALUES[clean], isScale: false };
  return { value: digitTokenValue(clean), isScale: false };
}

export interface NumberPhrase {
  value: number;
  startTokenIndex: number;
  endTokenIndex: number; // exclusive
  matchedText: string;
}

/**
 * পুরো বাক্য থেকে সব সংখ্যা-বাক্যাংশ (consecutive number tokens) বের করে,
 * প্রতিটার মান হিসাব করে দেয় (হাজার/লাখ/কোটি গুণক সহ)।
 */
export function findNumberPhrases(text: string): NumberPhrase[] {
  const tokens = text.trim().split(/\s+/);
  const phrases: NumberPhrase[] = [];

  let i = 0;
  while (i < tokens.length) {
    if (!isNumberAtom(tokens[i])) {
      i++;
      continue;
    }
    const start = i;
    let result = 0;
    let current = 0;

    while (i < tokens.length && isNumberAtom(tokens[i])) {
      const { value, isScale } = atomValue(tokens[i]);
      if (isScale) {
        current = (current === 0 ? 1 : current) * value;
        result += current;
        current = 0;
      } else {
        current += value;
      }
      i++;
    }
    result += current;

    phrases.push({
      value: result,
      startTokenIndex: start,
      endTokenIndex: i,
      matchedText: tokens.slice(start, i).join(" ")
    });
  }

  return phrases;
}

export interface NumberFieldKeywordSpec {
  name: string;
  keywords: string[]; // যেমন totalCFT: ["সিএফটি", "ঘনফুট"]
}

/**
 * প্রতিটা numeric ফিল্ডের keyword-এর সবচেয়ে কাছের (word-distance) সংখ্যা-বাক্যাংশ বসিয়ে দেয়।
 * একটা সংখ্যা-বাক্যাংশ একবারই ব্যবহার হয় (দুই ফিল্ডে একই সংখ্যা বসবে না)।
 */
export function extractNumbersByKeywords(
  text: string,
  fieldSpecs: NumberFieldKeywordSpec[]
): Record<string, number | null> {
  const tokens = text.trim().split(/\s+/);
  const phrases = findNumberPhrases(text);
  const used = new Set<number>(); // phrase index ব্যবহৃত হয়েছে কিনা
  const result: Record<string, number | null> = {};

  for (const field of fieldSpecs) {
    let bestPhraseIdx = -1;
    let bestDistance = Infinity;

    for (const keyword of field.keywords) {
      // keyword-টা কোন token index-এ আছে খুঁজি (আংশিক মিলও গ্রহণ করি)
      const keywordTokenIdx = tokens.findIndex((t) => t.includes(keyword));
      if (keywordTokenIdx === -1) continue;

      phrases.forEach((phrase, idx) => {
        if (used.has(idx)) return;
        const distance = Math.min(
          Math.abs(phrase.startTokenIndex - keywordTokenIdx),
          Math.abs(phrase.endTokenIndex - keywordTokenIdx)
        );
        if (distance < bestDistance) {
          bestDistance = distance;
          bestPhraseIdx = idx;
        }
      });
    }

    if (bestPhraseIdx >= 0 && bestDistance <= 6) {
      // ৬ শব্দের মধ্যে থাকলেই grহণযোগ্য মনে করছি, নাহলে ভুল মিলে যাওয়ার ঝুঁকি
      result[field.name] = phrases[bestPhraseIdx].value;
      used.add(bestPhraseIdx);
    } else {
      result[field.name] = null;
    }
  }

  return result;
}