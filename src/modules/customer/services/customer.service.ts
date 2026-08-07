import { Customer, ICustomer } from "../models/customer.model";
import { ApiError } from "../../../utils/ApiError";
import type { CreateCustomerInput, UpdateCustomerInput, AddPaymentInput } from "../validators/customer.validator";

export class CustomerService {
  static async create(ownerId: string, input: CreateCustomerInput): Promise<ICustomer> {
    const customer = await Customer.create({ ...input, owner: ownerId });
    return customer;
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
        { phone: { $regex: filters.search, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Customer.countDocuments(query)
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }

  static async getById(ownerId: string, id: string) {
    const customer = await Customer.findOne({ _id: id, owner: ownerId });
    if (!customer) throw ApiError.notFound("গ্রাহক পাওয়া যায়নি");
    return customer;
  }

  static async update(ownerId: string, id: string, input: UpdateCustomerInput) {
    const customer = await Customer.findOne({ _id: id, owner: ownerId });
    if (!customer) throw ApiError.notFound("গ্রাহক পাওয়া যায়নি");

    Object.assign(customer, input);
    await customer.save();
    return customer;
  }

  static async remove(ownerId: string, id: string) {
    const customer = await Customer.findOne({ _id: id, owner: ownerId });
    if (!customer) throw ApiError.notFound("গ্রাহক পাওয়া যায়নি");
    await customer.deleteOne();
    return customer;
  }

  /**
   * গ্রাহকের পেমেন্ট রেকর্ড করে।
   * প্রথমে বকেয়া (totalDue) থেকে কাটে, বাকি থাকলে সেটা advanceBalance-এ জমা হয়।
   */
  static async addPayment(ownerId: string, id: string, input: AddPaymentInput) {
    const customer = await Customer.findOne({ _id: id, owner: ownerId });
    if (!customer) throw ApiError.notFound("গ্রাহক পাওয়া যায়নি");

    let remaining = input.amount;

    if (customer.totalDue > 0) {
      const appliedToDue = Math.min(customer.totalDue, remaining);
      customer.totalDue -= appliedToDue;
      remaining -= appliedToDue;
    }

    if (remaining > 0) {
      customer.advanceBalance += remaining;
    }

    customer.paymentHistory.push({
      amount: input.amount,
      date: new Date(),
      method: input.method,
      note: input.note
    });

    await customer.save();
    return customer;
  }

  static async stats(ownerId: string) {
    const [totalCustomers, dueAgg, advanceAgg] = await Promise.all([
      Customer.countDocuments({ owner: ownerId }),
      Customer.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: null, total: { $sum: "$totalDue" } } }
      ]),
      Customer.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: null, total: { $sum: "$advanceBalance" } } }
      ])
    ]);

    return {
      totalCustomers,
      totalDue: dueAgg[0]?.total ?? 0,
      totalAdvance: advanceAgg[0]?.total ?? 0
    };
  }
}