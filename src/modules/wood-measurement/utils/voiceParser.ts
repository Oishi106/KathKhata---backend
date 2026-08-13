/**
 * Deterministic Bangla measurement-speech parser.
 *
 * Per spec: the AI/parser's ONLY responsibility is understanding speech and
 * extracting structured data — it NEVER calculates CFT itself. All results
 * of this parser are handed to the Calculation/Rule Engine, same as manual
 * input.
 *
 * Local sawmill vocabulary mapping (voice-only, never shown as UI labels):
 *   আড়ে, আরে, লম্বা, দৈর্ঘ্য  → length
 *   বেয়ার, বেড়              → girth (round log) / width (size cut)
 */

export interface ParsedRow {
  lengthFeet?: number;
  lengthInch?: number;
  girthInch?: number;
  quantity: number;
  raw: string;
}

export interface ParsedCustomerBlock {
  customerName: string;
  rows: ParsedRow[];
}

export interface ParseResult {
  blocks: ParsedCustomerBlock[];
  ratePerCFT?: number;
  warnings: string[];
}

const numberWords: Record<string, number> = {
  "শূন্য": 0, "এক": 1, "দুই": 2, "দুটো": 2, "দুইটা": 2, "দুইটি": 2,
  "তিন": 3, "চার": 4, "পাঁচ": 5, "ছয়": 6, "সাত": 7, "আট": 8, "নয়": 9,
  "দশ": 10, "এগারো": 11, "বারো": 12, "তেরো": 13, "চৌদ্দ": 14, "পনেরো": 15,
  "ষোল": 16, "সতেরো": 17, "আঠারো": 18, "উনিশ": 19, "বিশ": 20
};

const bengaliDigits: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
};

const normalizeDigits = (text: string): string =>
  text.replace(/[০-৯]/g, (d) => bengaliDigits[d] ?? d);

/** Extract the next number (digit or Bangla word) starting at/after a position in text. */
const extractNumberNear = (text: string, keywordIndex: number, windowBefore = 15): number | null => {
  const window = text.slice(Math.max(0, keywordIndex - windowBefore), keywordIndex);
  const digitMatch = window.match(/(\d+(\.\d+)?)\s*$/);
  if (digitMatch) return Number(digitMatch[1]);

  for (const [word, val] of Object.entries(numberWords)) {
    if (window.includes(word)) return val;
  }
  return null;
};

const CUSTOMER_START_RE = /([\u0980-\u09FF]+?)(?:এর)?\s*(কার্ড|কাঠ|হিসাব)/g;
const CUSTOMER_END_RE = /([\u0980-\u09FF]+?)\s*শেষ/g;
const FEET_RE = /ফুট|ফিট/g;
const INCH_RE = /ইঞ্চি/g;
const GIRTH_RE = /বেয়ার|বেড়|পরিধি/g;
const RATE_RE = /(প্রতি\s*সেফটি|প্রতি\s*সিএফটি)[^\d০-৯]*(\d+|[০-৯]+)/;

/**
 * Parses a Bangla transcript into structured customer blocks with
 * measurement rows. Deterministic, rule-based — no hallucination risk.
 */
export const parseVoiceTranscript = (rawText: string): ParseResult => {
  const text = normalizeDigits(rawText.trim());
  const warnings: string[] = [];
  const blocks: ParsedCustomerBlock[] = [];

  let currentCustomer: string | null = null;
  let currentBlock: ParsedCustomerBlock | null = null;

  const startMatches = [...text.matchAll(CUSTOMER_START_RE)];
  const endMatches = [...text.matchAll(CUSTOMER_END_RE)];

  const events: { pos: number; type: "start" | "end"; name: string }[] = [
    ...startMatches.map((m) => ({ pos: m.index ?? 0, type: "start" as const, name: m[1] })),
    ...endMatches.map((m) => ({ pos: m.index ?? 0, type: "end" as const, name: m[1] }))
  ].sort((a, b) => a.pos - b.pos);

  if (events.length === 0) {
    warnings.push("কোনো গ্রাহকের নাম শনাক্ত করা যায়নি — 'রহিমের কার্ড' এভাবে বলুন।");
    return { blocks: [], warnings };
  }

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    const segmentEnd = i + 1 < events.length ? events[i + 1].pos : text.length;
    const segmentText = text.slice(ev.pos, segmentEnd);

    if (ev.type === "start") {
      currentCustomer = ev.name;
      currentBlock = blocks.find((b) => b.customerName === currentCustomer) ?? {
        customerName: currentCustomer,
        rows: []
      };
      if (!blocks.includes(currentBlock)) blocks.push(currentBlock);
    } else if (ev.type === "end") {
      currentCustomer = null;
      currentBlock = null;
      continue;
    }

    if (!currentBlock) continue;

    const feetMatches = [...segmentText.matchAll(FEET_RE)];
    for (const fm of feetMatches) {
      const feetIdx = fm.index ?? 0;
      const feetVal = extractNumberNear(segmentText, feetIdx);
      if (feetVal === null) continue;

      const afterFeet = segmentText.slice(feetIdx, feetIdx + 20);
      const inchMatch = afterFeet.match(INCH_RE);
      let inchVal: number | null = null;
      if (inchMatch && inchMatch.index !== undefined) {
        inchVal = extractNumberNear(afterFeet, inchMatch.index);
      }

      const girthMatch = segmentText.slice(feetIdx, feetIdx + 40).match(GIRTH_RE);
      let girthVal: number | null = null;
      if (girthMatch && girthMatch.index !== undefined) {
        girthVal = extractNumberNear(segmentText.slice(feetIdx, feetIdx + 40), girthMatch.index);
      }

      const qtyWindow = segmentText.slice(feetIdx, feetIdx + 60);
      const qtyMatch = qtyWindow.match(/(\d+|[\u0980-\u09FF]+)\s*(টা|টি)/);
      let quantity = 1;
      if (qtyMatch) {
        const qNum = Number(qtyMatch[1]);
        quantity = !isNaN(qNum) ? qNum : numberWords[qtyMatch[1]] ?? 1;
      }

      currentBlock.rows.push({
        lengthFeet: feetVal,
        lengthInch: inchVal ?? undefined,
        girthInch: girthVal ?? undefined,
        quantity,
        raw: qtyWindow.trim()
      });
    }
  }

  const rateMatch = text.match(RATE_RE);
  const ratePerCFT = rateMatch ? Number(rateMatch[2]) : undefined;

  if (blocks.every((b) => b.rows.length === 0)) {
    warnings.push("কোনো মাপ শনাক্ত করা যায়নি। উদাহরণ: 'দশ ফুট ছয় ইঞ্চির কাঠ দুইটা'");
  }

  return { blocks, ratePerCFT, warnings };
};