import { Schema, model, Document, Types } from "mongoose";

export interface IMaintenanceRecord {
  date: Date;
  type: "routine" | "repair";
  cost: number;
  description?: string;
  performedBy?: string;
}

export interface IMachine extends Document {
  owner: Types.ObjectId;
  name: string;
  type?: string;
  modelNumber?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  location?: string;
  status: "operational" | "under_maintenance" | "out_of_order";
  lastMaintenanceDate?: Date;
  nextMaintenanceDate?: Date;
  maintenanceHistory: IMaintenanceRecord[];
  totalMaintenanceCost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const maintenanceRecordSchema = new Schema<IMaintenanceRecord>(
  {
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ["routine", "repair"], required: true },
    cost: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    performedBy: { type: String, trim: true }
  },
  { _id: false }
);

const machineSchema = new Schema<IMachine>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    modelNumber: { type: String, trim: true },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, min: 0 },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ["operational", "under_maintenance", "out_of_order"],
      default: "operational"
    },
    lastMaintenanceDate: { type: Date },
    nextMaintenanceDate: { type: Date },
    maintenanceHistory: { type: [maintenanceRecordSchema], default: [] },
    totalMaintenanceCost: { type: Number, default: 0 },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

machineSchema.index({ owner: 1, name: 1 });

export const Machine = model<IMachine>("Machine", machineSchema);