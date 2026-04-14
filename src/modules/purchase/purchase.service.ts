import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Lead } from "../lead/lead.model";
import * as LeadRepo from "../lead/lead.repository";
import type { CreatePurchaseInput } from "./purchase.dto";
import type { PurchaseStatus } from "./purchase.model";
import * as repo from "./purchase.repository";

type PublicPurchase = {
  id: string;
  userId: string;
  projectId: string;
  leadId: string;
  amount: number;
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
  leadId: unknown;
  amount: number;
  status: PurchaseStatus;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicPurchase {
  return {
    id: String(p._id),
    userId: String(p.userId),
    projectId: String(p.projectId),
    leadId: String(p.leadId),
    amount: p.amount,
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

export async function createPurchase(input: CreatePurchaseInput) {
  const lead = await assertLeadExists(input.leadId);

  const userId = new mongoose.Types.ObjectId(String(lead.userId));
  const projectId = new mongoose.Types.ObjectId(String(lead.projectId));

  const existing = await repo.findActivePurchaseByUserAndProject(userId, projectId);
  if (existing) {
    throw new AppError("User already purchased this project", 400);
  }

  const created = await repo.createPurchase({
    userId,
    projectId,
    leadId: new mongoose.Types.ObjectId(input.leadId),
    amount: input.amount,
    status: "completed"
  });

  await LeadRepo.updateLeadById(new mongoose.Types.ObjectId(input.leadId), { status: "closed" });

  return sanitizePurchase({
    _id: created._id,
    userId: created.userId,
    projectId: created.projectId,
    leadId: created.leadId,
    amount: created.amount,
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
      _id: p._id,
      userId: p.userId,
      projectId: p.projectId,
      leadId: p.leadId,
      amount: p.amount,
      status: p.status as PurchaseStatus,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })
  );
}

