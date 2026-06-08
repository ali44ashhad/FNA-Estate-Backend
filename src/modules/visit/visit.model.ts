import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export const VISIT_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

export interface IVisit extends Document {
  leadId: mongoose.Types.ObjectId;
  salesId: mongoose.Types.ObjectId;
  visitTime: Date;
  status: VisitStatus;
  location: string;
  locationLink?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const visitSchema = new Schema<IVisit>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    salesId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    visitTime: { type: Date, required: true },
    status: { type: String, enum: VISIT_STATUSES, required: true },
    location: { type: String, required: true, trim: true },
    locationLink: { type: String, trim: true },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

// Enforce strict 1:1 between lead and active visit (soft-deletes excluded)
visitSchema.index({ leadId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Visit = mongoose.model<IVisit>("Visit", visitSchema);

