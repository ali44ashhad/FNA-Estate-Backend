import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  void req;
  void next;

  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: err.flatten()
    });
  }

  if (typeof err === "object" && err !== null && "name" in err) {
    const name = (err as { name?: unknown }).name;
    if (name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Access token expired",
        error: null
      });
    }
    if (name === "JsonWebTokenError" || name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token",
        error: null
      });
    }
  }

  if (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === 11000
  ) {
    const duplicate = err as { keyValue?: Record<string, unknown> };
    const fields = duplicate.keyValue ? Object.keys(duplicate.keyValue) : [];

    return res.status(400).json({
      success: false,
      message: fields.length ? `Duplicate value for: ${fields.join(", ")}` : "Duplicate value",
      error: duplicate.keyValue ?? null
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.details ?? null
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: null
  });
};

