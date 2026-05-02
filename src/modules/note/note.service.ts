import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import { Lead } from "../lead/lead.model";
import type { CreateNoteInput } from "./note.dto";
import * as repo from "./note.repository";

type RequestingUser = {
  id: string;
  role: "admin" | "operations" | "sales" | (string & {});
};

function assertValidObjectId(id: string, label: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${label}`, 400);
  }
}

async function assertLeadExists(leadId: string) {
  assertValidObjectId(leadId, "leadId");
  const lead = await Lead.findOne({ _id: leadId, isDeleted: false });
  if (!lead) throw new AppError("Invalid lead", 400);
  return lead;
}

function assertSalesAssignedToLead(user: RequestingUser, lead: { assignedSalesId?: unknown }) {
  assertValidObjectId(user.id, "user id");
  if (!lead.assignedSalesId || String(lead.assignedSalesId) !== user.id) {
    throw new AppError("Forbidden", 403);
  }
}

export async function addNote(user: RequestingUser, input: CreateNoteInput) {
  const lead = await assertLeadExists(input.leadId);

  if (user.role === "operations") {
    assertValidObjectId(user.id, "user id");
    return repo.createOpsNote({
      leadId: new mongoose.Types.ObjectId(input.leadId),
      opsId: new mongoose.Types.ObjectId(user.id),
      content: input.content
    });
  }

  if (user.role === "sales") {
    assertSalesAssignedToLead(user, lead);
    return repo.createSalesNote({
      leadId: new mongoose.Types.ObjectId(input.leadId),
      salesId: new mongoose.Types.ObjectId(user.id),
      content: input.content
    });
  }

  throw new AppError("Forbidden", 403);
}

export async function getNotesByLead(user: RequestingUser, leadId: string) {
  const lead = await assertLeadExists(leadId);
  const leadObjectId = new mongoose.Types.ObjectId(leadId);

  if (user.role === "sales") {
    assertSalesAssignedToLead(user, lead);
    const salesNotes = await repo.getSalesNotesByLead(leadObjectId);
    return { opsNotes: [], salesNotes };
  }

  if (user.role === "admin") {
    const [opsNotes, salesNotes] = await Promise.all([
      repo.getOpsNotesByLead(leadObjectId),
      repo.getSalesNotesByLead(leadObjectId)
    ]);

    return { opsNotes, salesNotes };
  }

  if (user.role === "operations") {
    const opsNotes = await repo.getOpsNotesByLead(leadObjectId);
    return { opsNotes, salesNotes: [] };
  }

  throw new AppError("Forbidden", 403);
}

