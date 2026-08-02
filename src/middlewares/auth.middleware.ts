import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAccessToken, JwtPayload } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies?.accessToken;

    if (!token) throw ApiError.unauthorized("Access token missing");

    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
};

export const authorize = (...roles: Array<"mill_owner" | "admin">) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden("Insufficient permissions"));
    next();
  };
};
