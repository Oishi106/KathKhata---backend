import { Router } from "express";
import * as Controller from "../controllers/payroll.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { generatePayrollSchema, payrollIdParamSchema, adjustPayrollSchema } from "../validators/payroll.validator";

const router = Router();
router.use(authenticate);

router.get("/", Controller.list);
router.get("/:id", validate(payrollIdParamSchema), Controller.getById);
router.post("/generate", validate(generatePayrollSchema), Controller.generate);
router.patch("/:id/adjust", validate(adjustPayrollSchema), Controller.adjust);
router.post("/:id/confirm-pay", validate(payrollIdParamSchema), Controller.confirmPay);
router.delete("/:id", validate(payrollIdParamSchema), Controller.remove);

export default router;