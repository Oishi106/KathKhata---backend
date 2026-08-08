import { Router } from "express";
import * as Controller from "../controllers/settings.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { updateSettingsSchema } from "../validators/settings.validator";

const router = Router();
router.use(authenticate);

router.get("/", Controller.get);
router.patch("/", validate(updateSettingsSchema), Controller.update);

export default router;