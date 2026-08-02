import { Request, Response } from "express";
import { asyncHandler } from "../../../utils/asyncHandler";
import { sendSuccess } from "../../../utils/ApiResponse";
import { ProductCostService } from "../services/productCost.service";

export const calculate = asyncHandler(async (req: Request, res: Response) => {
  const result = ProductCostService.calculate(req.body);
  return sendSuccess(res, 200, "Product cost calculated", result);
});
