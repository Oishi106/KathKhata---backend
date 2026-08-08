import { Machine, IMachine } from "../models/machine.model";
import { ApiError } from "../../../utils/ApiError";
import type { CreateMachineInput, UpdateMachineInput, AddMaintenanceInput } from "../validators/machine.validator";

export class MachineService {
  static async create(ownerId: string, input: CreateMachineInput): Promise<IMachine> {
    const machine = await Machine.create({ ...input, owner: ownerId });
    return machine;
  }

  static async list(
    ownerId: string,
    filters: { page?: number; limit?: number; search?: string; status?: string } = {}
  ) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const query: Record<string, unknown> = { owner: ownerId };

    if (filters.status) query.status = filters.status;
    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: "i" } },
        { type: { $regex: filters.search, $options: "i" } },
        { model: { $regex: filters.search, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Machine.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Machine.countDocuments(query)
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  static async getById(ownerId: string, id: string) {
    const machine = await Machine.findOne({ _id: id, owner: ownerId });
    if (!machine) throw ApiError.notFound("মেশিন পাওয়া যায়নি");
    return machine;
  }

  static async update(ownerId: string, id: string, input: UpdateMachineInput) {
    const machine = await Machine.findOne({ _id: id, owner: ownerId });
    if (!machine) throw ApiError.notFound("মেশিন পাওয়া যায়নি");

    Object.assign(machine, input);
    await machine.save();
    return machine;
  }

  static async remove(ownerId: string, id: string) {
    const machine = await Machine.findOne({ _id: id, owner: ownerId });
    if (!machine) throw ApiError.notFound("মেশিন পাওয়া যায়নি");
    await machine.deleteOne();
    return machine;
  }

  /**
   * মেইনটেন্যান্স/মেরামত রেকর্ড যোগ করে — totalMaintenanceCost বাড়ায়,
   * lastMaintenanceDate আপডেট করে, এবং মেশিনের status স্বাভাবিক অবস্থায় ফিরিয়ে আনে।
   */
  static async addMaintenance(ownerId: string, id: string, input: AddMaintenanceInput) {
    const machine = await Machine.findOne({ _id: id, owner: ownerId });
    if (!machine) throw ApiError.notFound("মেশিন পাওয়া যায়নি");

    const recordDate = input.date ?? new Date();

    machine.maintenanceHistory.push({
      date: recordDate,
      type: input.type,
      cost: input.cost,
      description: input.description,
      performedBy: input.performedBy
    });

    machine.totalMaintenanceCost += input.cost;
    machine.lastMaintenanceDate = recordDate;
    machine.status = "operational"; // মেইনটেন্যান্স হয়ে গেলে ধরে নিচ্ছি মেশিন আবার চালু

    if (input.nextMaintenanceDate) {
      machine.nextMaintenanceDate = input.nextMaintenanceDate;
    }

    await machine.save();
    return machine;
  }

  static async stats(ownerId: string) {
    const [totalMachines, operational, underMaintenance, outOfOrder, costAgg] = await Promise.all([
      Machine.countDocuments({ owner: ownerId }),
      Machine.countDocuments({ owner: ownerId, status: "operational" }),
      Machine.countDocuments({ owner: ownerId, status: "under_maintenance" }),
      Machine.countDocuments({ owner: ownerId, status: "out_of_order" }),
      Machine.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: null, total: { $sum: "$totalMaintenanceCost" } } }
      ])
    ]);

    return {
      totalMachines,
      operational,
      underMaintenance,
      outOfOrder,
      totalMaintenanceCost: costAgg[0]?.total ?? 0
    };
  }
}