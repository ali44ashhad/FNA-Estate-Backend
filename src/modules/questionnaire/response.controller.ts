import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { submitResponseSchema } from "./response.dto";
import * as ResponseService from "./response.service";

export const submitResponses = async (req: Request, res: Response) => {
  const input = submitResponseSchema.parse(req.body);
  const userId = req.user?.id;
  if (!userId) throw new AppError("Unauthorized", 401);

  const result = await ResponseService.submitResponses(userId, input.responses);

  res.json({
    success: true,
    message: "Responses saved",
    data: result
  });
};

