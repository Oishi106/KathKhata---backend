import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { NotificationService } from "../services/notification.service";

export const list = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await NotificationService.list(req.user!.userId);
  return sendSuccess(res, 200, "Notifications fetched", notifications);
});