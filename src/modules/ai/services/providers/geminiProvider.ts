import { env } from "../../../../config/env";
import { AIProvider, AIProviderContext } from "../aiProvider.interface";
import { logger } from "../../../../utils/logger";

/**
 * GeminiAIProvider — thin wrapper around Google's Generative Language API.
 * Fill in GEMINI_API_KEY in .env to activate. Kept dependency-free (fetch)
 * so it doesn't force an SDK choice on the team.
 */
export class GeminiAIProvider implements AIProvider {
  name = "gemini";

  async generateReply(
    prompt: string,
    history: { role: "user" | "assistant"; content: string }[],
    context?: AIProviderContext
  ): Promise<string> {
    if (!env.GEMINI_API_KEY) {
      logger.warn("GEMINI_API_KEY not set — falling back to generic response");
      return "AI প্রোভাইডার এখনো কনফিগার করা হয়নি। অনুগ্রহ করে .env ফাইলে GEMINI_API_KEY বসান।";
    }

    const language = context?.language === "en" ? "English" : "Bengali (বাংলা)";

    const systemInstruction = [
      "You are KathKhata AI, a friendly business assistant for a sawmill (কাঠখাতা/করাতকল) owner in Bangladesh.",
      "Always reply in " + language + ", in short, clear, practical sentences.",
      "Use the business data below to ground your answers in real numbers whenever relevant.",
      context?.businessSummary ? `Business snapshot: ${context.businessSummary}` : ""
    ]
      .filter(Boolean)
      .join(" ");

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    // `history` already includes the current user turn as its last item
    // (pushed by ai.service.ts before calling the provider), so we send
    // history as-is and do NOT append `prompt` again to avoid duplication.
    const contents = history.map((h) => ({
      role: h.role === "assistant" ? "model" : "user",
      parts: [{ text: h.content }]
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: { temperature: 0.6, maxOutputTokens: 512 }
      })
    });

    if (!response.ok) {
      logger.error(`Gemini API error: ${response.status} ${await response.text()}`);
      throw new Error("AI provider request failed");
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "দুঃখিত, এই মুহূর্তে উত্তর তৈরি করা যায়নি। আবার চেষ্টা করুন।"
    );
  }
}