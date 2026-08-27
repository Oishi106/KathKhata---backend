/**
 * Deterministic Bangla measurement-speech parser.
 *
 * Per spec: the AI/parser's ONLY responsibility is understanding speech and
 * extracting structured data — it NEVER calculates CFT itself. All results
 * of this parser are handed to the Calculation/Rule Engine, same as manual
 * input.
 *
 * Girth speech rule:
 *   "<length> ফুট <girth tokens>" — the girth tokens right after ফুট are
 *   read WITHIN the boundary up to the next "ফুট" occurrence (never
 *   crossing into the next measurement/row). Two forms are handled:
 *
 *   1) Compound two-digit number (browser ASR often merges spoken
 *      "এক এক" into the single token "11", "২২" stays "22", etc.):
 *      if the token is exactly two digits (or a word-number 10-99, e.g.
 *      "এগারো"), split its digits: tens digit = girth-feet,
 *      units digit = girth-inch. "১১" → 1 ft 1 in. "৩১" → 3 ft 1 in.
 *
 *   2) Two separate single-digit tokens (when ASR keeps them apart,
 *      e.g. "শূন্য নয়"): first = girth-feet, second = girth-inch.
 *      "সাত ফুট শূন্য নয়" → girth 0 ft 9 in (= 9 inches).
 *
 *   Either way the result is stored as a single total-inches value in
 *   ParsedRow.girthInch (matches the "পরিধি(in)" column in the review
 *   modal), since that's the unit the calculation engine expects.
 *
 * Segment-break rule:
 *   "এরপর"/"তারপর" is a HARD boundary — the parser never reads a girth
 *   or quantity number past this word into the next measurement, even
 *   if no "ফুট" has appeared yet after it.
 *
 * Correction handling:
 *   If the speaker corrects themselves — "না এটা তিন ফুট এক তিন হবে" —
 *   the measurement stated right after the correction trigger REPLACES
 *   the most recently parsed row in that customer block.
 *   IMPORTANT LIMITATION: this only works if the correction word ("না"/
 *   "ভুল"/"নাহ") actually appears in the recognized transcript. Browser
 *   speech recognition sometimes drops short interjection words — if
 *   "না" isn't in the transcript text, no parser can recover the intent
 *   from text alone. Always check the transcript box before pressing
 *   "মাপ বুঝুন".
 *
 * Noise filtering:
 *   Every number is only read relative to a recognized keyword (ফুট,
 *   টা/টি, পরিধি, ইঞ্চি) and bounded so it never crosses into the next
 *   measurement — unrelated surrounding chatter with no anchoring
 *   keyword is never parsed into a number.
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
 * Reads girth right after "ফুট", bounded so it NEVER crosses into the
 * next "ফুট" occurrence OR the next "এরপর"/"তারপর" segment-break (fixes
 * the row-bleeding bug). Handles both a compound two-digit token
 * (ASR-merged "এক এক" → "11") and two separate single-digit tokens.
 * Returns total inches, or null if no girth-like number is found in the
 * bounded window.
 */
const readGirthAfterFeet = (
  fullText: string,
  startIdx: number,
  boundaryIdx: number
): number | null => {
  const window = fullText.slice(startIdx, boundaryIdx);
  let cursor = 0;

  const readNextToken = (): { raw: string; val: number; end: number } | null => {
    const rest = window.slice(cursor).replace(/^[\s,।]+/, "");
    const skipped = window.slice(cursor).length - rest.length;
    const m = rest.match(NUMBER_TOKEN_RE);
    if (!m) return null;
    const val = wordToNumber(m[1]);
    if (val === null) return null;
    return { raw: m[1], val, end: cursor + skipped + m[1].length };
  };

  const t1 = readNextToken();
  if (!t1) return null;

  // Compound two-digit number (either a literal 2-char digit string, or
  // a word-number 10-99, e.g. "এগারো") → split into girth-ft / girth-in.
  const isCompound = /^\d{2}$/.test(t1.raw) || (t1.val >= 10 && t1.val <= 99);
  if (isCompound) {
    const ft = Math.floor(t1.val / 10);
    const inch = t1.val % 10;
    return ft * 12 + inch;
  }

  // Single-digit girth-ft — look for a second token as girth-in, still
  // within the same bounded window.
  cursor = t1.end;
  const t2 = readNextToken();
  if (!t2) return t1.val * 12; // only the feet part was spoken

  return t1.val * 12 + t2.val;
};

const CUSTOMER_START_RE = /([\u0980-\u09FF]+?)(?:এর)?\s*(কার্ড|কাঠ|কাট|হিসাব)/g;
const CUSTOMER_END_RE = /([\u0980-\u09FF]+?)\s*শেষ/g;
const FEET_RE = /ফুট|ফিট/g;
const INCH_RE = /ইঞ্চি/g;
const GIRTH_RE = /বেয়ার|বেড়|পরিধি/g;
const RATE_RE = /(প্রতি\s*সেফটি|প্রতি\s*সিএফটি)[^\d০-৯]*(\d+|[০-৯]+)/;
/** Segment-break — "এরপর"/"তারপর" is a hard boundary that a girth/qty read never crosses. */
const SEGMENT_BREAK_RE = /এরপর|তারপর/g;
/** Correction trigger — only fires if "না"/"ভুল"/"নাহ" is actually present in the recognized text (see limitation note above). */
const CORRECTION_RE = /(না|ভুল|নাহ)(?:[,।]|\s)+(?:এটা|এইটা)?\s*/g;

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

    const correctionPositions = [...segmentText.matchAll(CORRECTION_RE)].map(
      (m) => (m.index ?? 0) + m[0].length
    );

    // "এরপর"/"তারপর" শব্দের অবস্থান — এগুলো কখনো পার হয়ে girth/qty পড়া হবে না
    const breakPositions = [...segmentText.matchAll(SEGMENT_BREAK_RE)].map((m) => m.index ?? 0);
    const nextBreakAfter = (pos: number): number => {
      const found = breakPositions.find((bp) => bp > pos);
      return found ?? segmentText.length;
    };

    const feetMatches = [...segmentText.matchAll(FEET_RE)];
    for (let fi = 0; fi < feetMatches.length; fi++) {
      const fm = feetMatches[fi];
      const feetIdx = fm.index ?? 0;
      const feetVal = extractNumberNear(segmentText, feetIdx);
      if (feetVal === null) continue;

      const afterFeetIdx = feetIdx + fm[0].length;
      // Never read past the NEXT "ফুট" or the next "এরপর"/"তারপর" —
      // this is what stops row-bleeding.
      const nextFeetBoundary = fi + 1 < feetMatches.length ? (feetMatches[fi + 1].index ?? segmentText.length) : segmentText.length;
      const boundaryIdx = Math.min(nextFeetBoundary, nextBreakAfter(afterFeetIdx));

      let girthVal = readGirthAfterFeet(segmentText, afterFeetIdx, boundaryIdx);
      let inchVal: number | null = null;

      if (girthVal === null) {
        // Fallback: explicit "ইঞ্চি" / "পরিধি" keyword phrasing, still bounded.
        const afterFeet = segmentText.slice(feetIdx, boundaryIdx);
        const inchMatch = afterFeet.match(INCH_RE);
        if (inchMatch && inchMatch.index !== undefined) {
          inchVal = extractNumberNear(afterFeet, inchMatch.index);
        }
        const girthMatch = afterFeet.match(GIRTH_RE);
        if (girthMatch && girthMatch.index !== undefined) {
          girthVal = extractNumberNear(afterFeet, girthMatch.index);
        }
      }

      const qtyWindow = segmentText.slice(feetIdx, boundaryIdx);
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