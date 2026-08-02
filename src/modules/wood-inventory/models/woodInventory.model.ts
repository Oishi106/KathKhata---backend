import { Schema, model, Document, Types } from "mongoose";

export interface IWoodInventory extends Document {
  owner: Types.ObjectId;
  woodType: string;
  supplier?: string;
  purchaseDate: Date;
  purchasePrice: number;
  transportCost: number;
  totalCFT: number;
  availableCFT: number;
  location?: string;
  notes?: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  createdAt: Date;
  updatedAt: Date;
}

const woodInventorySchema = new Schema<IWoodInventory>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    woodType: { type: String, required: true, trim: true },
    supplier: { type: String, trim: true },
    purchaseDate: { type: Date, required: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    transportCost: { type: Number, default: 0, min: 0 },
    totalCFT: { type: Number, required: true, min: 0 },
    availableCFT: { type: Number, required: true, min: 0 },
    location: { type: String, trim: true },
    notes: { type: String, trim: true },
    status: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock"
    }
  },
  { timestamps: true }
);

woodInventorySchema.pre("save", function (next) {
  if (this.availableCFT <= 0) this.status = "out_of_stock";
  else if (this.availableCFT < this.totalCFT * 0.2) this.status = "low_stock";
  else this.status = "in_stock";
  next();
});

woodInventorySchema.index({ owner: 1, woodType: 1 });

export const WoodInventory = model<IWoodInventory>("WoodInventory", woodInventorySchema);
