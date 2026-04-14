import mongoose, { Schema, Document } from "mongoose";
import { baseSchemaFields, baseSchemaOptions } from "../../database/base.schema";

export const PURCHASE_STATUSES = ["completed"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  leadId: mongoose.Types.ObjectId;
  amount: number;
  status: PurchaseStatus;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const purchaseSchema = new Schema<IPurchase>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: PURCHASE_STATUSES, required: true },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

// Enforce strict 1:1 between (user, project) for active purchases (soft-deletes excluded)
purchaseSchema.index(
  { userId: 1, projectId: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Enforce strict 1:1 between lead and active purchase (soft-deletes excluded)
purchaseSchema.index({ leadId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
