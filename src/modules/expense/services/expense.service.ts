import { Types } from "mongoose";
import { Expense } from "../models/expense.model";
import { ApiError } from "../../../utils/ApiError";

export const ExpenseService = {
  async create(owner: string, data: Record<string, unknown>) {
    return Expense.create({ ...data, owner });
  },

  async list(owner: string, page = 1, limit = 10, category?: string, from?: string, to?: string) {
    const filter: Record<string, unknown> = { owner };
    if (category) filter.category = category;
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {})
      };
    }
    const [items, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
      Expense.countDocuments(filter)
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async update(owner: string, id: string, data: Record<string, unknown>) {
    const item = await Expense.findOneAndUpdate({ _id: id, owner }, data, {
      new: true,
      runValidators: true
    });
    if (!item) throw ApiError.notFound("Expense not found");
    return item;
  },

  async remove(owner: string, id: string) {
    const item = await Expense.findOneAndDelete({ _id: id, owner });
    if (!item) throw ApiError.notFound("Expense not found");
    return item;
  },

  async monthlySummary(owner: string, year: number) {
    return Expense.aggregate([
      {
        $match: {
          owner: new Types.ObjectId(owner),
          date: { $gte: new Date(`${year}-01-01`), $lte: new Date(`${year}-12-31`) }
        }
      },
      { $group: { _id: { month: { $month: "$date" }, category: "$category" }, total: { $sum: "$amount" } } },
      { $sort: { "_id.month": 1 } }
    ]);
  }
};
