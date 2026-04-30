import type { Types } from "mongoose";
import { Purchase, type PurchaseStatus } from "./purchase.model";

export async function createPurchase(data: {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  leadId?: Types.ObjectId;
  createdByAdmin?: boolean;
  visitId?: Types.ObjectId;
  category: "commercial" | "residential";
  subType: string;
  apartmentConfig?: string;
  unitTypeKey?: string;
  unitTypeLabel?: string;
  inventoryKey: string;
  agreedPrice: number;
  meta?: Record<string, unknown>;
  status: PurchaseStatus;
}) {
  return Purchase.create(data);
}

export async function findPurchasesByUser(userId: Types.ObjectId) {
  return Purchase.find({ userId, isDeleted: false, status: "booked" })
    .populate("projectId", "name status images cityId")
    .sort({ createdAt: -1 })
    .lean();
}

