import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    businessName: z.string().optional(),
    avatarUrl: z.string().url().optional(),
    language: z.enum(["bn", "en"]).optional()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(6),
    newPassword: z.string().min(6)
  })
});
