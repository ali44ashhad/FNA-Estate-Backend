import type { Request, Response } from "express";
import { AppError } from "../../shared/errors/AppError";
import { createVisitSchema, updateVisitSchema, updateVisitStatusSchema } from "./visit.dto";
import * as VisitService from "./visit.service";

export const createVisit = async (req: Request, res: Response) => {
  const input = createVisitSchema.parse(req.body);
  const visit = await VisitService.createVisit(input);

  res.json({
    success: true,
    message: "Visit scheduled",
    data: visit
  });
};

export const updateVisit = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const role = req.user?.role;

  if (role === "admin" || role === "operations") {
    const input = updateVisitSchema.parse(req.body);
    const visit = await VisitService.updateVisitAsAdminOps(id, input);

    return res.json({
      success: true,
      message: "Visit updated",
      data: visit
    });
  }

  if (role === "sales") {
    const input = updateVisitStatusSchema.parse(req.body);
    const visit = await VisitService.updateVisitStatusAsSales(id, input);

    return res.json({
      success: true,
      message: "Visit updated",
      data: visit
    });
  }

  throw new AppError("Forbidden", 403);
};

export const getVisitById = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const visit = await VisitService.getVisitById(id);

  res.json({
    success: true,
    message: "OK",
    data: visit
  });
};

