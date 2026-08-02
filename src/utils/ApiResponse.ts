import { Response } from "express";

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data?: T,
  meta?: Meta
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
    meta: meta ?? undefined
  });
};
