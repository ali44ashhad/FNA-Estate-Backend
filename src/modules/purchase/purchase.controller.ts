import type { Request, Response } from "express";
import { createPurchaseSchema, listPurchasesSchema, updatePurchaseStatusSchema } from "./purchase.dto";
import * as PurchaseService from "./purchase.service";

export const createPurchase = async (req: Request, res: Response) => {
  const input = createPurchaseSchema.parse(req.body);
  const purchase = await PurchaseService.createPurchase(input);

  res.json({
    success: true,
    message: "Purchase recorded",
    data: purchase
  });
};

export const listPurchases = async (req: Request, res: Response) => {
  const input = listPurchasesSchema.parse(req.query);
  const result = await PurchaseService.listPurchases(input);

  res.json({
    success: true,
    message: "OK",
    data: result
  });
};

export const getMyPurchases = async (req: Request, res: Response) => {
  const purchases = await PurchaseService.getUserPurchases(req.user!.id);

  res.json({
    success: true,
    message: "OK",
    data: purchases
  });
};

export const updatePurchaseStatus = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updatePurchaseStatusSchema.parse(req.body);
  const updated = await PurchaseService.updatePurchaseStatus(id, input.status);

  res.json({
    success: true,
    message: "Purchase updated",
    data: updated
  });
};

