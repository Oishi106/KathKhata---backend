import { Schema, model, Document, Types } from "mongoose";

export interface IBusinessSettings extends Document {
  owner: Types.ObjectId;
  businessName: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  currency: string;        // যেমন "BDT"
  currencySymbol: string;  // যেমন "৳"
  timezone: string;        // যেমন "Asia/Dhaka"
  invoicePrefix: string;   // যেমন "INV-"
  invoiceStartingNumber: number;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  createdAt: Date;
  updatedAt: Date;
}

const businessSettingsSchema = new Schema<IBusinessSettings>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    businessName: { type: String, required: true, trim: true, default: "আমার করাতকল" },
    logoUrl: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    currency: { type: String, default: "BDT" },
    currencySymbol: { type: String, default: "৳" },
    timezone: { type: String, default: "Asia/Dhaka" },
    invoicePrefix: { type: String, default: "INV-" },
    invoiceStartingNumber: { type: Number, default: 1 },
    dateFormat: {
      type: String,
      enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      default: "DD/MM/YYYY"
    }
  },
  { timestamps: true }
);

export const BusinessSettings = model<IBusinessSettings>("BusinessSettings", businessSettingsSchema);