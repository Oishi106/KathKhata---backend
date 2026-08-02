import { Router } from "express";
import * as Controller from "../controllers/expense.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { createExpenseSchema, updateExpenseSchema } from "../validators/expense.validator";

const router = Router();
router.use(authenticate);

router.get("/summary/monthly", Controller.monthlySummary);
router.get("/", Controller.list);
router.post("/", validate(createExpenseSchema), Controller.create);
router.patch("/:id", validate(updateExpenseSchema), Controller.update);
router.delete("/:id", Controller.remove);

export default router;
