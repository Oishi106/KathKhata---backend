import { Schema, model, Document, Types } from "mongoose";

export interface IAttendanceRecord {
  date: Date;
  status: "present" | "absent" | "half_day" | "leave";
  overtimeHours: number;
}

export interface IPaymentRecord {
  date: Date;
  type: "advance" | "advance_repayment" | "bonus" | "salary" | "deduction";
  amount: number;
  note?: string;
}

export interface IEmployee extends Document {
  owner: Types.ObjectId;
  name: string;
  phone: string;
  address?: string;
  designation?: string;
  salaryType: "daily" | "weekly" | "monthly";
  salaryAmount: number;
  overtimeRatePerHour?: number; // না দিলে হিসাবের সময় স্বয়ংক্রিয়ভাবে অনুমান করা হবে
  joiningDate: Date;
  status: "active" | "inactive";
  advanceBalance: number;
  attendanceHistory: IAttendanceRecord[];
  paymentHistory: IPaymentRecord[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    date: { type: Date, required: true },
    status: { type: String, enum: ["present", "absent", "half_day", "leave"], required: true },
    overtimeHours: { type: Number, default: 0, min: 0 }
  },
  { _id: false }
);

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ["advance", "advance_repayment", "bonus", "salary", "deduction"], required: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const employeeSchema = new Schema<IEmployee>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    designation: { type: String, trim: true },
    salaryType: { type: String, enum: ["daily", "weekly", "monthly"], required: true, default: "monthly" },
    salaryAmount: { type: Number, required: true, min: 0 },
    overtimeRatePerHour: { type: Number, min: 0 },
    joiningDate: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    advanceBalance: { type: Number, default: 0 },
    attendanceHistory: { type: [attendanceRecordSchema], default: [] },
    paymentHistory: { type: [paymentRecordSchema], default: [] },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

employeeSchema.index({ owner: 1, name: 1 });

export const Employee = model<IEmployee>("Employee", employeeSchema);