import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { EmployeeService } from "../services/employee.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "কর্মচারী যোগ হয়েছে", employee);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, search, status } = req.query;
  const { items, meta } = await EmployeeService.list(req.user!.userId, {
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    search: search as string,
    status: status as string
  });
  return sendSuccess(res, 200, "কর্মচারী তালিকা", items, meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "কর্মচারী বিবরণ", employee);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "আপডেট হয়েছে", employee);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await EmployeeService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "মুছে ফেলা হয়েছে");
});

export const markAttendance = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeService.markAttendance(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "হাজিরা রেকর্ড হয়েছে", employee);
});

export const addPayment = asyncHandler(async (req: Request, res: Response) => {
  const employee = await EmployeeService.addPayment(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "লেনদেন রেকর্ড হয়েছে", employee);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const data = await EmployeeService.stats(req.user!.userId);
  return sendSuccess(res, 200, "কর্মচারী পরিসংখ্যান", data);
});