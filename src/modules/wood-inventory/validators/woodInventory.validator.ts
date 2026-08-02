import { z } from "zod";

export const createWoodSchema = z.object({
  body: z.object({
    woodType: z.string().min(1),
    supplier: z.string().optional(),
    purchaseDate: z.coerce.date(),
    purchasePrice: z.number().nonnegative(),
    transportCost: z.number().nonnegative().default(0),
    totalCFT: z.number().nonnegative(),
    availableCFT: z.number().nonnegative(),
    location: z.string().optional(),
    notes: z.string().optional()
  })
});

export const updateWoodSchema = z.object({
  body: createWoodSchema.shape.body.partial()
});
