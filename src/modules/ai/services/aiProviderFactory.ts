import { env } from "../../../config/env";
import { AIProvider } from "./aiProvider.interface";
import { MockAIProvider } from "./providers/mockProvider";
import { GeminiAIProvider } from "./providers/geminiProvider";

/**
 * Factory keeps the rest of the app decoupled from any specific AI vendor.
 * Add a new provider by implementing AIProvider and registering it here —
 * no changes needed anywhere else (controllers/services stay the same).
 */
export const getAIProvider = (): AIProvider => {
  switch (env.AI_PROVIDER) {
    case "gemini":
      return new GeminiAIProvider();
    case "openai":
      // TODO: implement OpenAIProvider following the same AIProvider interface
      return new MockAIProvider();
    default:
      return new MockAIProvider();
  }
};
