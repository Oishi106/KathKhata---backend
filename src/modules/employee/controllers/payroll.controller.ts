import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { PayrollService } from "../services/payroll.service";

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollService.generate(req.user!.userId, req.body);
  return sendSuccess(res, 201, "পে-রোল তৈরি হয়েছে", payroll);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { employee, month, year } = req.query as { employee?: string; month?: string; year?: string };
  const payrolls = await PayrollService.list(req.user!.userId, {
    employee,
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined
  });
  return sendSuccess(res, 200, "পে-রোল তালিকা", payrolls);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollService.getById(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "পে-রোল বিবরণ", payroll);
});

export const adjust = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollService.adjust(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "সমন্বয় করা হয়েছে", payroll);
});

export const confirmPay = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollService.confirmPay(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "বেতন পরিশোধ সম্পন্ন হয়েছে", payroll);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await PayrollService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "মুছে ফেলা হয়েছে");
});