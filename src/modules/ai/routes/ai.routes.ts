import { Router } from "express";
import * as Controller from "../controllers/ai.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { askSchema } from "../validators/ai.validator";

const router = Router();
router.use(authenticate);

router.get("/conversations", Controller.listConversations);
router.get("/conversations/:id", Controller.getConversation);
router.post("/ask", validate(askSchema), Controller.ask);
router.get("/quick-insights", Controller.quickInsights);
router.get("/suggested-questions", Controller.suggestedQuestions);

export default router;
