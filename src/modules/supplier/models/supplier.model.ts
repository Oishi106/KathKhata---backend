import { Schema, model, Document, Types } from "mongoose";

export interface IPaymentRecord {
  amount: number;
  date: Date;
  method?: string;
  note?: string;
}

export interface ISupplier extends Document {
  owner: Types.ObjectId;
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  totalDue: number;
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

const supplierSchema = new Schema<ISupplier>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    companyName: { type: String, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, trim: true },
    totalDue: { type: Number, default: 0 },
    paymentHistory: { type: [paymentRecordSchema], default: [] },
    notes: { type: String, trim: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" }
  },
  { timestamps: true }
);

supplierSchema.index({ owner: 1, name: 1 });

export const Supplier = model<ISupplier>("Supplier", supplierSchema);