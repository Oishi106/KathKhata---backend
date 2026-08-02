import { Schema, model, Document, Types } from "mongoose";

export interface ISale extends Document {
  owner: Types.ObjectId;
  productName: string;
  customerName?: string;
  quantity: number;
  unitPrice: number;
  totalRevenue: number;
  costOfGoods: number;
  profit: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const saleSchema = new Schema<ISale>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productName: { type: String, required: true, trim: true },
    customerName: { type: String, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    totalRevenue: { type: Number, required: true, min: 0 },
    costOfGoods: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    date: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

saleSchema.index({ owner: 1, date: -1 });

export const Sale = model<ISale>("Sale", saleSchema);
