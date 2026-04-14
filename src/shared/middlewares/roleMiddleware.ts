import type { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";

export const roleMiddleware =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    void res;

    const role = req.user?.role;
    if (!role) {
      throw new AppError("Unauthorized", 401);
    }

    if (!roles.includes(role)) {
      throw new AppError("Forbidden", 403);
    }

    next();
  };

