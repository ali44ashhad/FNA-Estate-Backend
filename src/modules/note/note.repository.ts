import type { Types } from "mongoose";
import { OpsNote } from "./opsNote.model";
import { SalesNote } from "./salesNote.model";

export async function createOpsNote(data: { leadId: Types.ObjectId; opsId: Types.ObjectId; content: string }) {
  return OpsNote.create(data);
}

export async function createSalesNote(data: { leadId: Types.ObjectId; salesId: Types.ObjectId; content: string }) {
  return SalesNote.create(data);
}

export async function getOpsNotesByLead(leadId: Types.ObjectId) {
  return OpsNote.find({ leadId, isDeleted: false });
}

export async function getSalesNotesByLead(leadId: Types.ObjectId) {
  return SalesNote.find({ leadId, isDeleted: false });
}

