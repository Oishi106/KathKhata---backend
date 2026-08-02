import { z } from "zod";

export const createExpenseSchema = z.object({
  body: z.object({
    category: z.enum(["salary", "electricity", "transport", "machine_repair", "fuel", "miscellaneous"]),
    amount: z.number().nonnegative(),
    description: z.string().optional(),
    date: z.coerce.date().optional()
  })
});

export const updateExpenseSchema = z.object({
  body: createExpenseSchema.shape.body.partial()
});
