import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Employee } from "../employee/employee.model";
import { Lead } from "../lead/lead.model";
import * as LeadRepo from "../lead/lead.repository";
import type { CreateVisitInput, UpdateVisitInput, UpdateVisitStatusInput, VisitStatus } from "./visit.dto";
import * as repo from "./visit.repository";

type PublicVisit = {
  id: string;
  leadId: string;
  salesId: string;
  visitTime: Date;
  status: VisitStatus;
  location: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function assertValidObjectId(id: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

function sanitizeVisit(visit: {
  _id: unknown;
  leadId: unknown;
  salesId: unknown;
  visitTime: Date;
  status: VisitStatus;
  location: string;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicVisit {
  return {
    id: String(visit._id),
    leadId: String(visit.leadId),
    salesId: String(visit.salesId),
    visitTime: visit.visitTime,
    status: visit.status,
    location: visit.location,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt
  };
}

async function assertLeadExists(leadId: string) {
  assertValidObjectId(leadId, "leadId");
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  if (!lead) throw new AppError("Invalid lead", 400);
  return lead;
}

async function assertSalesEmployeeExists(salesId: string) {
  assertValidObjectId(salesId, "salesId");
  const employee = await Employee.findOne({ _id: salesId, isDeleted: false });
  if (!employee || employee.role !== "sales") {
    throw new AppError("Invalid sales agent", 400);
  }
  return employee;
}

export async function createVisit(input: CreateVisitInput) {
  await assertLeadExists(input.leadId);

  const existing = await repo.findVisitByLeadId(new mongoose.Types.ObjectId(input.leadId));
  if (existing) throw new AppError("Visit already exists for this lead", 400);

  await assertSalesEmployeeExists(input.salesId);

  const created = await repo.createVisit({
    leadId: new mongoose.Types.ObjectId(input.leadId),
    salesId: new mongoose.Types.ObjectId(input.salesId),
    visitTime: input.visitTime,
    status: "scheduled",
    location: input.location
  });

  await LeadRepo.updateLeadById(new mongoose.Types.ObjectId(input.leadId), {
    status: "scheduled",
    assignedSalesId: new mongoose.Types.ObjectId(input.salesId)
  });

  return sanitizeVisit({
    _id: created._id,
    leadId: created.leadId,
    salesId: created.salesId,
    visitTime: created.visitTime,
    status: created.status as VisitStatus,
    location: created.location,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  });
}

export async function updateVisitAsAdminOps(visitId: string, input: UpdateVisitInput) {
  assertValidObjectId(visitId, "visit id");

  const patch: {
    status?: VisitStatus;
    salesId?: mongoose.Types.ObjectId;
    visitTime?: Date;
    location?: string;
  } = {};

  if (typeof input.status === "string") patch.status = input.status;
  if (input.visitTime instanceof Date) patch.visitTime = input.visitTime;
  if (typeof input.location === "string") patch.location = input.location;

  if (typeof input.salesId === "string") {
    await assertSalesEmployeeExists(input.salesId);
    patch.salesId = new mongoose.Types.ObjectId(input.salesId);
  }

  const updated = await repo.updateVisitById(new mongoose.Types.ObjectId(visitId), patch);
  if (!updated) throw new AppError("Visit not found", 404);

  if (typeof input.salesId === "string") {
    await LeadRepo.updateLeadById(new mongoose.Types.ObjectId(String(updated.leadId)), {
      assignedSalesId: new mongoose.Types.ObjectId(input.salesId)
    });
  }

  return sanitizeVisit({
    _id: updated._id,
    leadId: updated.leadId,
    salesId: updated.salesId,
    visitTime: updated.visitTime,
    status: updated.status as VisitStatus,
    location: updated.location,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

export async function updateVisitStatusAsSales(visitId: string, input: UpdateVisitStatusInput) {
  assertValidObjectId(visitId, "visit id");

  const updated = await repo.updateVisitById(new mongoose.Types.ObjectId(visitId), {
    status: input.status
  });
  if (!updated) throw new AppError("Visit not found", 404);

  return sanitizeVisit({
    _id: updated._id,
    leadId: updated.leadId,
    salesId: updated.salesId,
    visitTime: updated.visitTime,
    status: updated.status as VisitStatus,
    location: updated.location,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

export async function getVisitById(visitId: string) {
  assertValidObjectId(visitId, "visit id");

  const visit = await repo.findVisitById(new mongoose.Types.ObjectId(visitId));
  if (!visit) throw new AppError("Visit not found", 404);

  return sanitizeVisit({
    _id: visit._id,
    leadId: visit.leadId,
    salesId: visit.salesId,
    visitTime: visit.visitTime,
    status: visit.status as VisitStatus,
    location: visit.location,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt
  });
}

