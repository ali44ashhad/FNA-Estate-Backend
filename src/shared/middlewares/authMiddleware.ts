import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../utils/jwt";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  void res;

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw new AppError("Unauthorized", 401);
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new AppError("Unauthorized", 401);
  }

  let decoded: unknown;
  try {
    decoded = verifyAccessToken(token);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "name" in err) {
      const name = (err as { name?: unknown }).name;
      if (name === "TokenExpiredError") {
        throw new AppError("Access token expired", 401);
      }
      if (name === "JsonWebTokenError" || name === "NotBeforeError") {
        throw new AppError("Invalid access token", 401);
      }
    }
    throw err;
  }
  if (typeof decoded !== "object" || decoded === null) {
    throw new AppError("Invalid access token", 401);
  }

  const payload = decoded as { id?: unknown; role?: unknown };
  if (typeof payload.id !== "string" || typeof payload.role !== "string") {
    throw new AppError("Invalid access token", 401);
  }

  req.user = { id: payload.id, role: payload.role };
  next();
};

