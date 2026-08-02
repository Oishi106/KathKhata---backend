import { Types } from "mongoose";
import { Sale } from "../models/sale.model";
import { ApiError } from "../../../utils/ApiError";

interface CreateInput {
  productName: string;
  customerName?: string;
  quantity: number;
  unitPrice: number;
  costOfGoods: number;
  date?: Date;
}

export const SaleService = {
  async create(owner: string, data: CreateInput) {
    const totalRevenue = data.quantity * data.unitPrice;
    const profit = totalRevenue - data.costOfGoods;
    return Sale.create({ ...data, owner, totalRevenue, profit });
  },

  async list(owner: string, page = 1, limit = 10, from?: string, to?: string) {
    const filter: Record<string, unknown> = { owner };
    if (from || to) {
      filter.date = {
        ...(from ? { $gte: new Date(from) } : {}),
        ...(to ? { $lte: new Date(to) } : {})
      };
    }
    const [items, total] = await Promise.all([
      Sale.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit),
      Sale.countDocuments(filter)
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async update(owner: string, id: string, data: Partial<CreateInput>) {
    const existing = await Sale.findOne({ _id: id, owner });
    if (!existing) throw ApiError.notFound("Sale not found");

    Object.assign(existing, data);
    existing.totalRevenue = existing.quantity * existing.unitPrice;
    existing.profit = existing.totalRevenue - existing.costOfGoods;
    await existing.save();
    return existing;
  },

  async remove(owner: string, id: string) {
    const item = await Sale.findOneAndDelete({ _id: id, owner });
    if (!item) throw ApiError.notFound("Sale not found");
    return item;
  },

  async productWiseSummary(owner: string) {
    return Sale.aggregate([
      { $match: { owner: new Types.ObjectId(owner) } },
      {
        $group: {
          _id: "$productName",
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalRevenue" },
          totalProfit: { $sum: "$profit" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
  },

  async revenueGraph(owner: string, from: Date, to: Date) {
    return Sale.aggregate([
      { $match: { owner: new Types.ObjectId(owner), date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          revenue: { $sum: "$totalRevenue" },
          profit: { $sum: "$profit" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }
};
