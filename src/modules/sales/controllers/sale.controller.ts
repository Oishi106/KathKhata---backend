import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { SaleService } from "../services/sale.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const item = await SaleService.create(req.user!.userId, req.body);
  return sendSuccess(res, 201, "Sale recorded", item);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, from, to } = req.query;
  const { items, meta } = await SaleService.list(
    req.user!.userId,
    page ? Number(page) : undefined,
    limit ? Number(limit) : undefined,
    from as string,
    to as string
  );
  return sendSuccess(res, 200, "Sales fetched", items, meta);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const item = await SaleService.update(req.user!.userId, req.params.id, req.body);
  return sendSuccess(res, 200, "Sale updated", item);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await SaleService.remove(req.user!.userId, req.params.id);
  return sendSuccess(res, 200, "Sale deleted");
});

export const productWiseSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await SaleService.productWiseSummary(req.user!.userId);
  return sendSuccess(res, 200, "Product-wise sales summary fetched", summary);
});

export const revenueGraph = asyncHandler(async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(req.query.from as string) : new Date(new Date().getFullYear(), 0, 1);
  const to = req.query.to ? new Date(req.query.to as string) : new Date();
  const data = await SaleService.revenueGraph(req.user!.userId, from, to);
  return sendSuccess(res, 200, "Revenue/profit graph data fetched", data);
});
