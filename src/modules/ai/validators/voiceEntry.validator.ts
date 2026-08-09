import { z } from "zod";

export const voiceParseSchema = z.object({
  body: z.object({
    text: z.string({ required_error: "টেক্সট প্রয়োজন" }).trim().min(1),
    language: z.enum(["bn", "en"]).optional().default("bn"),
    fields: z
      .array(
        z.object({
          name: z.string().trim().min(1),
          type: z.enum(["string", "number", "date"]),
          description: z.string().trim().min(1)
        })
      )
      .min(1, "অন্তত একটা ফিল্ড লাগবে")
  })
});

export type VoiceParseInput = z.infer<typeof voiceParseSchema>["body"];