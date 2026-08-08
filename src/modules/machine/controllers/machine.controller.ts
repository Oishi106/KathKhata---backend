import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { MachineService } from "../services/machine.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const machine = await MachineService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "মেশিন যোগ হয়েছে", machine);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status } = req.query;
  const { items, meta } = await MachineService.list(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    status: status as string
  });
  return sendSuccess(res, 200, "মেশিন তালিকা", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const machine = await MachineService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "মেশিন বিবরণ", machine);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const machine = await MachineService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "আপডেট হয়েছে", machine);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await MachineService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "মুছে ফেলা হয়েছে");
});

export const addMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const machine = await MachineService.addMaintenance(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "মেইনটেন্যান্স রেকর্ড হয়েছে", machine);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const data = await MachineService.stats(req.user!.userId);
  return sendSuccess(res, 200, "মেশিন পরিসংখ্যান", data);
});