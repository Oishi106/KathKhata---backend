import { Employee, IEmployee } from "../models/employee.model";
import { ApiError } from "../../../utils/ApiError";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  MarkAttendanceInput,
  AddPaymentInput
} from "../validators/employee.validator";

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

export class EmployeeService {
  static async create(ownerId: string, input: CreateEmployeeInput): Promise<IEmployee> {
    return Employee.create({ ...input, owner: ownerId });
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
        { phone: { $regex: filters.search, $options: "i" } },
        { designation: { $regex: filters.search, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Employee.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Employee.countDocuments(query)
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  static async getById(ownerId: string, id: string) {
    const employee = await Employee.findOne({ _id: id, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");
    return employee;
  }

  static async update(ownerId: string, id: string, input: UpdateEmployeeInput) {
    const employee = await Employee.findOne({ _id: id, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");
    Object.assign(employee, input);
    await employee.save();
    return employee;
  }

  static async remove(ownerId: string, id: string) {
    const employee = await Employee.findOne({ _id: id, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");
    await employee.deleteOne();
    return employee;
  }

  /**
   * নির্দিষ্ট তারিখের হাজিরা রেকর্ড করে — একই তারিখে আগে থেকে এন্ট্রি থাকলে সেটা আপডেট হয়ে যায়।
   */
  static async markAttendance(ownerId: string, id: string, input: MarkAttendanceInput) {
    const employee = await Employee.findOne({ _id: id, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");

    const existingIndex = employee.attendanceHistory.findIndex((r) => sameDay(r.date, input.date));

    if (existingIndex >= 0) {
      employee.attendanceHistory[existingIndex] = {
        date: input.date,
        status: input.status,
        overtimeHours: input.overtimeHours ?? 0
      };
    } else {
      employee.attendanceHistory.push({
        date: input.date,
        status: input.status,
        overtimeHours: input.overtimeHours ?? 0
      });
    }

    await employee.save();
    return employee;
  }

  /**
   * advance/bonus/deduction রেকর্ড করে। advance হলে advanceBalance বাড়ে।
   */
  static async addPayment(ownerId: string, id: string, input: AddPaymentInput) {
    const employee = await Employee.findOne({ _id: id, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");

    employee.paymentHistory.push({
      date: input.date ?? new Date(),
      type: input.type,
      amount: input.amount,
      note: input.note
    });

    if (input.type === "advance") {
      employee.advanceBalance += input.amount;
    }

    await employee.save();
    return employee;
  }

  static async stats(ownerId: string) {
    const [totalEmployees, active, inactive, advanceAgg] = await Promise.all([
      Employee.countDocuments({ owner: ownerId }),
      Employee.countDocuments({ owner: ownerId, status: "active" }),
      Employee.countDocuments({ owner: ownerId, status: "inactive" }),
      Employee.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: null, total: { $sum: "$advanceBalance" } } }
      ])
    ]);

    return {
      totalEmployees,
      active,
      inactive,
      totalAdvanceOutstanding: advanceAgg[0]?.total ?? 0
    };
  }
}