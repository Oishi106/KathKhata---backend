import { z } from "zod";

export const createSupplierSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    companyName: z.string().optional(),
    phone: z.string().min(6),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["active", "inactive"]).optional()
  })
});

export const updateSupplierSchema = z.object({
  body: createSupplierSchema.shape.body.partial()
});

export const addPaymentSchema = z.object({
  body: z.object({
    amount: z.number().positive(),
    date: z.coerce.date().optional(),
    method: z.string().optional(),
    note: z.string().optional()
  })
});