import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { SettingsService } from "../services/settings.service";

export const get = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SettingsService.getOrCreate(req.user!.userId);
  return sendSuccess(res, 200, "সেটিংস", settings);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const settings = await SettingsService.update(req.user!.userId, req.body);
  return sendSuccess(res, 200, "সেটিংস আপডেট হয়েছে", settings);
});