import { Router } from "express";
import * as Controller from "../controllers/ai.controller";
import { voiceParse } from "../controllers/voiceEntry.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { askSchema } from "../validators/ai.validator";
import { voiceParseSchema } from "../validators/voiceEntry.validator";

const router = Router();
router.use(authenticate);

router.get("/conversations", Controller.listConversations);
router.get("/conversations/:id", Controller.getConversation);            
router.patch("/conversations/:id", Controller.renameConversation);
router.delete("/conversations/:id", Controller.deleteConversation);
router.post("/ask", validate(askSchema), Controller.ask);
router.get("/quick-insights", Controller.quickInsights);
router.get("/suggested-questions", Controller.suggestedQuestions);
router.post("/voice-parse", validate(voiceParseSchema), voiceParse);

export default router;             