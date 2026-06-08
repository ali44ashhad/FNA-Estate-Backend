import type { Types } from "mongoose";
import { Visit } from "./visit.model";

export type VisitFilters = {
  status?: string;
  salesId?: Types.ObjectId;
  leadId?: Types.ObjectId;
  leadIds?: Types.ObjectId[];
  visitTimeFrom?: Date;
  visitTimeTo?: Date;
};

export type VisitSort = {
  sortBy: "visitTime" | "createdAt" | "updatedAt";
  sortOrder: "asc" | "desc";
};

export type VisitPageParams = {
  page: number;
  limit: number;
};

export async function createVisit(data: {
  leadId: Types.ObjectId;
  salesId: Types.ObjectId;
  visitTime: Date;
  status: string;
  location: string;
  locationLink?: string;
}) {
  return Visit.create(data);
}

export async function findVisitByLeadId(leadId: Types.ObjectId) {
  return Visit.findOne({ leadId, isDeleted: false });
}

export async function findVisitById(id: Types.ObjectId) {
  return Visit.findOne({ _id: id, isDeleted: false });
}

export async function updateVisitById(
  id: Types.ObjectId,
  patch: Partial<{
    salesId: Types.ObjectId;
    visitTime: Date;
    status: string;
    location: string;
    locationLink: string;
  }>
) {
  return Visit.findOneAndUpdate({ _id: id, isDeleted: false }, patch, { new: true });
}

export async function findVisitsPaged(params: {
  filters: VisitFilters;
  page: VisitPageParams;
  sort: VisitSort;
}) {
  const { status, salesId, leadId, leadIds, visitTimeFrom, visitTimeTo } = params.filters;

  const query: Record<string, unknown> = { isDeleted: false };
  if (status) query.status = status;
  if (salesId) query.salesId = salesId;
  if (leadIds && leadIds.length > 0) {
    query.leadId = { $in: leadIds };
  } else if (leadId) {
    query.leadId = leadId;
  }
  if (visitTimeFrom || visitTimeTo) {
    const range: Record<string, Date> = {};
    if (visitTimeFrom) range.$gte = visitTimeFrom;
    if (visitTimeTo) range.$lte = visitTimeTo;
    query.visitTime = range;
  }

  const skip = (params.page.page - 1) * params.page.limit;
  const sortDir = params.sort.sortOrder === "asc" ? 1 : -1;

  const [items, total] = await Promise.all([
    Visit.find(query)
      .sort({ [params.sort.sortBy]: sortDir })
      .skip(skip)
      .limit(params.page.limit)
      .populate({
        path: "leadId",
        select: "leadNo phone projectId userId",
        populate: [
          { path: "projectId", select: "name projectCode" },
          { path: "userId", select: "name email" }
        ]
      })
      .populate("salesId", "name email"),
    Visit.countDocuments(query)
  ]);

  return { items, total };
}

