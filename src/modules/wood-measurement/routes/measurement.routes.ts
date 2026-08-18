import { Router } from "express";
import * as Controller from "../controllers/measurement.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import {
  startMeasurementSchema,
  addItemSchema,
  closeMeasurementSchema,
  createRuleSchema
} from "../validators/measurement.validator";

const router = Router();
router.use(authenticate);

// Rules
router.get("/rules", Controller.listRules);
router.post("/rules", validate(createRuleSchema), Controller.createRule);
router.patch("/rules/:id", Controller.updateRule);

// Notebook groups
router.get("/groups/open", Controller.listOpenGroups);
router.post("/groups", validate(startMeasurementSchema), Controller.startGroup);
router.post("/groups/:groupId/items", validate(addItemSchema), Controller.addItem);
router.delete("/groups/:groupId/items/:itemId", Controller.removeItem);
router.post("/groups/:groupId/close", validate(closeMeasurementSchema), Controller.closeGroup);
router.post("/groups/:groupId/reopen", Controller.reopenGroup);

// Daily book
router.post("/bulk-pdf", Controller.bulkPdf);                     
router.get("/daily-book", Controller.dailyBook);            
router.get("/daily-book/pdf", Controller.downloadDailyBook);                           

// Voice/text parsing
router.post("/voice-parse", Controller.parseVoice);              

// History & single record
router.get("/history", Controller.history);                  
router.get("/:id", Controller.getById);
router.get("/:id/slip", Controller.downloadSlip);     
router.delete("/:id", Controller.remove);     

export default router;