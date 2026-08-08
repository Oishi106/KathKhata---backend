import { Payroll, IPayroll } from "../models/payroll.model";
import { Employee } from "../models/employee.model";
import { ApiError } from "../../../utils/ApiError";
import type { GeneratePayrollInput, AdjustPayrollInput } from "../validators/payroll.validator";

function daysInMonth(month: number, year: number) {
  return new Date(year, month, 0).getDate(); // month is 1-12 here
}

export class PayrollService {
  /**
   * নির্দিষ্ট মাসের জন্য payroll হিসাব করে (draft হিসেবে)।
   * ইতিমধ্যে draft থাকলে recalculate করে, paid থাকলে আর বদলানো যাবে না।
   */
  static async generate(ownerId: string, input: GeneratePayrollInput): Promise<IPayroll> {
    const employee = await Employee.findOne({ _id: input.employee, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");

    let payroll = await Payroll.findOne({
      owner: ownerId,
      employee: input.employee,
      month: input.month,
      year: input.year
    });

if (payroll && payroll.status === "paid") {
      // ইতিমধ্যে পরিশোধিত হলে আবার হিসাব না করে শুধু পুরনো রেকর্ডটাই ফেরত দেওয়া হচ্ছে (দেখার জন্য)
      return payroll;
    }

    // ওই মাসের attendance রেকর্ড ফিল্টার করা
    const monthRecords = employee.attendanceHistory.filter(
      (r) => r.date.getMonth() + 1 === input.month && r.date.getFullYear() === input.year
    );

    const presentDays = monthRecords.filter((r) => r.status === "present").length;
    const halfDays = monthRecords.filter((r) => r.status === "half_day").length;
    const absentDays = monthRecords.filter((r) => r.status === "absent").length;
    const leaveDays = monthRecords.filter((r) => r.status === "leave").length;
    const overtimeHours = monthRecords.reduce((sum, r) => sum + (r.overtimeHours ?? 0), 0);

    // প্রতি-দিনের রেট বের করা salaryType অনুযায়ী
    let perDayRate: number;
    if (employee.salaryType === "daily") {
      perDayRate = employee.salaryAmount;
    } else if (employee.salaryType === "weekly") {
      perDayRate = employee.salaryAmount / 7;
    } else {
      perDayRate = employee.salaryAmount / daysInMonth(input.month, input.year);
    }

    const basePay = perDayRate * (presentDays + halfDays * 0.5);

    const overtimeRate = employee.overtimeRatePerHour ?? perDayRate / 8;
    const overtimePay = overtimeHours * overtimeRate;

// ওই মাসের bonus/deduction পেমেন্ট হিসাব করা
    const monthPayments = employee.paymentHistory.filter(
      (p) => p.date.getMonth() + 1 === input.month && p.date.getFullYear() === input.year
    );
    const bonusTotal = monthPayments.filter((p) => p.type === "bonus").reduce((s, p) => s + p.amount, 0);
    const deductionTotal = monthPayments.filter((p) => p.type === "deduction").reduce((s, p) => s + p.amount, 0);

    // অগ্রিম এখানে কাটা হয় না — এটা আলাদা, দীর্ঘমেয়াদী পাওনা হিসেবে থেকে যায়
    // যতক্ষণ না owner ম্যানুয়ালি "অগ্রিম শোধ" রেকর্ড করে
    const advanceDeducted = 0;
    const calculatedTotal = basePay + overtimePay + bonusTotal - deductionTotal;


    const manualAdjustment = payroll?.manualAdjustment ?? 0;
    const netPayable = calculatedTotal + manualAdjustment;

    const payload = {
      owner: ownerId,
      employee: input.employee,
      month: input.month,
      year: input.year,
      presentDays,
      halfDays,
      absentDays,
      leaveDays,
      overtimeHours,
      basePay,
      overtimePay,
      bonusTotal,
      deductionTotal,
      advanceDeducted,
      calculatedTotal,
      manualAdjustment,
      manualAdjustmentNote: payroll?.manualAdjustmentNote,
      netPayable,
      status: "draft" as const
    };

    if (payroll) {
      Object.assign(payroll, payload);
      await payroll.save();
    } else {
      payroll = await Payroll.create(payload);
    }

    return payroll;
  }

  static async list(ownerId: string, filters: { employee?: string; month?: number; year?: number } = {}) {
    const query: Record<string, unknown> = { owner: ownerId };
    if (filters.employee) query.employee = filters.employee;
    if (filters.month) query.month = filters.month;
    if (filters.year) query.year = filters.year;

    return Payroll.find(query).populate("employee", "name designation salaryType").sort({ year: -1, month: -1 });
  }

  static async getById(ownerId: string, id: string) {
    const payroll = await Payroll.findOne({ _id: id, owner: ownerId }).populate(
      "employee",
      "name designation salaryType"
    );
    if (!payroll) throw ApiError.notFound("পে-রোল পাওয়া যায়নি");
    return payroll;
  }

  /**
   * owner ম্যানুয়ালি চূড়ান্ত পরিমাণ সমন্বয় করতে পারে (draft অবস্থায় থাকা অবস্থায়)।
   */
  static async adjust(ownerId: string, id: string, input: AdjustPayrollInput) {
    const payroll = await Payroll.findOne({ _id: id, owner: ownerId });
    if (!payroll) throw ApiError.notFound("পে-রোল পাওয়া যায়নি");
    if (payroll.status === "paid") throw ApiError.badRequest("পরিশোধিত পে-রোল পরিবর্তন করা যাবে না");

    payroll.manualAdjustment = input.manualAdjustment;
    payroll.manualAdjustmentNote = input.manualAdjustmentNote;
    payroll.netPayable = payroll.calculatedTotal + input.manualAdjustment;

    await payroll.save();
    return payroll;
  }

  /**
   * পে-রোল চূড়ান্তভাবে পরিশোধ করে — কর্মচারীর paymentHistory-তে salary এন্ট্রি যোগ করে,
   * advanceBalance থেকে কাটা অংশ বাদ দেয়, এবং payroll-কে paid করে দেয়।
   */
  static async confirmPay(ownerId: string, id: string) {
    const payroll = await Payroll.findOne({ _id: id, owner: ownerId });
    if (!payroll) throw ApiError.notFound("পে-রোল পাওয়া যায়নি");
    if (payroll.status === "paid") throw ApiError.badRequest("এই পে-রোল ইতিমধ্যে পরিশোধিত");

    const employee = await Employee.findOne({ _id: payroll.employee, owner: ownerId });
    if (!employee) throw ApiError.notFound("কর্মচারী পাওয়া যায়নি");

employee.paymentHistory.push({
      date: new Date(),
      type: "salary",
      amount: payroll.netPayable,
      note: `${payroll.month}/${payroll.year} মাসের বেতন`
    });
    await employee.save();

    payroll.status = "paid";
    payroll.paidDate = new Date();
    await payroll.save();

    return payroll;
  }

  static async remove(ownerId: string, id: string) {
    const payroll = await Payroll.findOne({ _id: id, owner: ownerId });
    if (!payroll) throw ApiError.notFound("পে-রোল পাওয়া যায়নি");
    if (payroll.status === "paid") throw ApiError.badRequest("পরিশোধিত পে-রোল মুছে ফেলা যাবে না");
    await payroll.deleteOne();
    return payroll;
  }
}