import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Project } from "../project/project.model";
import type { ListLeadInput, UpdateLeadInput } from "./lead.dto";
import * as repo from "./lead.repository";

type PublicLead = {
  id: string;
  userId: string;
  projectId: string;
  status: string;
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
  userId: unknown;
  projectId: unknown;
  status: string;
  assignedOpsId?: unknown;
  assignedSalesId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicLead {
  return {
    id: String(lead._id),
    userId: String(lead.userId),
    projectId: String(lead.projectId),
    status: lead.status,
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

export async function createLead(userId: string, input: { projectId: string }) {
  assertValidObjectId(userId, "user id");
  await assertProjectExists(input.projectId);

  const existing = await repo.findLeads({
    userId: new mongoose.Types.ObjectId(userId),
    projectId: new mongoose.Types.ObjectId(input.projectId)
  });

  if (existing.length > 0) {
    throw new AppError("Lead already exists for this project", 400);
  }

  const created = await repo.createLead({
    userId: new mongoose.Types.ObjectId(userId),
    projectId: new mongoose.Types.ObjectId(input.projectId),
    status: "new"
  });

  return sanitizeLead({
    _id: created._id,
    userId: created.userId,
    projectId: created.projectId,
    status: created.status,
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
        userId: l.userId,
        projectId: l.projectId,
        status: l.status,
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
    userId: lead.userId,
    projectId: lead.projectId,
    status: lead.status,
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
    userId: updated.userId,
    projectId: updated.projectId,
    status: updated.status,
    assignedOpsId: updated.assignedOpsId,
    assignedSalesId: updated.assignedSalesId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

