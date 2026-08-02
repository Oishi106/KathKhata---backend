import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { AuthService } from "../services/auth.service";
import { ApiError } from "../../../utils/ApiError";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.register(req.body);
  return sendSuccess(res, 201, "Registration successful. OTP sent for verification.", result);
});

export const verifyOtp = asyncHandler(async (req: Request, res: Response) => {
  const { phone, otp } = req.body;
  const result = await AuthService.verifyOtp(phone, otp);
  return sendSuccess(res, 200, "Phone number verified successfully", result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const { accessToken, refreshToken, user } = await AuthService.login(phone, password);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

  return sendSuccess(res, 200, "Login successful", { accessToken, user });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) throw ApiError.unauthorized("Refresh token missing");

  const { accessToken, refreshToken: newRefreshToken } = await AuthService.refresh(token);

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", newRefreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

  return sendSuccess(res, 200, "Token refreshed", { accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (req.user && token) {
    await AuthService.logout(req.user.userId, token);
  }
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return sendSuccess(res, 200, "Logged out successfully");
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const result = await AuthService.forgotPassword(req.body.phone);
  return sendSuccess(res, 200, "Password reset instructions sent", result);
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { phone, token, newPassword } = req.body;
  const result = await AuthService.resetPassword(phone, token, newPassword);
  return sendSuccess(res, 200, "Password reset successful", result);
});
