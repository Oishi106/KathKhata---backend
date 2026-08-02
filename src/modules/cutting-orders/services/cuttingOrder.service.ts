import { CuttingOrder, calculateCFT } from "../models/cuttingOrder.model";
import { ApiError } from "../../../utils/ApiError";

interface CreateInput {
  customerName: string;
  customerPhone?: string;
  woodType: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  ratePerCFT: number;
  notes?: string;
}

export const CuttingOrderService = {
  async create(owner: string, data: CreateInput) {
    const cft = calculateCFT(data.length, data.width, data.thickness, data.quantity);
    const estimatedCost = cft * data.ratePerCFT;
    return CuttingOrder.create({ ...data, owner, cft, estimatedCost });
  },

  async list(owner: string, page = 1, limit = 10, status?: string) {
    const filter: Record<string, unknown> = { owner };
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      CuttingOrder.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CuttingOrder.countDocuments(filter)
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(owner: string, id: string) {
    const order = await CuttingOrder.findOne({ _id: id, owner });
    if (!order) throw ApiError.notFound("Cutting order not found");
    return order;
  },

  async updateStatus(owner: string, id: string, status: string) {
    const order = await CuttingOrder.findOneAndUpdate({ _id: id, owner }, { status }, { new: true });
    if (!order) throw ApiError.notFound("Cutting order not found");
    return order;
  },

  async update(owner: string, id: string, data: Partial<CreateInput>) {
    const existing = await CuttingOrder.findOne({ _id: id, owner });
    if (!existing) throw ApiError.notFound("Cutting order not found");

    const merged = { ...existing.toObject(), ...data };
    const cft = calculateCFT(merged.length, merged.width, merged.thickness, merged.quantity);
    const rate = (data as CreateInput).ratePerCFT ?? merged.estimatedCost / (existing.cft || 1);
    const estimatedCost = cft * rate;

    Object.assign(existing, data, { cft, estimatedCost });
    await existing.save();
    return existing;
  },

  async remove(owner: string, id: string) {
    const order = await CuttingOrder.findOneAndDelete({ _id: id, owner });
    if (!order) throw ApiError.notFound("Cutting order not found");
    return order;
  },

  previewCFT(length: number, width: number, thickness: number, quantity: number, ratePerCFT: number) {
    const cft = calculateCFT(length, width, thickness, quantity);
    return { cft, estimatedCost: cft * ratePerCFT };
  }
};
