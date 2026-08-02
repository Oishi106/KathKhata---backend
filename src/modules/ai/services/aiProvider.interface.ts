export interface AIProviderContext {
  businessSummary?: string;
  language?: "bn" | "en";
}

export interface AIProvider {
  name: string;
  generateReply(prompt: string, history: { role: "user" | "assistant"; content: string }[], context?: AIProviderContext): Promise<string>;
}
