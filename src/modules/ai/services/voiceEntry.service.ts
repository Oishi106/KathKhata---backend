import { env } from "../../../config/env";
import { logger } from "../../../utils/logger";
import { ApiError } from "../../../utils/ApiError";

export interface VoiceFieldSpec {
  name: string;               // JSON key, যেমন "woodType"
  type: "string" | "number" | "date";
  description: string;        // AI-কে বোঝানোর জন্য, যেমন "কাঠের ধরন (যেমন গামারি, মেহগনি)"
}

/**
 * generic voice → structured-JSON parser।
 * প্রতিটা ফর্ম (purchase/supplier/customer/employee/...) নিজের fieldSpecs পাঠাবে,
 * backend সেই অনুযায়ী Gemini-কে prompt বানিয়ে JSON বের করে দেবে।
 * GEMINI_API_KEY না থাকলে সব ফিল্ড null রেখে শুধু raw text notes/description-জাতীয়
 * ফিল্ডে (যদি থাকে) বসিয়ে ফেরত দেয়।
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

  const emptyResult: Record<string, string | number | null> = {};
  fields.forEach((f) => (emptyResult[f.name] = null));

  if (!env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY not set — voice entry returning empty structured result");
    return emptyResult;
  }

  const properties: Record<string, unknown> = {};
  fields.forEach((f) => {
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

  const fieldDescriptions = fields.map((f) => `- ${f.name} (${f.type}): ${f.description}`).join("\n");

  const prompt = [
    instruction,
    "নিচের ফিল্ডগুলোর মধ্যে যা যা তথ্য বাক্যে পাওয়া যায় সেগুলো বের করো, যা পাওয়া যায় না সেটা null রাখো।",
    "টাকার অংক বাংলা শব্দ থেকে সংখ্যায় রূপান্তর করো (যেমন 'পঞ্চাশ হাজার' = 50000)।",
    "তারিখ উল্লেখ থাকলে YYYY-MM-DD ফরম্যাটে দাও (আজ/গতকাল বললে বর্তমান তারিখ ধরে হিসাব করো)।",
    "কোনো ব্যাখ্যা দেবে না, শুধু JSON অবজেক্ট ফেরত দেবে।",
    "ফিল্ডসমূহ:",
    fieldDescriptions,
    `বাক্য: "${rawText}"`
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.GEMINI_API_KEY}`;

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
    throw ApiError.internal("AI দিয়ে বাক্য বিশ্লেষণ করা যায়নি");
  }

  const data = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };

  const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!jsonText) return emptyResult;

  try {
    const parsed = JSON.parse(jsonText);
    return { ...emptyResult, ...parsed };
  } catch {
    logger.error(`Failed to parse Gemini JSON response: ${jsonText}`);
    return emptyResult;
  }
}