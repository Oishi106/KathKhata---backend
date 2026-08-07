import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { CustomerService } from "../services/customer.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CustomerService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "গ্রাহক যোগ হয়েছে", customer);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status } = req.query;
  const { items, meta } = await CustomerService.list(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    status: status as string
  });
  return sendSuccess(res, 200, "গ্রাহক তালিকা", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CustomerService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "গ্রাহক বিবরণ", customer);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CustomerService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "আপডেট হয়েছে", customer);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await CustomerService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "মুছে ফেলা হয়েছে");
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const customer = await CustomerService.addPayment(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "পেমেন্ট রেকর্ড হয়েছে", customer);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const data = await CustomerService.stats(req.user!.userId);
  return sendSuccess(res, 200, "গ্রাহক পরিসংখ্যান", data);
});