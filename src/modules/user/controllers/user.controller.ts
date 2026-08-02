import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { UserService } from "../services/user.service";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.getProfile(req.user!.userId);
  return sendSuccess(res, 200, "Profile fetched", user);
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await UserService.updateProfile(req.user!.userId, req.body);
  return sendSuccess(res, 200, "Profile updated", user);
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const result = await UserService.changePassword(req.user!.userId, currentPassword, newPassword);
  return sendSuccess(res, 200, "Password changed successfully", result);
});
