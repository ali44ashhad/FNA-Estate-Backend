import type { Types } from "mongoose";
import { Visit } from "./visit.model";

export async function createVisit(data: {
  leadId: Types.ObjectId;
  salesId: Types.ObjectId;
  visitTime: Date;
  status: string;
  location: string;
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
  }>
) {
  return Visit.findOneAndUpdate({ _id: id, isDeleted: false }, patch, { new: true });
}

