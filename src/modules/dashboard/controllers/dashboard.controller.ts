import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { DashboardService } from "../services/dashboard.service";

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const data = await DashboardService.summary(req.user!.userId);
  return sendSuccess(res, 200, "Dashboard summary fetched", data);
});

export const recentActivity = asyncHandler(async (req: Request, res: Response) => {
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const data = await DashboardService.recentActivity(req.user!.userId, limit);
  return sendSuccess(res, 200, "Recent activity fetched", data);
});

export const chartsData = asyncHandler(async (req: Request, res: Response) => {
  const days = req.query.days ? Number(req.query.days) : 30;
  const data = await DashboardService.chartsData(req.user!.userId, days);
  return sendSuccess(res, 200, "Charts data fetched", data);
});
