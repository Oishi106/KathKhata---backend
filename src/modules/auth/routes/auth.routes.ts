import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { validate } from "../../../middlewares/validate.middleware";
import { authenticate } from "../../../middlewares/auth.middleware";
import { authLimiter } from "../../../middlewares/rateLimiter.middleware";
import {
  registerSchema,
  loginSchema,
  otpVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../validators/auth.validator";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post("/register", authLimiter, validate(registerSchema), AuthController.register);
router.post("/verify-otp", authLimiter, validate(otpVerifySchema), AuthController.verifyOtp);
router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/logout", authenticate, AuthController.logout);
router.post(
  "/forgot-password",
  authLimiter,
  validate(forgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validate(resetPasswordSchema),
  AuthController.resetPassword
);

export default router;
