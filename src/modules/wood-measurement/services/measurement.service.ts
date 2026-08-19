import { Measurement, IMeasurementItem } from "../models/measurement.model";
import { MeasurementRule } from "../models/measurementRule.model";
import { ApiError } from "../../../utils/ApiError";
import { runRuleEngine } from "../utils/ruleEngine";

const generateSlipNumber = async (owner: string) => {
  const today = new Date();
  const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const countToday = await Measurement.countDocuments({
    owner,
    slipNumber: { $regex: `^KK-${datePart}-` }
  });

  const serial = String(countToday + 1).padStart(4, "0");
  return `KK-${datePart}-${serial}`;
};

export const MeasurementService = {
  // ---- Rules ----
  async ensureDefaultRules(owner: string) {
    const existing = await MeasurementRule.countDocuments({ owner });
    if (existing > 0) return;

    await MeasurementRule.insertMany([
      {
        owner,
        name: "গোল কাঠ (ফুট)",
        region: "Custom",
        formulaType: "round_log_feet",
        unit: "feet",
        description: "CFT = (Girth² × Length) / 16 — বেয়ার ফুটে দেওয়া হলে",
        isDefault: true
      },
      {
        owner,
        name: "গোল কাঠ (ইঞ্চি)",
        region: "Custom",
        formulaType: "round_log_inch",
        unit: "inch",
        description: "CFT = (Length × Girth²) / 2304 — বেয়ার ইঞ্চিতে দেওয়া হলে",
        isDefault: true
      },
      {
        owner,
        name: "সাইজ কাট",
        region: "Custom",
        formulaType: "size_cut",
        unit: "inch",
        description: "CFT = (L × W × T × Qty) / 144",
        isDefault: true
      }
    ]);
  },

  async listRules(owner: string) {
    await this.ensureDefaultRules(owner);
    return MeasurementRule.find({ owner }).sort({ createdAt: 1 });
  },

  async createRule(owner: string, data: Record<string, unknown>) {
    return MeasurementRule.create({ ...data, owner });
  },

  async updateRule(owner: string, id: string, data: Record<string, unknown>) {
    const rule = await MeasurementRule.findOneAndUpdate(
      { _id: id, owner },
      { ...data, $inc: { version: 1 } },
      { new: true }
    );
    if (!rule) throw ApiError.notFound("Rule not found");
    return rule;
  },

  // ---- Measurements (notebook) ----
  async startOrGetOpenGroup(owner: string, customerName: string, operator?: string, ratePerCFT?: number) {
    let group = await Measurement.findOne({ owner, customerName, status: "open" });
    if (group) return group;

    const slipNumber = await generateSlipNumber(owner);
    group = await Measurement.create({
      owner,
      slipNumber,
      customerName,
      operator,
      ratePerCFT: ratePerCFT ?? 0,
      items: []
    });
    return group;
  },

  async addItem(
    owner: string,
    groupId: string,
    itemInput: {
      mode: "round_log" | "size_cut";
      girth?: number;
      girthUnit?: "feet" | "inch";
      length?: number;
      width?: number;
      thickness?: number;
      quantity: number;
    }
  ) {
    const group = await Measurement.findOne({ _id: groupId, owner, status: "open" });
    if (!group) throw ApiError.notFound("Open measurement group not found");

    let cft: number;
    let ruleUsed: string;

    if (itemInput.mode === "round_log") {
      const formulaType = itemInput.girthUnit === "inch" ? "round_log_inch" : "round_log_feet";
      cft = runRuleEngine(formulaType, {
        girth: itemInput.girth!,
        length: itemInput.length!,
        quantity: itemInput.quantity
      });
      ruleUsed = formulaType;
    } else {
      cft = runRuleEngine("size_cut", {
        length: itemInput.length!,
        width: itemInput.width!,
        thickness: itemInput.thickness!,
        quantity: itemInput.quantity
      });
      ruleUsed = "size_cut";
    }

    const item: IMeasurementItem = { ...itemInput, cft, ruleUsed } as IMeasurementItem;
    group.items.push(item);
    group.totalCFT = group.items.reduce((sum, it) => sum + it.cft, 0);
    group.totalPrice = group.totalCFT * group.ratePerCFT;
    group.dueAmount = Math.max(0, group.totalPrice - group.paidAmount);
    await group.save();
    return group;
  },

  async removeItem(owner: string, groupId: string, itemId: string) {
    const group = await Measurement.findOne({ _id: groupId, owner, status: "open" });
    if (!group) throw ApiError.notFound("Open measurement group not found");

    group.items = group.items.filter((it: any) => it._id.toString() !== itemId) as any;
    group.totalCFT = group.items.reduce((sum, it) => sum + it.cft, 0);
    group.totalPrice = group.totalCFT * group.ratePerCFT;
    group.dueAmount = Math.max(0, group.totalPrice - group.paidAmount);
    await group.save();
    return group;
  },

  async close(owner: string, groupId: string, ratePerCFT: number, paidAmount: number) {
    const group = await Measurement.findOne({ _id: groupId, owner });
    if (!group) throw ApiError.notFound("Measurement group not found");

    group.ratePerCFT = ratePerCFT;
    group.totalPrice = group.totalCFT * ratePerCFT;
    group.paidAmount = paidAmount;
    group.dueAmount = Math.max(0, group.totalPrice - paidAmount);
    group.status = "closed";
    await group.save();
    return group;
  },

  async reopen(owner: string, groupId: string) {
    const group = await Measurement.findOneAndUpdate(
      { _id: groupId, owner },
      { status: "open" },
      { new: true }
    );
    if (!group) throw ApiError.notFound("Measurement group not found");
    return group;
  },

  async listOpenGroups(owner: string) {
    return Measurement.find({ owner, status: "open" }).sort({ createdAt: -1 });
  },

  async history(owner: string, page = 1, limit = 10, search?: string) {
    const filter: Record<string, unknown> = { owner, status: "closed" };
    if (search) {
      filter.$or = [
        { customerName: { $regex: search, $options: "i" } },
        { slipNumber: { $regex: search, $options: "i" } }
      ];
    }

    const [items, total] = await Promise.all([
      Measurement.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Measurement.countDocuments(filter)
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },
  async dailyBook(owner: string, dateStr: string) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const records = await Measurement.find({
      owner,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: 1 });

    const grandTotalCFT = records.reduce((s, r) => s + r.totalCFT, 0);
    const grandTotalPrice = records.reduce((s, r) => s + r.totalPrice, 0);   

    return { date: dateStr, records, grandTotalCFT, grandTotalPrice };
  },
  async getById(owner: string, id: string) {
    const group = await Measurement.findOne({ _id: id, owner });
    if (!group) throw ApiError.notFound("Measurement not found");
    return group;
  },

  async remove(owner: string, id: string) {
    const group = await Measurement.findOneAndDelete({ _id: id, owner });
    if (!group) throw ApiError.notFound("Measurement not found");
    return group;
  }
};