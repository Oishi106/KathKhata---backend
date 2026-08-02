import { Router } from "express";
import * as Controller from "../controllers/dashboard.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/summary", Controller.summary);
router.get("/recent-activity", Controller.recentActivity);
router.get("/charts", Controller.chartsData);

export default router;
