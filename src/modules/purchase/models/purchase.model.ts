import { Schema, model, Document, Types } from "mongoose";

export interface IPurchase extends Document {
  supplier: Types.ObjectId;
  purchaseDate: Date;
  invoiceNumber?: string;
  woodType: string;
  quantity: number;
  totalCFT: number;
  purchasePrice: number;
  transportCost: number;
  loadingCost: number;
  unloadingCost: number;
  otherExpenses: number;
  grandTotal: number;
  paidAmount: number;
  dueAmount: number;
  paymentMethod?: string;
  notes?: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    supplier: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    purchaseDate: { type: Date, required: true, default: Date.now },
    invoiceNumber: { type: String, trim: true },
    woodType: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    totalCFT: { type: Number, required: true, min: 0 },
    purchasePrice: { type: Number, required: true, min: 0 },
    transportCost: { type: Number, default: 0, min: 0 },
    loadingCost: { type: Number, default: 0, min: 0 },
    unloadingCost: { type: Number, default: 0, min: 0 },
    otherExpenses: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, trim: true },
    notes: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true }
  },
  { timestamps: true }
);

// সেভ হওয়ার আগে grandTotal ও dueAmount স্বয়ংক্রিয়ভাবে হিসাব করে —
// totalCFT এখন সরাসরি ইউজার ইনপুট, তাই এখানে হিসাব করা হয় না
purchaseSchema.pre("save", function (next) {
  this.grandTotal =
    this.purchasePrice + this.transportCost + this.loadingCost + this.unloadingCost + this.otherExpenses;

  this.dueAmount = Math.max(0, this.grandTotal - this.paidAmount);

  next();
});

purchaseSchema.index({ supplier: 1 });
purchaseSchema.index({ purchaseDate: -1 });

export const Purchase = model<IPurchase>("Purchase", purchaseSchema);