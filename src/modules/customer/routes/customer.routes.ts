import { Router } from "express";
import * as Controller from "../controllers/customer.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdParamSchema,
  addPaymentSchema
} from "../validators/customer.validator";

const router = Router();
router.use(authenticate);

router.get("/stats", Controller.stats);
router.get("/", Controller.list);
router.get("/:id", validate(customerIdParamSchema), Controller.getById);
router.post("/", validate(createCustomerSchema), Controller.create);
router.patch("/:id", validate(updateCustomerSchema), Controller.update);
router.delete("/:id", validate(customerIdParamSchema), Controller.remove);
router.post("/:id/payments", validate(addPaymentSchema), Controller.addPayment);

export default router;