import { Schema, model, Document, Types } from "mongoose";

export interface IMeasurementItem {
  mode: "round_log" | "size_cut";
  girth?: number;
  girthUnit?: "feet" | "inch";
  length?: number;
  width?: number;
  thickness?: number;
  quantity: number;
  cft: number;
  ruleUsed: string;
}

export interface IMeasurement extends Document {
  owner: Types.ObjectId;
  slipNumber: string;
  customerName: string;
  operator?: string;
  items: IMeasurementItem[];
  totalCFT: number;
  ratePerCFT: number;
  totalPrice: number;
  paidAmount: number;
  dueAmount: number;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const measurementItemSchema = new Schema<IMeasurementItem>(
  {
    mode: { type: String, enum: ["round_log", "size_cut"], required: true },
    girth: { type: Number },
    girthUnit: { type: String, enum: ["feet", "inch"] },
    length: { type: Number },
    width: { type: Number },
    thickness: { type: Number },
    quantity: { type: Number, required: true, min: 1 },
    cft: { type: Number, required: true, min: 0 },
    ruleUsed: { type: String, required: true }
  },
  { _id: true }
);

const measurementSchema = new Schema<IMeasurement>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    slipNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true, trim: true },
    operator: { type: String, trim: true },
    items: { type: [measurementItemSchema], default: [] },
    totalCFT: { type: Number, default: 0 },
    ratePerCFT: { type: Number, default: 0 },   
    totalPrice: { type: Number, default: 0 },    
    paidAmount: { type: Number, default: 0 },     
    dueAmount: { type: Number, default: 0 },
    status: { type: String, enum: ["open", "closed"], default: "open" }
  },
  { timestamps: true }
);

measurementSchema.index({ owner: 1, createdAt: -1 });
measurementSchema.index({ owner: 1, customerName: 1 });

export const Measurement = model<IMeasurement>("Measurement", measurementSchema);