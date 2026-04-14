import type { Types } from "mongoose";
import { Purchase, type PurchaseStatus } from "./purchase.model";

export async function createPurchase(data: {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  leadId: Types.ObjectId;
  amount: number;
  status: PurchaseStatus;
}) {
  return Purchase.create(data);
}

export async function findPurchasesByUser(userId: Types.ObjectId) {
  return Purchase.find({ userId, isDeleted: false }).sort({ createdAt: -1 });
}

export async function findActivePurchaseByUserAndProject(userId: Types.ObjectId, projectId: Types.ObjectId) {
  return Purchase.findOne({ userId, projectId, isDeleted: false });
}

