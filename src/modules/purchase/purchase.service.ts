import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Lead } from "../lead/lead.model";
import * as LeadRepo from "../lead/lead.repository";
import { Visit } from "../visit/visit.model";
import type { CreatePurchaseInput, ListPurchasesInput } from "./purchase.dto";
import type { PurchaseStatus } from "./purchase.model";
import * as repo from "./purchase.repository";

type PublicPurchase = {
  id: string;
  userId: string;
  projectId: string;
  leadId?: string;
  visitId?: string;
  category: "commercial" | "residential";
  subType: string;
  apartmentConfig?: string;
  unitTypeKey?: string;
  unitTypeLabel?: string;
  inventoryKey: string;
  agreedPrice: number;
  project?: { id: string; name: string; status: string; images: string[] };
  user?: { id: string; name: string; email?: string };
  lead?: { id: string; leadNo?: number };
  status: PurchaseStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

function assertValidObjectId(id: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

function sanitizePurchase(p: {
  _id: unknown;
  userId: unknown;
  projectId: unknown;
  leadId?: unknown;
  visitId?: unknown;
  category: "commercial" | "residential";
  subType: string;
  apartmentConfig?: string;
  unitTypeKey?: string;
  unitTypeLabel?: string;
  inventoryKey: string;
  agreedPrice: number;
  projectIdPopulated?: unknown;
  userIdPopulated?: unknown;
  leadIdPopulated?: unknown;
  status: PurchaseStatus;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicPurchase {
  const proj = (p.projectIdPopulated ?? null) as Record<string, unknown> | null;
  const project =
    proj &&
    proj._id &&
    typeof proj.name === "string" &&
    typeof proj.status === "string" &&
    Array.isArray(proj.images)
      ? { id: String(proj._id), name: proj.name, status: proj.status, images: proj.images as string[] }
      : undefined;

  const usr = (p.userIdPopulated ?? null) as Record<string, unknown> | null;
  const user =
    usr && usr._id && typeof usr.name === "string"
      ? {
          id: String(usr._id),
          name: usr.name,
          ...(typeof usr.email === "string" ? { email: usr.email } : {})
        }
      : undefined;

  const leadPop = (p.leadIdPopulated ?? null) as Record<string, unknown> | null;
  const lead =
    leadPop && leadPop._id
      ? {
          id: String(leadPop._id),
          ...(typeof leadPop.leadNo === "number" ? { leadNo: leadPop.leadNo } : {})
        }
      : undefined;

  return {
    id: String(p._id),
    userId: String(p.userId),
    projectId: String(p.projectId),
    leadId: p.leadId ? String(p.leadId) : undefined,
    visitId: p.visitId ? String(p.visitId) : undefined,
    category: p.category,
    subType: p.subType,
    apartmentConfig: p.apartmentConfig,
    unitTypeKey: p.unitTypeKey,
    unitTypeLabel: p.unitTypeLabel,
    inventoryKey: p.inventoryKey,
    agreedPrice: p.agreedPrice,
    project,
    user,
    lead,
    status: p.status,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt
  };
}

async function assertLeadExists(leadId: string) {
  assertValidObjectId(leadId, "leadId");
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  if (!lead) throw new AppError("Invalid lead", 400);
  return lead;
}

function deriveInventoryKey(input: { category: "commercial" | "residential"; subType: string; apartmentConfig?: string }) {
  if (input.subType === "apartment") {
    const cfg = input.apartmentConfig?.trim();
    if (!cfg) throw new AppError("apartmentConfig required for apartment purchases", 400);
    return `residential/apartment/${cfg}`;
  }
  return `${input.category}/${input.subType}`;
}

export async function createPurchase(input: CreatePurchaseInput) {
  const agreedPrice = (input.agreedPrice ?? input.amount) as number | undefined;
  if (typeof agreedPrice !== "number" || !Number.isFinite(agreedPrice) || agreedPrice <= 0) {
    throw new AppError("Invalid agreedPrice", 400);
  }

  const byAdmin = input.createdByAdmin === true;
  const hasLead = typeof input.leadId === "string" && input.leadId.length > 0;

  let userId: mongoose.Types.ObjectId;
  let projectId: mongoose.Types.ObjectId;
  let leadId: mongoose.Types.ObjectId | undefined;
  let visitId: mongoose.Types.ObjectId | undefined;

  let category: "commercial" | "residential" | undefined;
  let subType: string | undefined;
  let apartmentConfig: string | undefined;
  let unitTypeKey: string | undefined;
  let unitTypeLabel: string | undefined;
  let inventoryKey: string;

  if (typeof input.visitId === "string" && input.visitId.length > 0) {
    assertValidObjectId(input.visitId, "visitId");
    const v = await Visit.findOne({ _id: input.visitId, isDeleted: false }).lean();
    if (!v) throw new AppError("Invalid visit", 400);
    if ((v as any).status !== "completed") {
      throw new AppError("Visit must be completed to record a purchase", 400);
    }
    if (typeof input.leadId === "string" && String((v as any).leadId) !== input.leadId) {
      throw new AppError("visitId does not belong to leadId", 400);
    }
    visitId = new mongoose.Types.ObjectId(input.visitId);
  }

  if (hasLead) {
    const lead = await assertLeadExists(input.leadId!);
    leadId = new mongoose.Types.ObjectId(String(lead._id));
    userId = new mongoose.Types.ObjectId(String((lead as any).userId));
    projectId = new mongoose.Types.ObjectId(String((lead as any).projectId));

    const interest = (lead as any).interest as Record<string, unknown> | undefined;
    const iCategory =
      interest?.category === "commercial" || interest?.category === "residential"
        ? (interest.category as "commercial" | "residential")
        : undefined;
    const iSubType = typeof interest?.subType === "string" ? (interest.subType as string) : undefined;
    const iInventoryKey = typeof interest?.inventoryKey === "string" ? (interest.inventoryKey as string) : undefined;

    if (iCategory && iSubType && iInventoryKey) {
      category = iCategory;
      subType = iSubType;
      inventoryKey = iInventoryKey;
      apartmentConfig = typeof interest?.apartmentConfig === "string" ? (interest.apartmentConfig as string) : undefined;
      unitTypeKey = typeof interest?.unitTypeKey === "string" ? (interest.unitTypeKey as string) : undefined;
      unitTypeLabel = typeof interest?.unitTypeLabel === "string" ? (interest.unitTypeLabel as string) : undefined;
    } else {
      // Fallback to request snapshot if legacy leads don't have interest yet
      if (!input.category || !input.subType) {
        throw new AppError("Lead has no interest snapshot; category/subType required", 400);
      }
      category = input.category;
      subType = input.subType;
      apartmentConfig = input.apartmentConfig;
      unitTypeKey = input.unitTypeKey;
      unitTypeLabel = input.unitTypeLabel;
      inventoryKey = deriveInventoryKey({ category, subType, apartmentConfig });
    }
  } else if (byAdmin) {
    if (!input.userId || !input.projectId) {
      throw new AppError("userId and projectId required when createdByAdmin=true", 400);
    }
    assertValidObjectId(input.userId, "userId");
    assertValidObjectId(input.projectId, "projectId");
    userId = new mongoose.Types.ObjectId(input.userId);
    projectId = new mongoose.Types.ObjectId(input.projectId);

    if (!input.category || !input.subType) {
      throw new AppError("category and subType are required", 400);
    }
    category = input.category;
    subType = input.subType;
    apartmentConfig = input.apartmentConfig;
    unitTypeKey = input.unitTypeKey;
    unitTypeLabel = input.unitTypeLabel;
    inventoryKey = deriveInventoryKey({ category, subType, apartmentConfig });
  } else {
    throw new AppError("Invalid purchase request", 400);
  }

  const created = await repo.createPurchase({
    userId,
    projectId,
    ...(leadId ? { leadId } : {}),
    createdByAdmin: byAdmin,
    ...(visitId ? { visitId } : {}),
    category: category!,
    subType: subType!,
    ...(apartmentConfig ? { apartmentConfig } : {}),
    ...(unitTypeKey ? { unitTypeKey } : {}),
    ...(unitTypeLabel ? { unitTypeLabel } : {}),
    inventoryKey,
    agreedPrice,
    meta: input.meta,
    status: "booked"
  });

  if (leadId) {
    await LeadRepo.updateLeadById(leadId, { status: "closed" });
  }

  return sanitizePurchase({
    _id: created._id,
    userId: created.userId,
    projectId: created.projectId,
    leadId: (created as any).leadId,
    category: (created as any).category,
    subType: (created as any).subType,
    apartmentConfig: (created as any).apartmentConfig,
    unitTypeKey: (created as any).unitTypeKey,
    unitTypeLabel: (created as any).unitTypeLabel,
    inventoryKey: (created as any).inventoryKey,
    agreedPrice: (created as any).agreedPrice,
    status: created.status as PurchaseStatus,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  });
}

export async function getUserPurchases(userId: string) {
  assertValidObjectId(userId, "user id");
  const items = await repo.findPurchasesByUser(new mongoose.Types.ObjectId(userId));
  return items.map((p) =>
    sanitizePurchase({
      _id: (p as any)._id,
      userId: (p as any).userId,
      projectId: (p as any).projectId?._id ?? (p as any).projectId,
      projectIdPopulated: (p as any).projectId,
      leadId: (p as any).leadId,
      visitId: (p as any).visitId,
      category: (p as any).category,
      subType: (p as any).subType,
      apartmentConfig: (p as any).apartmentConfig,
      unitTypeKey: (p as any).unitTypeKey,
      unitTypeLabel: (p as any).unitTypeLabel,
      inventoryKey: (p as any).inventoryKey,
      agreedPrice: (p as any).agreedPrice,
      status: (p as any).status as PurchaseStatus,
      createdAt: (p as any).createdAt,
      updatedAt: (p as any).updatedAt
    })
  );
}

export async function listPurchases(input: ListPurchasesInput) {
  const filters: repo.PurchaseFilters = {};
  if (typeof input.status === "string") filters.status = input.status as PurchaseStatus;
  if (input.from instanceof Date) filters.createdFrom = input.from;
  if (input.to instanceof Date) filters.createdTo = input.to;

  const limit = Math.min(input.limit, 100);
  const page = input.page;

  const result = await repo.findPurchasesPaged({
    filters,
    page: { page, limit },
    sort: { sortBy: input.sortBy, sortOrder: input.sortOrder }
  });

  return {
    items: result.items.map((p) =>
      sanitizePurchase({
        _id: (p as any)._id,
        userId: (p as any).userId?._id ?? (p as any).userId,
        userIdPopulated: (p as any).userId,
        projectId: (p as any).projectId?._id ?? (p as any).projectId,
        projectIdPopulated: (p as any).projectId,
        leadId: (p as any).leadId?._id ?? (p as any).leadId,
        leadIdPopulated: (p as any).leadId,
        visitId: (p as any).visitId,
        category: (p as any).category,
        subType: (p as any).subType,
        apartmentConfig: (p as any).apartmentConfig,
        unitTypeKey: (p as any).unitTypeKey,
        unitTypeLabel: (p as any).unitTypeLabel,
        inventoryKey: (p as any).inventoryKey,
        agreedPrice: (p as any).agreedPrice,
        status: (p as any).status as PurchaseStatus,
        createdAt: (p as any).createdAt,
        updatedAt: (p as any).updatedAt
      })
    ),
    page,
    limit,
    total: result.total,
    hasNext: page * limit < result.total
  };
}

export async function updatePurchaseStatus(purchaseId: string, status: PurchaseStatus) {
  assertValidObjectId(purchaseId, "purchase id");
  const updated = await repo.updatePurchaseStatusById(new mongoose.Types.ObjectId(purchaseId), status);
  if (!updated) throw new AppError("Purchase not found", 404);

  return sanitizePurchase({
    _id: (updated as any)._id,
    userId: (updated as any).userId,
    projectId: (updated as any).projectId,
    leadId: (updated as any).leadId,
    visitId: (updated as any).visitId,
    category: (updated as any).category,
    subType: (updated as any).subType,
    apartmentConfig: (updated as any).apartmentConfig,
    unitTypeKey: (updated as any).unitTypeKey,
    unitTypeLabel: (updated as any).unitTypeLabel,
    inventoryKey: (updated as any).inventoryKey,
    agreedPrice: (updated as any).agreedPrice,
    status: (updated as any).status as PurchaseStatus,
    createdAt: (updated as any).createdAt,
    updatedAt: (updated as any).updatedAt
  });
}
