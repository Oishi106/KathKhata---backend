import { Router } from "express";
import * as Controller from "../controllers/employee.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeIdParamSchema,
  markAttendanceSchema,
  addPaymentSchema
} from "../validators/employee.validator";

const router = Router();
router.use(authenticate);

router.get("/stats", Controller.stats);
router.get("/", Controller.list);
router.get("/:id", validate(employeeIdParamSchema), Controller.getById);
router.post("/", validate(createEmployeeSchema), Controller.create);
router.patch("/:id", validate(updateEmployeeSchema), Controller.update);
router.delete("/:id", validate(employeeIdParamSchema), Controller.remove);
router.post("/:id/attendance", validate(markAttendanceSchema), Controller.markAttendance);
router.post("/:id/payments", validate(addPaymentSchema), Controller.addPayment);

export default router;