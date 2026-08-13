import { env } from "../../../config/env";
import { logger } from "../../../utils/logger";
import { ApiError } from "../../../utils/ApiError";
import { extractNumbersByKeywords, type NumberFieldKeywordSpec } from "../../../utils/bnNumberParser";

export interface VoiceFieldSpec {
  name: string;
  type: "string" | "number" | "date";
  description: string;
  keywords?: string[]; // শুধু number ফিল্ডের জন্য — regex দিয়ে স্থানীয়ভাবে বের করতে ব্যবহার হয়
}

/**
 * Hybrid parser:
 *  - keyword দেওয়া number ফিল্ড → স্থানীয় regex দিয়ে বের করা হয় (দ্রুত, নির্ভুল, বিনামূল্যে)
 *  - বাকি সব (string/date, বা keyword-ছাড়া number) → AI দিয়ে বের করা হয় (ছোট prompt)
 * regex-এ যা পাওয়া গেছে সেটার জন্য AI-কে জিজ্ঞাসাই করা হয় না — cost ও ভুলের ঝুঁকি দুটোই কমে।
 */
export async function parseVoiceEntry(
  rawText: string,
  fields: VoiceFieldSpec[],
  language: "bn" | "en" = "bn"
): Promise<Record<string, string | number | null>> {
  if (!rawText || !rawText.trim()) {
    throw ApiError.badRequest("কোনো টেক্সট পাওয়া যায়নি");
  }
  if (!fields.length) {
    throw ApiError.badRequest("কোনো ফিল্ড নির্ধারণ করা হয়নি");
  }

  const result: Record<string, string | number | null> = {};
  fields.forEach((f) => (result[f.name] = null));

  // ধাপ ১ — keyword-যুক্ত number ফিল্ড regex দিয়ে বের করা (শুধু বাংলার ক্ষেত্রে)
  const numberFieldsWithKeywords = fields.filter(
    (f) => f.type === "number" && f.keywords && f.keywords.length > 0
  );

  if (numberFieldsWithKeywords.length && language === "bn") {
    const specs: NumberFieldKeywordSpec[] = numberFieldsWithKeywords.map((f) => ({
      name: f.name,
      keywords: f.keywords!
    }));
    const extracted = extractNumbersByKeywords(rawText, specs);
    Object.assign(result, extracted);
  }

  // ধাপ ২ — যা regex-এ পাওয়া যায়নি (এখনো null) সেগুলোই শুধু AI-কে জিজ্ঞাসা করা হবে
  const remainingFields = fields.filter((f) => result[f.name] === null);

  if (!remainingFields.length) {
    return result; // সবকিছু regex দিয়েই মিলে গেছে, AI কল লাগেনি
  }

  if (!env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY not set — skipping AI parse for remaining text fields");
    return result;
  }

  const properties: Record<string, unknown> = {};
  remainingFields.forEach((f) => {
    properties[f.name] = {
      type: f.type === "number" ? "NUMBER" : "STRING",
      description: f.description,
      nullable: true
    };
  });

  const instruction =
    language === "bn"
      ? "আপনি একটা করাতকল/কাঠের ব্যবসার তথ্য এন্ট্রি ফর্মের জন্য বলা বাংলা বাক্য বিশ্লেষণ করে গঠনগত তথ্য বের করবেন।"
      : "You extract structured form-entry data from a spoken sentence for a sawmill business app.";

  const fieldDescriptions = remainingFields.map((f) => `- ${f.name} (${f.type}): ${f.description}`).join("\n");

  const prompt = [
    instruction,
    "নিচের ফিল্ডগুলোর মধ্যে যা যা তথ্য বাক্যে পাওয়া যায় সেগুলো বের করো, যা পাওয়া যায় না সেটা null রাখো।",
    "তারিখ উল্লেখ থাকলে YYYY-MM-DD ফরম্যাটে দাও (আজ/গতকাল বললে বর্তমান তারিখ ধরে হিসাব করো)।",
    "কোনো ব্যাখ্যা দেবে না, শুধু JSON অবজেক্ট ফেরত দেবে।",
    "ফিল্ডসমূহ:",
    fieldDescriptions,
    `বাক্য: "${rawText}"`
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: { type: "OBJECT", properties }
        }
      })
    });

    if (!response.ok) {
      logger.error(`Gemini voice-parse error: ${response.status} ${await response.text()}`);
      return result; // regex দিয়ে যা পাওয়া গেছে সেটা অন্তত ফেরত দিই
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (jsonText) {
      const parsed = JSON.parse(jsonText);
      Object.assign(result, parsed);
    }
  } catch (err) {
    logger.error(`Voice AI parse failed: ${String(err)}`);
  }

  return result;
}