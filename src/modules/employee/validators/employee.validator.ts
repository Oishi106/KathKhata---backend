import { z } from "zod";

export const createEmployeeSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "কর্মচারীর নাম লিখুন" }).trim().min(1),
    phone: z.string({ required_error: "ফোন নম্বর লিখুন" }).trim().min(1),
    address: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    salaryType: z.enum(["daily", "weekly", "monthly"], { required_error: "বেতনের ধরন নির্বাচন করুন" }),
    salaryAmount: z.coerce.number().positive("বেতনের পরিমাণ অবশ্যই ০-এর বেশি হতে হবে"),
    overtimeRatePerHour: z.coerce.number().nonnegative().optional(),
    joiningDate: z.coerce.date().optional(),
    status: z.enum(["active", "inactive"]).optional(),
    notes: z.string().trim().optional()
  })
});

export const updateEmployeeSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createEmployeeSchema.shape.body.partial()
});

export const employeeIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const markAttendanceSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    date: z.coerce.date(),
    status: z.enum(["present", "absent", "half_day", "leave"], { required_error: "উপস্থিতির ধরন নির্বাচন করুন" }),
    overtimeHours: z.coerce.number().nonnegative().optional().default(0)
  })
});

export const addPaymentSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    type: z.enum(["advance", "bonus", "deduction"], { required_error: "লেনদেনের ধরন নির্বাচন করুন" }),
    amount: z.coerce.number().positive("পরিমাণ অবশ্যই ০-এর বেশি হতে হবে"),
    date: z.coerce.date().optional(),
    note: z.string().trim().optional()
  })
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>["body"];
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>["body"];
export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>["body"];
export type AddPaymentInput = z.infer<typeof addPaymentSchema>["body"];