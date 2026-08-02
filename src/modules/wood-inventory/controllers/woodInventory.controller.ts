import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { WoodInventoryService } from "../services/woodInventory.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await WoodInventoryService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "Wood inventory item created", item);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status, sortBy, order } = req.query;
  const { items, meta } = await WoodInventoryService.list(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    status: status as string,
    sortBy: sortBy as string,
    order: order as "asc" | "desc"
  });
  return sendSuccess(res, 200, "Wood inventory list fetched", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const item = await WoodInventoryService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Wood inventory item fetched", item);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await WoodInventoryService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Wood inventory item updated", item);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await WoodInventoryService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Wood inventory item deleted");
});

export const lowStock = asyncHandler(async (req: Request, res: Response) => {
  const items = await WoodInventoryService.lowStock(req.user!.userId);
  return sendSuccess(res, 200, "Low stock items fetched", items);
});
