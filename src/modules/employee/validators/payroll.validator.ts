import { z } from "zod";

export const generatePayrollSchema = z.object({
  body: z.object({
    employee: z.string({ required_error: "কর্মচারী নির্বাচন করুন" }).min(1),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000)
  })
});

export const payrollIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const adjustPayrollSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    manualAdjustment: z.coerce.number(),
    manualAdjustmentNote: z.string().trim().optional()
  })
});

export type GeneratePayrollInput = z.infer<typeof generatePayrollSchema>["body"];
export type AdjustPayrollInput = z.infer<typeof adjustPayrollSchema>["body"];