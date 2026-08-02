import { Schema, model, Document, Types } from "mongoose";

export type ExpenseCategory =
  | "salary"
  | "electricity"
  | "transport"
  | "machine_repair"
  | "fuel"
  | "miscellaneous";

export interface IExpense extends Document {
  owner: Types.ObjectId;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: {
      type: String,
      enum: ["salary", "electricity", "transport", "machine_repair", "fuel", "miscellaneous"],
      required: true
    },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

expenseSchema.index({ owner: 1, date: -1 });

export const Expense = model<IExpense>("Expense", expenseSchema);
