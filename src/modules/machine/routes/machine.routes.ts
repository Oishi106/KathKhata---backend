import { Router } from "express";
import * as Controller from "../controllers/machine.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  createMachineSchema,
  updateMachineSchema,
  machineIdParamSchema,
  addMaintenanceSchema
} from "../validators/machine.validator";

const router = Router();
router.use(authenticate);

router.get("/stats", Controller.stats);
router.get("/", Controller.list);
router.get("/:id", validate(machineIdParamSchema), Controller.getById);
router.post("/", validate(createMachineSchema), Controller.create);
router.patch("/:id", validate(updateMachineSchema), Controller.update);
router.delete("/:id", validate(machineIdParamSchema), Controller.remove);
router.post("/:id/maintenance", validate(addMaintenanceSchema), Controller.addMaintenance);

export default router;