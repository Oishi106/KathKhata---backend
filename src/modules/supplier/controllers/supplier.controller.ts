import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { SupplierService } from "../services/supplier.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await SupplierService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "Supplier created", supplier);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status } = req.query;
  const { items, meta } = await SupplierService.list(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    status: status as string
  });
  return sendSuccess(res, 200, "Suppliers fetched", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await SupplierService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Supplier fetched", supplier);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await SupplierService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Supplier updated", supplier);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await SupplierService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Supplier deleted");
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const supplier = await SupplierService.addPayment(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Payment recorded", supplier);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const data = await SupplierService.stats(req.user!.userId);
  return sendSuccess(res, 200, "Supplier stats fetched", data);
});