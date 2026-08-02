import { AIProvider, AIProviderContext } from "../aiProvider.interface";

/**
 * MockAIProvider gives rule-based, deterministic responses so the app works
 * out of the box without any API key. Swap AI_PROVIDER=gemini|openai in .env
 * once real credentials are available — no other code needs to change.
 */
export class MockAIProvider implements AIProvider {
  name = "mock";

  async generateReply(
    prompt: string,
    _history: { role: "user" | "assistant"; content: string }[],
    context?: AIProviderContext
  ): Promise<string> {
    const lang = context?.language ?? "bn";
    const greeting =
      lang === "bn"
        ? "আমি আপনার ব্যবসা বিশ্লেষণ করে উত্তর দেওয়ার চেষ্টা করছি।"
        : "I'm analyzing your business data to help answer this.";

    return `${greeting}\n\n(${prompt.slice(0, 120)}...) — Connect a real AI provider (Gemini/OpenAI) in .env to get live, data-grounded answers.`;
  }
}
