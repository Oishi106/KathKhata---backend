import { z } from "zod";

export const askSchema = z.object({
  body: z.object({
    conversationId: z.string().optional(),
    message: z.string().min(1)
  })
});
