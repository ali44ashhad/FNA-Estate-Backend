import type { Request, Response } from "express";
import { createPurchaseSchema } from "./purchase.dto";
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

export const getMyPurchases = async (req: Request, res: Response) => {
  const purchases = await PurchaseService.getUserPurchases(req.user!.id);

  res.json({
    success: true,
    message: "OK",
    data: purchases
  });
};

