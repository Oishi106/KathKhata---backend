import { z } from "zod";

export const createMachineSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "মেশিনের নাম লিখুন" }).trim().min(1),
    type: z.string().trim().optional(),
    modelNumber: z.string().trim().optional(),
    purchaseDate: z.coerce.date().optional(),
    purchasePrice: z.coerce.number().nonnegative().optional(),
    location: z.string().trim().optional(),
    status: z.enum(["operational", "under_maintenance", "out_of_order"]).optional(),
    nextMaintenanceDate: z.coerce.date().optional(),
    notes: z.string().trim().optional()
  })
});

export const updateMachineSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: createMachineSchema.shape.body.partial()
});

export const machineIdParamSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  })
});

export const addMaintenanceSchema = z.object({
  params: z.object({
    id: z.string().min(1)
  }),
  body: z.object({
    date: z.coerce.date().optional(),
    type: z.enum(["routine", "repair"], { required_error: "মেইনটেন্যান্সের ধরন নির্বাচন করুন" }),
    cost: z.coerce.number().nonnegative(),
    description: z.string().trim().optional(),
    performedBy: z.string().trim().optional(),
    nextMaintenanceDate: z.coerce.date().optional()
  })
});

export type CreateMachineInput = z.infer<typeof createMachineSchema>["body"];
export type UpdateMachineInput = z.infer<typeof updateMachineSchema>["body"];
export type AddMaintenanceInput = z.infer<typeof addMaintenanceSchema>["body"];