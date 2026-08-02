import { WoodInventory } from "../models/woodInventory.model";
import { ApiError } from "../../../utils/ApiError";

interface QueryOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

export const WoodInventoryService = {
  async create(owner: string, data: Record<string, unknown>) {
    return WoodInventory.create({ ...data, owner });
  },

  async list(owner: string, opts: QueryOptions) {
    const page = opts.page ?? 1;
    const limit = opts.limit ?? 10;
    const filter: Record<string, unknown> = { owner };

    if (opts.search) {
      filter.$or = [
        { woodType: { $regex: opts.search, $options: "i" } },
        { supplier: { $regex: opts.search, $options: "i" } },
        { location: { $regex: opts.search, $options: "i" } }
      ];
    }
    if (opts.status) filter.status = opts.status;

    const sort: Record<string, 1 | -1> = { [opts.sortBy ?? "createdAt"]: opts.order === "asc" ? 1 : -1 };

    const [items, total] = await Promise.all([
      WoodInventory.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit),
      WoodInventory.countDocuments(filter)
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(owner: string, id: string) {
    const item = await WoodInventory.findOne({ _id: id, owner });
    if (!item) throw ApiError.notFound("Wood inventory item not found");
    return item;
  },

  async update(owner: string, id: string, data: Record<string, unknown>) {
    const item = await WoodInventory.findOneAndUpdate({ _id: id, owner }, data, {
      new: true,
      runValidators: true
    });
    if (!item) throw ApiError.notFound("Wood inventory item not found");
    return item;
  },

  async remove(owner: string, id: string) {
    const item = await WoodInventory.findOneAndDelete({ _id: id, owner });
    if (!item) throw ApiError.notFound("Wood inventory item not found");
    return item;
  },

  async lowStock(owner: string) {
    return WoodInventory.find({ owner, status: { $in: ["low_stock", "out_of_stock"] } });
  }
};
