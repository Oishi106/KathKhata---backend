import { Schema, model, Document, Types } from "mongoose";

export interface IPaymentRecord {
  amount: number;
  date: Date;
  method?: string;
  note?: string;
}

export interface ICustomer extends Document {
  owner: Types.ObjectId;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDue: number;
  advanceBalance: number;
  paymentHistory: IPaymentRecord[];
  notes?: string;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}

const paymentRecordSchema = new Schema<IPaymentRecord>(
  {
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    method: { type: String, trim: true },
    note: { type: String, trim: true }
  },
  { _id: false }
);

const customerSchema = new Schema<ICustomer>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    totalDue: { type: Number, default: 0 },
    advanceBalance: { type: Number, default: 0 },
    paymentHistory: { type: [paymentRecordSchema], default: [] },
    notes: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);

customerSchema.index({ owner: 1, name: 1 });

export const Customer = model<ICustomer>("Customer", customerSchema);