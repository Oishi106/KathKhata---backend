import { Router } from "express";
import * as Controller from "../controllers/notification.controller";
import { authenticate } from "../../../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/", Controller.list);

export default router;