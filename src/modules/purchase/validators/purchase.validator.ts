import { z } from "zod";

export const createPurchaseSchema = z.object({
  body: z.object({
    supplier: z.string({ required_error: "সরবরাহকারী নির্বাচন করুন" }).min(1),
    purchaseDate: z.coerce.date().optional(),
    invoiceNumber: z.string().trim().optional(),
    woodType: z.string({ required_error: "কাঠের ধরন লিখুন" }).trim().min(1),

    quantity: z.coerce.number().int().positive("পরিমাণ অবশ্যই ০-এর বেশি হতে হবে"),
    totalCFT: z.coerce.number().positive("সিএফটি অবশ্যই ০-এর বেশি হতে হবে"),

    purchasePrice: z.coerce.number().nonnegative(),
    transportCost: z.coerce.number().nonnegative().optional().default(0),
    loadingCost: z.coerce.number().nonnegative().optional().default(0),
    unloadingCost: z.coerce.number().nonnegative().optional().default(0),
    otherExpenses: z.coerce.number().nonnegative().optional().default(0),

    paidAmount: z.coerce.number().nonnegative().optional().default(0),
    paymentMethod: z.string().trim().optional(),
    notes: z.string().trim().optional()
  })
});

export const updatePurchaseSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createPurchaseSchema.shape.body.partial()
});

export const purchaseIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>["body"];
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>["body"];