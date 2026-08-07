import mongoose from "mongoose";
import { Purchase, IPurchase } from "../models/purchase.model";
import { WoodInventory } from "../../wood-inventory/models/woodInventory.model";
import { Supplier } from "../../supplier/models/supplier.model";
import { ApiError } from "../../../utils/ApiError";
import type { CreatePurchaseInput, UpdatePurchaseInput } from "../validators/purchase.validator";

export class PurchaseService {
  static async createPurchase(ownerId: string, input: CreatePurchaseInput): Promise<IPurchase> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const supplier = await Supplier.findOne({ _id: input.supplier, owner: ownerId }).session(session);
      if (!supplier) {
        throw ApiError.notFound("সরবরাহকারী পাওয়া যায়নি");
      }

      const [purchase] = await Purchase.create(
        [
          {
            ...input,
            purchaseDate: input.purchaseDate ?? new Date(),
            owner: ownerId
          }
        ],
        { session }
      );

      await WoodInventory.create(
        [
          {
            owner: ownerId,
            woodType: purchase.woodType,
            supplier: supplier.name,
            purchaseDate: purchase.purchaseDate,
            purchasePrice: purchase.grandTotal,
            transportCost: purchase.transportCost,
            totalCFT: purchase.totalCFT,
            availableCFT: purchase.totalCFT,
            notes: purchase.notes
          }
        ],
        { session }
      );

      if (purchase.dueAmount > 0) {
        supplier.totalDue = (supplier.totalDue ?? 0) + purchase.dueAmount;
      }

      if (purchase.paidAmount > 0) {
        supplier.paymentHistory.push({
          amount: purchase.paidAmount,
          date: purchase.purchaseDate,
          method: purchase.paymentMethod,
          note: `ক্রয় বাবদ পরিশোধ${purchase.invoiceNumber ? ` (চালান #${purchase.invoiceNumber})` : ""}`
        });
      }

      if (purchase.dueAmount > 0 || purchase.paidAmount > 0) {
        await supplier.save({ session });
      }

      await session.commitTransaction();
      return purchase;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  }

  static async getAllPurchases(ownerId: string, filters: { supplier?: string; from?: string; to?: string } = {}) {
    const query: Record<string, unknown> = { owner: ownerId };
    if (filters.supplier) query.supplier = filters.supplier;
    if (filters.from || filters.to) {
      query.purchaseDate = {
        ...(filters.from ? { $gte: new Date(filters.from) } : {}),
        ...(filters.to ? { $lte: new Date(filters.to) } : {})
      };
    }

    return Purchase.find(query).populate("supplier", "name phone totalDue").sort({ purchaseDate: -1 });
  }

  static async getPurchaseById(ownerId: string, id: string) {
    const purchase = await Purchase.findOne({ _id: id, owner: ownerId }).populate(
      "supplier",
      "name phone address totalDue"
    );
    if (!purchase) throw ApiError.notFound("ক্রয় রেকর্ড পাওয়া যায়নি");
    return purchase;
  }

  static async updatePurchase(ownerId: string, id: string, input: UpdatePurchaseInput) {
    const purchase = await Purchase.findOne({ _id: id, owner: ownerId });
    if (!purchase) throw ApiError.notFound("ক্রয় রেকর্ড পাওয়া যায়নি");

    Object.assign(purchase, input);
    await purchase.save();
    return purchase;
  }

  static async deletePurchase(ownerId: string, id: string) {
    const purchase = await Purchase.findOne({ _id: id, owner: ownerId });
    if (!purchase) throw ApiError.notFound("ক্রয় রেকর্ড পাওয়া যায়নি");
    await purchase.deleteOne();
    return purchase;
  }
}