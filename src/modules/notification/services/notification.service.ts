import { WoodInventory } from "../../wood-inventory/models/woodInventory.model";
import { CuttingOrder } from "../../cutting-orders/models/cuttingOrder.model";

export interface NotificationItem {
  id: string;
  type: "low_stock" | "out_of_stock" | "pending_order";
  createdAt: Date;
  data: {
    woodType?: string;
    availableCFT?: number;
    customerName?: string;
  };
}

export const NotificationService = {
  async list(owner: string): Promise<NotificationItem[]> {
    const [lowStockItems, pendingOrders] = await Promise.all([
      WoodInventory.find({ owner, status: { $in: ["low_stock", "out_of_stock"] } }).sort({ updatedAt: -1 }),
      CuttingOrder.find({ owner, status: "pending" }).sort({ createdAt: -1 }).limit(10)
    ]);

    const notifications: NotificationItem[] = [];

    lowStockItems.forEach((item) => {
      notifications.push({
        id: `wood-${item._id}`,
        type: item.status === "out_of_stock" ? "out_of_stock" : "low_stock",
        createdAt: item.updatedAt,
        data: { woodType: item.woodType, availableCFT: item.availableCFT }
      });
    });

    pendingOrders.forEach((order) => {
      notifications.push({
        id: `order-${order._id}`,
        type: "pending_order",
        createdAt: order.createdAt,
        data: { customerName: order.customerName }
      });
    });

    return notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
  }
};