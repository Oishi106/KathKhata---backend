import { Schema, model, Document, Types } from "mongoose";

export type RuleFormulaType = "round_log_feet" | "round_log_inch" | "size_cut";

export interface IMeasurementRule extends Document {
  owner: Types.ObjectId;
  name: string;
  region: string;
  formulaType: RuleFormulaType;
  unit: "feet" | "inch" | "mixed";
  description?: string;
  version: number;
  status: "active" | "inactive";
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const measurementRuleSchema = new Schema<IMeasurementRule>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    region: { type: String, default: "Custom", trim: true },
    formulaType: {
      type: String,
      enum: ["round_log_feet", "round_log_inch", "size_cut"],
      required: true
    },               
    unit: { type: String, enum: ["feet", "inch", "mixed"], default: "mixed" },
    description: { type: String, trim: true },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["active", "inactive"], default: "active" },                    
    isDefault: { type: Boolean, default: false }                
  },
  { timestamps: true }
);

export const MeasurementRule = model<IMeasurementRule>("MeasurementRule", measurementRuleSchema);