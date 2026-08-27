/**
 * Deterministic Bangla measurement-speech parser.
 *
 * Per spec: the AI/parser's ONLY responsibility is understanding speech and
 * extracting structured data — it NEVER calculates CFT itself. All results
 * of this parser are handed to the Calculation/Rule Engine, same as manual
 * input.
 *
 * Girth speech rule:
 *   "<length> ফুট <A> <B>" → length = <length> ft,
 *   girth = <A> ft <B> in (either can be "শূন্য"/0; e.g. "সাত ফুট শূন্য নয়"
 *   → length 7 ft, girth 0 ft 9 in — i.e. just 9 inches).
 *   The word "পরিধি/বেয়ার/বেড়" can also explicitly tag a single girth-inch
 *   value if the speaker prefers that style — kept as a fallback.
 *
 * Correction handling:
 *   If the speaker corrects themselves mid-sentence — "না এটা তিন ফুট এক
 *   তিন হবে" / "ভুল, ৫ ফুট দুই এক" — the measurement stated right after
 *   the correction word REPLACES the most recently parsed row in that
 *   customer block, instead of being added as a new row.
 *
 * Noise filtering:
 *   Only text anchored to recognized keywords (customer name markers,
 *   ফুট/ইঞ্চি, টা/টি quantity, correction words) is used. Any other
 *   surrounding chatter (unrelated words picked up by the mic) is never
 *   parsed into a number — unanchored words are simply ignored by design,
 *   since every number extraction requires a nearby keyword.
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
  "ষোল": 16, "সতেরো": 17, "আঠারো": 18, "উনিশ": 19, "বিশ": 20,
  "একুশ": 21, "বাইশ": 22, "তেইশ": 23, "চব্বিশ": 24, "পঁচিশ": 25,
  "ছাব্বিশ": 26, "সাতাশ": 27, "আটাশ": 28, "ঊনত্রিশ": 29, "ত্রিশ": 30
};

const bengaliDigits: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9"
};

const normalizeDigits = (text: string): string =>
  text.replace(/[০-৯]/g, (d) => bengaliDigits[d] ?? d);

/** Matches one number token (digit string or a recognized Bangla number word) at the start of a string. */
const NUMBER_TOKEN_RE = new RegExp(
  `^(\\d+(?:\\.\\d+)?|${Object.keys(numberWords).sort((a, b) => b.length - a.length).join("|")})`
);

const wordToNumber = (token: string): number | null => {
  if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
  return token in numberWords ? numberWords[token] : null;
};

/** Extract the next number (digit or Bangla word) starting at/after a position in text — used for keyword-anchored lookups only (noise filter). */
const extractNumberNear = (text: string, keywordIndex: number, windowBefore = 15): number | null => {
  const window = text.slice(Math.max(0, keywordIndex - windowBefore), keywordIndex);
  const digitMatch = window.match(/(\d+(\.\d+)?)\s*$/);
  if (digitMatch) return Number(digitMatch[1]);

  for (const [word, val] of Object.entries(numberWords)) {
    if (window.includes(word)) return val;
  }
  return null;
};

/**
 * Reads two consecutive number tokens immediately after a starting index
 * (skipping whitespace/commas) — used to capture "<A> <B>" as girth ft+in
 * right after "<length> ফুট". Returns null if fewer than 2 tokens found
 * before hitting a non-number word (which means the pattern doesn't apply,
 * e.g. explicit "পরিধি ৯ ইঞ্চি" phrasing instead).
 */
const readTwoNumbersAfter = (text: string, fromIndex: number): { a: number; b: number; consumedTo: number } | null => {
  let cursor = fromIndex;
  const tokens: { val: number; end: number }[] = [];

  for (let i = 0; i < 2; i++) {
    const rest = text.slice(cursor).replace(/^[\s,।]+/, "");
    const skipped = text.slice(cursor).length - rest.length;
    const m = rest.match(NUMBER_TOKEN_RE);
    if (!m) break;
    const val = wordToNumber(m[1]);
    if (val === null) break;
    const consumedLen = skipped + m[1].length;
    cursor = cursor + consumedLen;
    tokens.push({ val, end: cursor });
  }

  if (tokens.length < 2) return null;
  return { a: tokens[0].val, b: tokens[1].val, consumedTo: tokens[1].end };
};

const CUSTOMER_START_RE = /([\u0980-\u09FF]+?)(?:এর)?\s*(কার্ড|কাঠ|হিসাব)/g;
const CUSTOMER_END_RE = /([\u0980-\u09FF]+?)\s*শেষ/g;
const FEET_RE = /ফুট|ফিট/g;
const INCH_RE = /ইঞ্চি/g;
const GIRTH_RE = /বেয়ার|বেড়|পরিধি/g;
const RATE_RE = /(প্রতি\s*সেফটি|প্রতি\s*সিএফটি)[^\d০-৯]*(\d+|[০-৯]+)/;
/** Correction trigger — "না", "ভুল", "নাহ" — optionally followed by "এটা/এইটা" — signals the NEXT measurement replaces the LAST parsed one. */
const CORRECTION_RE = /(না|ভুল|নাহ)(?:[,।]|\s)+(?:এটা|এইটা)?\s*/g;

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
    warnings.push("কোনো গ্রাহকের নাম শনাক্ত করা যায়নি — 'রহিমের কাঠ' এভাবে বলুন।");
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

    // Mark correction-trigger positions in this segment — any row whose
    // "ফুট" keyword falls right after one of these positions replaces the
    // previous row instead of appending.
    const correctionPositions = [...segmentText.matchAll(CORRECTION_RE)].map(
      (m) => (m.index ?? 0) + m[0].length
    );

    const feetMatches = [...segmentText.matchAll(FEET_RE)];
    for (const fm of feetMatches) {
      const feetIdx = fm.index ?? 0;
      const feetVal = extractNumberNear(segmentText, feetIdx);
      if (feetVal === null) continue;

      // Try the primary rule first: two number tokens right after "ফুট"
      // become girth-feet + girth-inch (e.g. "৬ ফুট এক এক" → girth 1ft 1in;
      // "৭ ফুট শূন্য নয়" → girth 0ft 9in i.e. just 9 inches).
      const afterFeetIdx = feetIdx + fm[0].length;
      const twoNums = readTwoNumbersAfter(segmentText, afterFeetIdx);

      let girthVal: number | null = null;
      let inchVal: number | null = null;

      if (twoNums) {
        // girth feet + girth inch → combine to a single inch total for storage
        girthVal = twoNums.a * 12 + twoNums.b;
      } else {
        // Fallback: explicit "ইঞ্চি" / "পরিধি" keyword phrasing
        const afterFeet = segmentText.slice(feetIdx, feetIdx + 20);
        const inchMatch = afterFeet.match(INCH_RE);
        if (inchMatch && inchMatch.index !== undefined) {
          inchVal = extractNumberNear(afterFeet, inchMatch.index);
        }
        const girthMatch = segmentText.slice(feetIdx, feetIdx + 40).match(GIRTH_RE);
        if (girthMatch && girthMatch.index !== undefined) {
          girthVal = extractNumberNear(segmentText.slice(feetIdx, feetIdx + 40), girthMatch.index);
        }
      }

      const qtyWindow = segmentText.slice(feetIdx, feetIdx + 60);
      const qtyMatch = qtyWindow.match(/(\d+|[\u0980-\u09FF]+)\s*(টা|টি)/);
      let quantity = 1;
      if (qtyMatch) {
        const qNum = Number(qtyMatch[1]);
        quantity = !isNaN(qNum) ? qNum : numberWords[qtyMatch[1]] ?? 1;
      }

      const newRow: ParsedRow = {
        lengthFeet: feetVal,
        lengthInch: inchVal ?? undefined,
        girthInch: girthVal ?? undefined,
        quantity,
        raw: qtyWindow.trim()
      };

      // Was this measurement preceded by a correction trigger ("না এটা...")?
      // If so, replace the last row instead of adding a new one.
      const isCorrection = correctionPositions.some((cp) => feetIdx >= cp && feetIdx - cp < 15);
      if (isCorrection && currentBlock.rows.length > 0) {
        currentBlock.rows[currentBlock.rows.length - 1] = newRow;
      } else {
        currentBlock.rows.push(newRow);
      }
    }
  }

  const rateMatch = text.match(RATE_RE);
  const ratePerCFT = rateMatch ? Number(rateMatch[2]) : undefined;

  if (blocks.every((b) => b.rows.length === 0)) {
    warnings.push("কোনো মাপ শনাক্ত করা যায়নি। উদাহরণ: 'দশ ফুট ছয় ইঞ্চির কাঠ দুইটা'");
  }

  return { blocks, ratePerCFT, warnings };
};