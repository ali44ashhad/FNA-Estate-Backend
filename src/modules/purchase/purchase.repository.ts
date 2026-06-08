import type { Types } from "mongoose";
import { Purchase, type PurchaseStatus } from "./purchase.model";

export type PurchaseFilters = {
  status?: PurchaseStatus;
  createdFrom?: Date;
  createdTo?: Date;
};

export type PurchaseSort = {
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
};

export type PurchasePageParams = {
  page: number;
  limit: number;
};

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

export async function findPurchasesPaged(params: {
  filters: PurchaseFilters;
  page: PurchasePageParams;
  sort: PurchaseSort;
}) {
  const { status, createdFrom, createdTo } = params.filters;

  const query: Record<string, unknown> = { isDeleted: false };
  if (status) query.status = status;
  if (createdFrom || createdTo) {
    const range: Record<string, Date> = {};
    if (createdFrom) range.$gte = createdFrom;
    if (createdTo) range.$lte = createdTo;
    query.createdAt = range;
  }

  const skip = (params.page.page - 1) * params.page.limit;
  const sortDir = params.sort.sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Purchase.find(query)
      .populate("projectId", "name status images cityId")
      .populate("userId", "name email")
      .populate("leadId", "leadNo")
      .sort({ [params.sort.sortBy]: sortDir })
      .skip(skip)
      .limit(params.page.limit)
      .lean(),
    Purchase.countDocuments(query)
  ]);

  return { items, total };
}

export async function updatePurchaseStatusById(id: Types.ObjectId, status: PurchaseStatus) {
  return Purchase.findOneAndUpdate({ _id: id, isDeleted: false }, { status }, { new: true }).lean();
}
