import { Router } from "express";
import authRoutes from "../modules/auth/routes/auth.routes";
import userRoutes from "../modules/user/routes/user.routes";
import woodInventoryRoutes from "../modules/wood-inventory/routes/woodInventory.routes";
import cuttingOrderRoutes from "../modules/cutting-orders/routes/cuttingOrder.routes";
import expenseRoutes from "../modules/expense/routes/expense.routes";
import saleRoutes from "../modules/sales/routes/sale.routes";
import productCostRoutes from "../modules/product-cost/routes/productCost.routes";
import dashboardRoutes from "../modules/dashboard/routes/dashboard.routes";
import aiRoutes from "../modules/ai/routes/ai.routes";
import notificationRoutes from "../modules/notification/routes/notification.routes";
import supplierRoutes from "../modules/supplier/routes/supplier.routes";
import purchaseRoutes from "../modules/purchase/routes/purchase.routes";
import customerRoutes from "../modules/customer/routes/customer.routes";
import measurementRoutes from "../modules/wood-measurement/routes/measurement.routes";
import machineRoutes from "../modules/machine/routes/machine.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/wood-inventory", woodInventoryRoutes);
router.use("/cutting-orders", cuttingOrderRoutes);
router.use("/expenses", expenseRoutes);
router.use("/sales", saleRoutes);
router.use("/product-cost", productCostRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/ai", aiRoutes);
router.use("/notifications", notificationRoutes);
router.use("/suppliers", supplierRoutes);
router.use("/purchases", purchaseRoutes);
router.use("/customers", customerRoutes);
router.use("/wood-measurement", measurementRoutes);
router.use("/machines", machineRoutes);

export default router;