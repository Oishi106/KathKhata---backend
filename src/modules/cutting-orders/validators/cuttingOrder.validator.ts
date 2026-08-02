import { z } from "zod";

export const createOrderSchema = z.object({
  body: z.object({
    customerName: z.string().min(1),
    customerPhone: z.string().optional(),
    woodType: z.string().min(1),
    length: z.number().positive(),
    width: z.number().positive(),
    thickness: z.number().positive(),
    quantity: z.number().int().positive(),
    ratePerCFT: z.number().nonnegative(),
    notes: z.string().optional()
  })
});

export const updateOrderSchema = z.object({
  body: createOrderSchema.shape.body.partial()
});

export const updateStatusSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "in_progress", "completed", "cancelled"])
  })
});

export const previewCFTSchema = z.object({
  body: z.object({
    length: z.number().positive(),
    width: z.number().positive(),
    thickness: z.number().positive(),
    quantity: z.number().int().positive(),
    ratePerCFT: z.number().nonnegative()
  })
});
