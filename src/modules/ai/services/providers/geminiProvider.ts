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
      return "AI provider not configured. Please set GEMINI_API_KEY in the environment.";
    }

    const systemContext = context?.businessSummary
      ? `Business context: ${context.businessSummary}\n\n`
      : "";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`;

    const contents = [
      ...history.map((h) => ({ role: h.role === "assistant" ? "model" : "user", parts: [{ text: h.content }] })),
      { role: "user", parts: [{ text: systemContext + prompt }] }
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      logger.error(`Gemini API error: ${response.status} ${await response.text()}`);
      throw new Error("AI provider request failed");
    }

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Sorry, I couldn't generate a response.";
  }
}
