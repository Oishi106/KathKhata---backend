import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { ExpenseService } from "../services/expense.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await ExpenseService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "Expense recorded", item);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, category, from, to } = req.query;
  const { items, meta } = await ExpenseService.list(
    req.user!.userId,
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    category as string,
    from as string,
    to as string
  );
  return sendSuccess(res, 200, "Expenses fetched", items, meta);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await ExpenseService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Expense updated", item);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await ExpenseService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Expense deleted");
});

export const monthlySummary = asyncHandler(async (req: Request, res: Response) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const summary = await ExpenseService.monthlySummary(req.user!.userId, year);
  return sendSuccess(res, 200, "Monthly expense summary fetched", summary);
});
