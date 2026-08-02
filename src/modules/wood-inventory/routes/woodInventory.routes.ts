import { Router } from "express";
import * as Controller from "../controllers/woodInventory.controller";
import { authenticate } from "../../../middlewares/auth.middleware";
import { validate } from "../../../middlewares/validate.middleware";
import { createWoodSchema, updateWoodSchema } from "../validators/woodInventory.validator";

const router = Router();

router.use(authenticate);

router.get("/low-stock", Controller.lowStock);
router.get("/", Controller.list);
router.get("/:id", Controller.getById);
router.post("/", validate(createWoodSchema), Controller.create);
router.patch("/:id", validate(updateWoodSchema), Controller.update);
router.delete("/:id", Controller.remove);

export default router;
