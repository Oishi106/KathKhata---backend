import { Types } from "mongoose";
import { Sale } from "../../sales/models/sale.model";
import { Expense } from "../../expense/models/expense.model";
import { WoodInventory } from "../../wood-inventory/models/woodInventory.model";
import { CuttingOrder } from "../../cutting-orders/models/cuttingOrder.model";

const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);

export const DashboardService = {
  async summary(owner: string) {
    const ownerId = new Types.ObjectId(owner);
    const today = { $gte: startOfDay(), $lte: endOfDay() };
    const month = { $gte: startOfMonth() };

    const [
      todaySales,
      todayExpenses,
      monthSales,
      monthExpenses,
      availableWood,
      pendingOrders,
      completedOrders,
      lowStockCount
    ] = await Promise.all([
      Sale.aggregate([
        { $match: { owner: ownerId, date: today } },
        { $group: { _id: null, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" } } }
      ]),
      Expense.aggregate([
        { $match: { owner: ownerId, date: today } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      Sale.aggregate([
        { $match: { owner: ownerId, date: month } },
        { $group: { _id: null, revenue: { $sum: "$totalRevenue" }, profit: { $sum: "$profit" } } }
      ]),
      Expense.aggregate([
        { $match: { owner: ownerId, date: month } },
        { $group: { _id: null, total: { $sum: "$amount" } } }
      ]),
      WoodInventory.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: null, totalCFT: { $sum: "$availableCFT" } } }
      ]),
      CuttingOrder.countDocuments({ owner: ownerId, status: { $in: ["pending", "in_progress"] } }),
      CuttingOrder.countDocuments({ owner: ownerId, status: "completed" }),
      WoodInventory.countDocuments({ owner: ownerId, status: { $in: ["low_stock", "out_of_stock"] } })
    ]);

    const todayRevenue = todaySales[0]?.revenue ?? 0;
    const todayExpenseTotal = todayExpenses[0]?.total ?? 0;
    const monthlyRevenue = monthSales[0]?.revenue ?? 0;
    const monthlyExpenseTotal = monthExpenses[0]?.total ?? 0;

    return {
      todayRevenue,
      todayExpense: todayExpenseTotal,
      todayProfit: todayRevenue - todayExpenseTotal,
      availableWoodCFT: availableWood[0]?.totalCFT ?? 0,
      pendingOrders,
      completedOrders,
      monthlyProfit: monthlyRevenue - monthlyExpenseTotal,
      lowStockAlerts: lowStockCount
    };
  },

  async recentActivity(owner: string, limit = 10) {
    const ownerId = new Types.ObjectId(owner);
    const [sales, expenses, orders] = await Promise.all([
      Sale.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(limit),
      Expense.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(limit),
      CuttingOrder.find({ owner: ownerId }).sort({ createdAt: -1 }).limit(limit)
    ]);

    const combined = [
      ...sales.map((s) => ({ type: "sale", createdAt: s.createdAt, data: s })),
      ...expenses.map((e) => ({ type: "expense", createdAt: e.createdAt, data: e })),
      ...orders.map((o) => ({ type: "cutting_order", createdAt: o.createdAt, data: o }))
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return combined.slice(0, limit);
  },

  async chartsData(owner: string, days = 30) {
    const ownerId = new Types.ObjectId(owner);
    const from = new Date();
    from.setDate(from.getDate() - days);

    const [revenueByDay, expenseByDay] = await Promise.all([
      Sale.aggregate([
        { $match: { owner: ownerId, date: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            revenue: { $sum: "$totalRevenue" },
            profit: { $sum: "$profit" }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Expense.aggregate([
        { $match: { owner: ownerId, date: { $gte: from } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            total: { $sum: "$amount" }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    return { revenueByDay, expenseByDay };
  }
};
