import { Router } from "express";
import * as Controller from "../controllers/sale.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { createSaleSchema, updateSaleSchema } from "../validators/sale.validator";

const router = Router();
router.use(authenticate);

router.get("/summary/product-wise", Controller.productWiseSummary);
router.get("/graph/revenue", Controller.revenueGraph);
router.get("/", Controller.list);
router.post("/", validate(createSaleSchema), Controller.create);
router.patch("/:id", validate(updateSaleSchema), Controller.update);
router.delete("/:id", Controller.remove);

export default router;
