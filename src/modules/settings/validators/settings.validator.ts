import { z } from "zod";

export const updateSettingsSchema = z.object({
  body: z.object({
    businessName: z.string().trim().min(1).optional(),
    logoUrl: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    address: z.string().trim().optional(),
    currency: z.string().trim().optional(),
    currencySymbol: z.string().trim().optional(),
    timezone: z.string().trim().optional(),
    invoicePrefix: z.string().trim().optional(),
    invoiceStartingNumber: z.coerce.number().int().nonnegative().optional(),
    dateFormat: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional()
  })
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>["body"];