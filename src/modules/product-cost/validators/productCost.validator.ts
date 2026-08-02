import { z } from "zod";

export const calculateSchema = z.object({
  body: z.object({
    woodCost: z.number().nonnegative(),
    laborCost: z.number().nonnegative(),
    machineCost: z.number().nonnegative(),
    electricity: z.number().nonnegative(),
    polish: z.number().nonnegative(),
    packaging: z.number().nonnegative(),
    transport: z.number().nonnegative(),
    desiredMarginPercent: z.number().min(0).max(90).optional()
  })
});
