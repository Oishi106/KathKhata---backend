import cron from "node-cron";
import { WoodInventory } from "../modules/wood-inventory/models/woodInventory.model";
import { logger } from "../utils/logger";

// Runs every day at 8:00 AM server time — recalculates status flags and
// logs a summary. Extend this to push notifications/SMS in the future.
cron.schedule("0 8 * * *", async () => {
  try {
    const lowStockItems = await WoodInventory.find({ status: { $in: ["low_stock", "out_of_stock"] } });
    if (lowStockItems.length > 0) {
      logger.info(`[cron] ${lowStockItems.length} wood inventory item(s) are low/out of stock`);
    }
  } catch (err) {
    logger.error(`[cron] low stock check failed: ${(err as Error).message}`);
  }
});
