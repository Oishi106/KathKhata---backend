import { z } from "zod";

export const createSaleSchema = z.object({
  body: z.object({
    productName: z.string().min(1),
    customerName: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
    costOfGoods: z.number().nonnegative(),
    date: z.coerce.date().optional()
  })
});

export const updateSaleSchema = z.object({
  body: createSaleSchema.shape.body.partial()
});
