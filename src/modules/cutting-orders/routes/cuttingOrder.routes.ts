import { Router } from "express";
import * as Controller from "../controllers/cuttingOrder.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  createOrderSchema,
  updateOrderSchema,
  updateStatusSchema,
  previewCFTSchema
} from "../validators/cuttingOrder.validator";

const router = Router();
router.use(authenticate);

router.post("/preview-cft", validate(previewCFTSchema), Controller.previewCFT);
router.get("/", Controller.list);
router.get("/:id", Controller.getById);
router.post("/", validate(createOrderSchema), Controller.create);
router.patch("/:id", validate(updateOrderSchema), Controller.update);
router.patch("/:id/status", validate(updateStatusSchema), Controller.updateStatus);
router.delete("/:id", Controller.remove);

export default router;
