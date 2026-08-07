import { Router } from "express";
import * as Controller from "../controllers/supplier.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { createSupplierSchema, updateSupplierSchema, addPaymentSchema } from "../validators/supplier.validator";

const router = Router();
router.use(authenticate);

router.get("/stats", Controller.stats);
router.get("/", Controller.list);
router.get("/:id", Controller.getById);
router.post("/", validate(createSupplierSchema), Controller.create);
router.patch("/:id", validate(updateSupplierSchema), Controller.update);
router.delete("/:id", Controller.remove);
router.post("/:id/payments", validate(addPaymentSchema), Controller.addPayment);

export default router;