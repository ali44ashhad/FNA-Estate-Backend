import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Project } from "../project/project.model";
import type { CreateLeadInput, ListLeadInput, UpdateLeadInput } from "./lead.dto";
import * as repo from "./lead.repository";
import * as CounterRepo from "../counter/counter.repository";
import "../counter/counter.model";

type PublicLead = {
  id: string;
  leadNo?: number;
  userId: string;
  projectId: string;
  status: string;
  interest?: {
    category: "commercial" | "residential";
    subType: string;
    apartmentConfig?: string;
    unitTypeKey?: string;
    unitTypeLabel?: string;
    inventoryKey: string;
  };
  assignedOpsId?: string;
  assignedSalesId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function assertValidObjectId(id: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

function sanitizeLead(lead: {
  _id: unknown;
  leadNo?: unknown;
  userId: unknown;
  projectId: unknown;
  status: string;
  interest?: unknown;
  assignedOpsId?: unknown;
  assignedSalesId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicLead {
  const interestObj =
    lead.interest && typeof lead.interest === "object" && lead.interest !== null
      ? (lead.interest as Record<string, unknown>)
      : null;
  const category =
    interestObj?.category === "commercial" || interestObj?.category === "residential"
      ? (interestObj.category as "commercial" | "residential")
      : null;
  const subType = typeof interestObj?.subType === "string" ? (interestObj.subType as string) : "";
  const inventoryKey =
    typeof interestObj?.inventoryKey === "string" ? (interestObj.inventoryKey as string) : "";

  return {
    id: String(lead._id),
    leadNo: typeof lead.leadNo === "number" ? lead.leadNo : undefined,
    userId: String(lead.userId),
    projectId: String(lead.projectId),
    status: lead.status,
    interest:
      category && subType && inventoryKey
        ? {
            category,
            subType,
            apartmentConfig: typeof interestObj?.apartmentConfig === "string" ? interestObj.apartmentConfig : undefined,
            unitTypeKey: typeof interestObj?.unitTypeKey === "string" ? interestObj.unitTypeKey : undefined,
            unitTypeLabel: typeof interestObj?.unitTypeLabel === "string" ? interestObj.unitTypeLabel : undefined,
            inventoryKey
          }
        : undefined,
    assignedOpsId: lead.assignedOpsId ? String(lead.assignedOpsId) : undefined,
    assignedSalesId: lead.assignedSalesId ? String(lead.assignedSalesId) : undefined,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  };
}

async function assertProjectExists(projectId: string) {
  assertValidObjectId(projectId, "projectId");
  const project = await Project.findOne({ _id: projectId, isDeleted: false });
  if (!project) throw new AppError("Invalid project", 400);
}

function deriveInventoryKey(interest: {
  category: "commercial" | "residential";
  subType: string;
  apartmentConfig?: string;
}) {
  if (interest.subType === "apartment") {
    const cfg = interest.apartmentConfig?.trim();
    if (!cfg) throw new AppError("interest.apartmentConfig is required for apartments", 400);
    return `residential/apartment/${cfg}`;
  }
  return `${interest.category}/${interest.subType}`;
}

export async function createLead(userId: string, input: CreateLeadInput) {
  assertValidObjectId(userId, "user id");
  await assertProjectExists(input.projectId);

  const inventoryKey = deriveInventoryKey(input.interest);

  const existing = await repo.findLeads({
    userId: new mongoose.Types.ObjectId(userId),
    projectId: new mongoose.Types.ObjectId(input.projectId)
  });

  const duplicate = existing.some((l) => {
    const interest = (l as any).interest as Record<string, unknown> | undefined;
    const existingKey = typeof interest?.inventoryKey === "string" ? interest.inventoryKey : "";
    const existingUnitTypeKey = typeof interest?.unitTypeKey === "string" ? interest.unitTypeKey : "";
    const nextUnitTypeKey = input.interest.unitTypeKey ?? "";
    return existingKey === inventoryKey && existingUnitTypeKey === nextUnitTypeKey;
  });
  if (duplicate) throw new AppError("Lead already exists for this selection", 400);

  const leadNo = await CounterRepo.nextCounterSeq({ key: "leadNo" });

  const created = await repo.createLead({
    userId: new mongoose.Types.ObjectId(userId),
    projectId: new mongoose.Types.ObjectId(input.projectId),
    leadNo,
    interest: {
      category: input.interest.category,
      subType: input.interest.subType,
      ...(input.interest.apartmentConfig ? { apartmentConfig: input.interest.apartmentConfig } : {}),
      ...(input.interest.unitTypeKey ? { unitTypeKey: input.interest.unitTypeKey } : {}),
      ...(input.interest.unitTypeLabel ? { unitTypeLabel: input.interest.unitTypeLabel } : {}),
      inventoryKey
    },
    status: "new"
  });

  return sanitizeLead({
    _id: created._id,
    leadNo: (created as any).leadNo,
    userId: created.userId,
    projectId: created.projectId,
    status: created.status,
    interest: (created as any).interest,
    assignedOpsId: created.assignedOpsId,
    assignedSalesId: created.assignedSalesId,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  });
}

export async function getLeads(input: ListLeadInput) {
  const filters: repo.LeadFilters = {};

  if (typeof input.status === "string") filters.status = input.status;
  if (typeof input.userId === "string") filters.userId = new mongoose.Types.ObjectId(input.userId);
  if (typeof input.projectId === "string")
    filters.projectId = new mongoose.Types.ObjectId(input.projectId);
  if (typeof input.assignedOpsId === "string")
    filters.assignedOpsId = new mongoose.Types.ObjectId(input.assignedOpsId);
  if (typeof input.assignedSalesId === "string")
    filters.assignedSalesId = new mongoose.Types.ObjectId(input.assignedSalesId);

  const limit = Math.min(input.limit, 100);
  const page = input.page;

  const result = await repo.findLeadsPaged({
    filters,
    page: { page, limit },
    sort: { sortBy: input.sortBy, sortOrder: input.sortOrder }
  });

  return {
    items: result.items.map((l) =>
      sanitizeLead({
        _id: l._id,
        leadNo: (l as any).leadNo,
        userId: l.userId,
        projectId: l.projectId,
        status: l.status,
        interest: (l as any).interest,
        assignedOpsId: l.assignedOpsId,
        assignedSalesId: l.assignedSalesId,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt
      })
    ),
    page,
    limit,
    total: result.total
  };
}

export async function getLeadById(requestingUser: { id: string; role: string }, leadId: string) {
  assertValidObjectId(leadId, "lead id");

  const lead = await repo.findLeadById(new mongoose.Types.ObjectId(leadId));
  if (!lead) throw new AppError("Lead not found", 404);

  const canViewAll = requestingUser.role === "admin" || requestingUser.role === "operations";
  const isOwner = String(lead.userId) === requestingUser.id;
  if (!canViewAll && !isOwner) throw new AppError("Forbidden", 403);

  return sanitizeLead({
    _id: lead._id,
    leadNo: (lead as any).leadNo,
    userId: lead.userId,
    projectId: lead.projectId,
    status: lead.status,
    interest: (lead as any).interest,
    assignedOpsId: lead.assignedOpsId,
    assignedSalesId: lead.assignedSalesId,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  });
}

export async function updateLead(leadId: string, input: UpdateLeadInput) {
  assertValidObjectId(leadId, "lead id");

  const update: { status?: string; assignedOpsId?: mongoose.Types.ObjectId; assignedSalesId?: mongoose.Types.ObjectId } =
    {};

  if (typeof input.status === "string") update.status = input.status;
  if (typeof input.assignedOpsId === "string")
    update.assignedOpsId = new mongoose.Types.ObjectId(input.assignedOpsId);
  if (typeof input.assignedSalesId === "string")
    update.assignedSalesId = new mongoose.Types.ObjectId(input.assignedSalesId);

  const updated = await repo.updateLeadById(new mongoose.Types.ObjectId(leadId), update);
  if (!updated) throw new AppError("Lead not found", 404);

  return sanitizeLead({
    _id: updated._id,
    leadNo: (updated as any).leadNo,
    userId: updated.userId,
    projectId: updated.projectId,
    status: updated.status,
    interest: (updated as any).interest,
    assignedOpsId: updated.assignedOpsId,
    assignedSalesId: updated.assignedSalesId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

