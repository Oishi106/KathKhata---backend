import { Schema, model, Document, Types } from "mongoose";

export interface ICuttingOrder extends Document {
  owner: Types.ObjectId;
  customerName: string;
  customerPhone?: string;
  woodType: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  cft: number;
  estimatedCost: number;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cuttingOrderSchema = new Schema<ICuttingOrder>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, trim: true },
    woodType: { type: String, required: true, trim: true },
    length: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    thickness: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    cft: { type: Number, required: true, min: 0 },
    estimatedCost: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed", "cancelled"],
      default: "pending"
    },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

// CFT formula (standard board-foot-style calc adapted for inches -> cubic feet):
// CFT = (Length(in) * Width(in) * Thickness(in) * Quantity) / 144
export const calculateCFT = (length: number, width: number, thickness: number, quantity: number) =>
  (length * width * thickness * quantity) / 144;

export const CuttingOrder = model<ICuttingOrder>("CuttingOrder", cuttingOrderSchema);
