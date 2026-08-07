import { z } from "zod";

export const createCustomerSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "গ্রাহকের নাম লিখুন" }).trim().min(1),
    phone: z.string({ required_error: "ফোন নম্বর লিখুন" }).trim().min(1),
    email: z.string().trim().email().optional().or(z.literal("")),
    address: z.string().trim().optional(),
    notes: z.string().trim().optional(),
    status: z.enum(["active", "inactive"]).optional()
  })
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createCustomerSchema.shape.body.partial()
});

export const customerIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const addPaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    amount: z.coerce.number().positive("পরিমাণ অবশ্যই ০-এর বেশি হতে হবে"),
    method: z.string().trim().optional(),
    note: z.string().trim().optional()
  })
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>["body"];
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>["body"];
export type AddPaymentInput = z.infer<typeof addPaymentSchema>["body"];