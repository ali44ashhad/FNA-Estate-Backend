import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Employee } from "../employee/employee.model";
import { Lead } from "../lead/lead.model";
import * as LeadRepo from "../lead/lead.repository";
import type {
  CreateVisitInput,
  ListMyVisitsInput,
  ListVisitInput,
  UpdateVisitInput,
  UpdateVisitStatusInput,
  VisitStatus
} from "./visit.dto";
import * as repo from "./visit.repository";

type PublicVisit = {
  id: string;
  leadId: string;
  salesId: string;
  visitTime: Date;
  status: VisitStatus;
  location: string;
  locationLink?: string;
  lead?: {
    id: string;
    leadNo?: number;
    phone?: string;
    project?: { id: string; name: string; projectCode?: string } | null;
    user?: { id: string; name: string; email: string } | null;
  } | null;
  sales?: { id: string; name: string; email?: string } | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type RequestingEmployee = { id: string; role: string };

function assertValidObjectId(id: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

function trimOrUndefined(val: unknown): string | undefined {
  if (typeof val !== "string") return undefined;
  const s = val.trim();
  return s ? s : undefined;
}

function buildGoogleMapsSearchLink(location: string): string {
  const q = location.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

function asRecord(val: unknown): Record<string, unknown> | null {
  return val && typeof val === "object" ? (val as Record<string, unknown>) : null;
}

function buildLeadView(leadRef: unknown): PublicVisit["lead"] {
  const obj = asRecord(leadRef);
  if (!obj || !obj._id) return null;

  const projectRef = asRecord(obj.projectId);
  const project =
    projectRef && projectRef._id && typeof projectRef.name === "string"
      ? {
          id: String(projectRef._id),
          name: projectRef.name,
          projectCode:
            typeof projectRef.projectCode === "string" ? projectRef.projectCode : undefined
        }
      : null;

  const userRef = asRecord(obj.userId);
  const user =
    userRef && userRef._id && typeof userRef.name === "string" && typeof userRef.email === "string"
      ? { id: String(userRef._id), name: userRef.name, email: userRef.email }
      : null;

  return {
    id: String(obj._id),
    leadNo: typeof obj.leadNo === "number" ? obj.leadNo : undefined,
    phone: typeof obj.phone === "string" ? obj.phone : undefined,
    project,
    user
  };
}

function buildSalesView(salesRef: unknown): PublicVisit["sales"] {
  const obj = asRecord(salesRef);
  if (!obj || !obj._id) return null;
  if (typeof obj.name !== "string") return null;
  return {
    id: String(obj._id),
    name: obj.name,
    email: typeof obj.email === "string" ? obj.email : undefined
  };
}

function sanitizeVisit(visit: {
  _id: unknown;
  leadId: unknown;
  salesId: unknown;
  visitTime: Date;
  status: VisitStatus;
  location: string;
  locationLink?: string;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicVisit {
  const leadRef = asRecord(visit.leadId);
  const salesRef = asRecord(visit.salesId);

  const leadIdValue = leadRef && leadRef._id ? String(leadRef._id) : String(visit.leadId);
  const salesIdValue = salesRef && salesRef._id ? String(salesRef._id) : String(visit.salesId);

  return {
    id: String(visit._id),
    leadId: leadIdValue,
    salesId: salesIdValue,
    visitTime: visit.visitTime,
    status: visit.status,
    location: visit.location,
    locationLink: trimOrUndefined(visit.locationLink) || buildGoogleMapsSearchLink(visit.location),
    lead: leadRef ? buildLeadView(leadRef) : undefined,
    sales: salesRef ? buildSalesView(salesRef) : undefined,
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
  const lead = await assertLeadExists(input.leadId);
  if (lead.status !== "contacted") {
    throw new AppError("Lead must be contacted before scheduling a visit", 400);
  }

  const existing = await repo.findVisitByLeadId(new mongoose.Types.ObjectId(input.leadId));
  if (existing) throw new AppError("Visit already exists for this lead", 400);

  await assertSalesEmployeeExists(input.salesId);

  const locationLink = trimOrUndefined((input as { locationLink?: unknown }).locationLink) || buildGoogleMapsSearchLink(input.location);

  const created = await repo.createVisit({
    leadId: new mongoose.Types.ObjectId(input.leadId),
    salesId: new mongoose.Types.ObjectId(input.salesId),
    visitTime: input.visitTime,
    status: "scheduled",
    location: input.location,
    locationLink
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
    locationLink: (created as unknown as { locationLink?: string }).locationLink,
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
    locationLink?: string;
  } = {};

  if (typeof input.status === "string") patch.status = input.status;
  if (input.visitTime instanceof Date) patch.visitTime = input.visitTime;
  const nextLocation = typeof input.location === "string" ? input.location : undefined;
  if (nextLocation) patch.location = nextLocation;
  const nextLocationLink = trimOrUndefined((input as { locationLink?: unknown }).locationLink);
  if (nextLocationLink) patch.locationLink = nextLocationLink;
  if (!patch.locationLink && nextLocation) patch.locationLink = buildGoogleMapsSearchLink(nextLocation);

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
    locationLink: (updated as unknown as { locationLink?: string }).locationLink,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

export async function updateVisitStatusAsSales(
  visitId: string,
  input: UpdateVisitStatusInput,
  user?: RequestingEmployee
) {
  assertValidObjectId(visitId, "visit id");

  if (user?.role === "sales") {
    const existing = await repo.findVisitById(new mongoose.Types.ObjectId(visitId));
    if (!existing) throw new AppError("Visit not found", 404);
    if (String(existing.salesId) !== user.id) throw new AppError("Forbidden", 403);
  }

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
    locationLink: (updated as unknown as { locationLink?: string }).locationLink,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

export async function getVisitById(visitId: string, user?: RequestingEmployee) {
  assertValidObjectId(visitId, "visit id");

  const visit = await repo.findVisitById(new mongoose.Types.ObjectId(visitId));
  if (!visit) throw new AppError("Visit not found", 404);

  if (user?.role === "sales" && String(visit.salesId) !== user.id) {
    throw new AppError("Forbidden", 403);
  }

  return sanitizeVisit({
    _id: visit._id,
    leadId: visit.leadId,
    salesId: visit.salesId,
    visitTime: visit.visitTime,
    status: visit.status as VisitStatus,
    location: visit.location,
    locationLink: (visit as unknown as { locationLink?: string }).locationLink,
    createdAt: visit.createdAt,
    updatedAt: visit.updatedAt
  });
}

export async function listVisits(input: ListVisitInput, user: RequestingEmployee) {
  const filters: repo.VisitFilters = {};

  if (typeof input.status === "string") filters.status = input.status;
  if (typeof input.leadId === "string") filters.leadId = new mongoose.Types.ObjectId(input.leadId);
  if (input.from instanceof Date) filters.visitTimeFrom = input.from;
  if (input.to instanceof Date) filters.visitTimeTo = input.to;

  if (user.role === "sales") {
    assertValidObjectId(user.id, "user id");
    filters.salesId = new mongoose.Types.ObjectId(user.id);
  } else if (typeof input.salesId === "string") {
    filters.salesId = new mongoose.Types.ObjectId(input.salesId);
  }

  const limit = Math.min(input.limit, 100);
  const page = input.page;

  const result = await repo.findVisitsPaged({
    filters,
    page: { page, limit },
    sort: { sortBy: input.sortBy, sortOrder: input.sortOrder }
  });

  return {
    items: result.items.map((v) =>
      sanitizeVisit({
        _id: v._id,
        leadId: v.leadId,
        salesId: v.salesId,
        visitTime: v.visitTime,
        status: v.status as VisitStatus,
        location: v.location,
        locationLink: (v as unknown as { locationLink?: string }).locationLink,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      })
    ),
    page,
    limit,
    total: result.total,
    hasNext: page * limit < result.total
  };
}

export async function listVisitsForCustomer(userId: string, input: ListMyVisitsInput) {
  assertValidObjectId(userId, "user id");

  const leadIds = await LeadRepo.findLeadIdsByUserId(new mongoose.Types.ObjectId(userId));
  if (leadIds.length === 0) {
    return {
      items: [] as PublicVisit[],
      page: input.page,
      limit: Math.min(input.limit, 100),
      total: 0,
      hasNext: false
    };
  }

  const filters: repo.VisitFilters = {
    leadIds: leadIds as mongoose.Types.ObjectId[]
  };

  if (input.from instanceof Date) filters.visitTimeFrom = input.from;
  if (input.to instanceof Date) filters.visitTimeTo = input.to;

  const limit = Math.min(input.limit, 100);
  const page = input.page;

  const result = await repo.findVisitsPaged({
    filters,
    page: { page, limit },
    sort: { sortBy: input.sortBy, sortOrder: input.sortOrder }
  });

  return {
    items: result.items.map((v) =>
      sanitizeVisit({
        _id: v._id,
        leadId: v.leadId,
        salesId: v.salesId,
        visitTime: v.visitTime,
        status: v.status as VisitStatus,
        location: v.location,
        locationLink: (v as unknown as { locationLink?: string }).locationLink,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt
      })
    ),
    page,
    limit,
    total: result.total,
    hasNext: page * limit < result.total
  };
}

