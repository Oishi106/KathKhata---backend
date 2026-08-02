import { Router } from "express";
import * as Controller from "../controllers/user.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { updateProfileSchema, changePasswordSchema } from "../validators/user.validator";

const router = Router();
router.use(authenticate);

router.get("/me", Controller.getProfile);
router.patch("/me", validate(updateProfileSchema), Controller.updateProfile);
router.post("/change-password", validate(changePasswordSchema), Controller.changePassword);

export default router;
