import type { Types } from "mongoose";
import { Lead } from "./lead.model";

export type LeadFilters = {
  status?: string;
  userId?: Types.ObjectId;
  projectId?: Types.ObjectId;
  assignedOpsId?: Types.ObjectId;
  assignedSalesId?: Types.ObjectId;
};

export type LeadSort = {
  sortBy: "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
};

export type LeadPageParams = {
  page: number;
  limit: number;
};

export async function createLead(data: {
  userId: Types.ObjectId;
  projectId: Types.ObjectId;
  leadNo: number;
  interest: {
    category: "commercial" | "residential";
    subType: string;
    apartmentConfig?: string;
    unitTypeKey?: string;
    unitTypeLabel?: string;
    inventoryKey: string;
  };
  status: string;
}) {
  return Lead.create(data);
}

export async function findLeadById(id: Types.ObjectId) {
  return Lead.findOne({ _id: id, isDeleted: false });
}

export async function updateLeadById(id: Types.ObjectId, data: Partial<LeadFilters> & { status?: string }) {
  return Lead.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
}

export async function findLeads(filters: LeadFilters) {
  return Lead.find({ ...filters, isDeleted: false });
}

export async function findLeadsPaged(params: {
  filters: LeadFilters;
  page: LeadPageParams;
  sort: LeadSort;
}) {
  const query = { ...params.filters, isDeleted: false };
  const skip = (params.page.page - 1) * params.page.limit;
  const sortDir = params.sort.sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Lead.find(query)
      .sort({ [params.sort.sortBy]: sortDir })
      .skip(skip)
      .limit(params.page.limit),
    Lead.countDocuments(query)
  ]);

  return { items, total };
}

