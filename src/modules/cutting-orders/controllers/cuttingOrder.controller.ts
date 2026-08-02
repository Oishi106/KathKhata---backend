import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { CuttingOrderService } from "../services/cuttingOrder.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const order = await CuttingOrderService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "Cutting order created", order);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, status } = req.query;
  const { items, meta } = await CuttingOrderService.list(
    req.user!.userId,
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    status as string
  );
  return sendSuccess(res, 200, "Cutting orders fetched", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const order = await CuttingOrderService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Cutting order fetched", order);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const order = await CuttingOrderService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Cutting order updated", order);
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const order = await CuttingOrderService.updateStatus(req.user!.userId, req.params.id, req.body.status);
  return sendSuccess(res, 200, "Cutting order status updated", order);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await CuttingOrderService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Cutting order deleted");
});

export const previewCFT = asyncHandler(async (req: Request, res: Response) => {
  const { length, width, thickness, quantity, ratePerCFT } = req.body;
  const result = CuttingOrderService.previewCFT(length, width, thickness, quantity, ratePerCFT);
  return sendSuccess(res, 200, "CFT preview calculated", result);
});
