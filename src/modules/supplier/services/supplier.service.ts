import { Types } from "mongoose";
import { Supplier } from "../models/supplier.model";
import { ApiError } from "../../../utils/ApiError";

interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const SupplierService = {
  async create(owner: string, data: Record<string, unknown>) {
    return Supplier.create({ ...data, owner });
  },

  async list(owner: string, opts: QueryOptions) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 10;
    const filter: Record<string, unknown> = { owner };

    if (opts.search) {
      filter.$or = [
        { name: { $regex: opts.search, $options: "i" } },
        { companyName: { $regex: opts.search, $options: "i" } },
        { phone: { $regex: opts.search, $options: "i" } }
      ];
    }
    if (opts.status) filter.status = opts.status;

    const [items, total] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Supplier.countDocuments(filter)
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(owner: string, id: string) {
    const supplier = await Supplier.findOne({ _id: id, owner });
    if (!supplier) throw ApiError.notFound("Supplier not found");
    return supplier;
  },

  async update(owner: string, id: string, data: Record<string, unknown>) {
    const supplier = await Supplier.findOneAndUpdate({ _id: id, owner }, data, {
      new: true,
      runValidators: true
    });
    if (!supplier) throw ApiError.notFound("Supplier not found");
    return supplier;
  },

  async remove(owner: string, id: string) {
    const supplier = await Supplier.findOneAndDelete({ _id: id, owner });
    if (!supplier) throw ApiError.notFound("Supplier not found");
    return supplier;
  },

  async addPayment(owner: string, id: string, payment: { amount: number; date?: Date; method?: string; note?: string }) {
    const supplier = await Supplier.findOne({ _id: id, owner });
    if (!supplier) throw ApiError.notFound("Supplier not found");

    supplier.paymentHistory.push({
      amount: payment.amount,
      date: payment.date ?? new Date(),
      method: payment.method,
      note: payment.note
    });
    supplier.totalDue = Math.max(0, supplier.totalDue - payment.amount);
    await supplier.save();
    return supplier;
  },

  // Called by the Purchase module when a purchase is made with a due balance
  async increaseDue(owner: string, id: string, amount: number) {
    if (amount <= 0) return;
    await Supplier.findOneAndUpdate({ _id: id, owner }, { $inc: { totalDue: amount } });
  },

  async stats(owner: string) {
    const [totalSuppliers, dueAgg] = await Promise.all([
      Supplier.countDocuments({ owner }),
      Supplier.aggregate([
        { $match: { owner: new Types.ObjectId(owner) } },
        { $group: { _id: null, totalDue: { $sum: "$totalDue" } } }
      ])
    ]);

    return {
      totalSuppliers,
      totalDue: dueAgg[0]?.totalDue ?? 0
    };
  }
};