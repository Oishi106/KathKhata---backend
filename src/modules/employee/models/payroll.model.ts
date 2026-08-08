import { Schema, model, Document, Types } from "mongoose";

export interface IPayroll extends Document {
  owner: Types.ObjectId;
  employee: Types.ObjectId;
  month: number; // 1-12
  year: number;

  presentDays: number;
  halfDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;

  basePay: number;         // attendance অনুযায়ী গণনাকৃত মূল বেতন
  overtimePay: number;
  bonusTotal: number;
  deductionTotal: number;
  advanceDeducted: number;

  calculatedTotal: number; // basePay + overtimePay + bonusTotal - deductionTotal - advanceDeducted
  manualAdjustment: number; // owner চাইলে +/- করতে পারবে
  manualAdjustmentNote?: string;
  netPayable: number;      // calculatedTotal + manualAdjustment

  status: "draft" | "paid";
  paidDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const payrollSchema = new Schema<IPayroll>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },

    presentDays: { type: Number, default: 0 },
    halfDays: { type: Number, default: 0 },
    absentDays: { type: Number, default: 0 },
    leaveDays: { type: Number, default: 0 },
    overtimeHours: { type: Number, default: 0 },

    basePay: { type: Number, default: 0 },
    overtimePay: { type: Number, default: 0 },
    bonusTotal: { type: Number, default: 0 },
    deductionTotal: { type: Number, default: 0 },
    advanceDeducted: { type: Number, default: 0 },

    calculatedTotal: { type: Number, default: 0 },
    manualAdjustment: { type: Number, default: 0 },
    manualAdjustmentNote: { type: String, trim: true },
    netPayable: { type: Number, default: 0 },

    status: { type: String, enum: ["draft", "paid"], default: "draft" },
    paidDate: { type: Date }
  },
  { timestamps: true }
);

payrollSchema.index({ owner: 1, employee: 1, month: 1, year: 1 }, { unique: true });

export const Payroll = model<IPayroll>("Payroll", payrollSchema);