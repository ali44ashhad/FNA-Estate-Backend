import mongoose, { Schema, Document } from "mongoose";
import { baseSchemaFields, baseSchemaOptions } from "../../database/base.schema";

export const PURCHASE_STATUSES = ["booked", "cancelled", "refunded"] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export interface IPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  leadId?: mongoose.Types.ObjectId;
  createdByAdmin?: boolean;
  visitId?: mongoose.Types.ObjectId;
  category: "commercial" | "residential";
  subType: string;
  apartmentConfig?: string;
  unitTypeKey?: string;
  unitTypeLabel?: string;
  inventoryKey: string;
  agreedPrice: number;
  meta?: Record<string, unknown>;
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
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: false },
    createdByAdmin: { type: Boolean, default: false },
    visitId: { type: Schema.Types.ObjectId, ref: "Visit", required: false },

    category: { type: String, enum: ["commercial", "residential"], required: true, trim: true },
    subType: { type: String, required: true, trim: true },
    apartmentConfig: { type: String, trim: true },
    unitTypeKey: { type: String, trim: true },
    unitTypeLabel: { type: String, trim: true },
    inventoryKey: { type: String, required: true, trim: true },

    agreedPrice: { type: Number, required: true, min: 0 },
    meta: { type: Schema.Types.Mixed },
    status: { type: String, enum: PURCHASE_STATUSES, required: true },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

purchaseSchema.index({ userId: 1, createdAt: -1 });
purchaseSchema.index({ projectId: 1 });
purchaseSchema.index({ leadId: 1 });
purchaseSchema.index({ inventoryKey: 1 });

export const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);
