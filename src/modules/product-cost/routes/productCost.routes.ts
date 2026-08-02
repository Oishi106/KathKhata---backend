import { Router } from "express";
import * as Controller from "../controllers/productCost.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { calculateSchema } from "../validators/productCost.validator";

const router = Router();
router.use(authenticate);

router.post("/calculate", validate(calculateSchema), Controller.calculate);

export default router;
