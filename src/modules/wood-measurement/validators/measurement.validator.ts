import { z } from "zod";

export const startMeasurementSchema = z.object({
  body: z.object({
    customerName: z.string().min(1),
    operator: z.string().optional(),
    ratePerCFT: z.number().nonnegative().optional()
  })
});

const roundLogItemSchema = z.object({
  mode: z.literal("round_log"),
  girth: z.number().positive(),
  girthUnit: z.enum(["feet", "inch"]),
  length: z.number().positive(),
  quantity: z.number().int().positive()
});

const sizeCutItemSchema = z.object({
  mode: z.literal("size_cut"),
  length: z.number().positive(),
  width: z.number().positive(),
  thickness: z.number().positive(),
  quantity: z.number().int().positive()
});

export const addItemSchema = z.object({
  body: z.union([roundLogItemSchema, sizeCutItemSchema])
});

export const closeMeasurementSchema = z.object({
  body: z.object({
    ratePerCFT: z.number().nonnegative(),
    paidAmount: z.number().nonnegative().default(0)
  })
});

export const createRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    region: z.string().optional(),
    formulaType: z.enum(["round_log_feet", "round_log_inch", "size_cut"]),
    unit: z.enum(["feet", "inch", "mixed"]).optional(),
    description: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional()
  })
});