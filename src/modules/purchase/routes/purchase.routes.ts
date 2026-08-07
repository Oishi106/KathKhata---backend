import { Router } from "express";
import * as Controller from "../controllers/purchase.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  createPurchaseSchema,
  updatePurchaseSchema,
  purchaseIdParamSchema
} from "../validators/purchase.validator";

const router = Router();
router.use(authenticate);

router.get("/", Controller.list);
router.get("/:id", validate(purchaseIdParamSchema), Controller.getById);
router.post("/", validate(createPurchaseSchema), Controller.create);
router.patch("/:id", validate(updatePurchaseSchema), Controller.update);
router.delete("/:id", validate(purchaseIdParamSchema), Controller.remove);
router.get("/:id/invoice", validate(purchaseIdParamSchema), Controller.downloadInvoice);

export default router;