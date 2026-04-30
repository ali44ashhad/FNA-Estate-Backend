import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface ILead extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  leadNo?: number;
  interest?: {
    category: "commercial" | "residential";
    subType: string;
    apartmentConfig?: string;
    unitTypeKey?: string;
    unitTypeLabel?: string;
    inventoryKey: string;
  };
  status: string;
  assignedOpsId?: mongoose.Types.ObjectId;
  assignedSalesId?: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const leadSchema = new Schema<ILead>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },

    // Sparse for rollout; new creates should always set this.
    leadNo: { type: Number, min: 1 },

    interest: {
      category: { type: String, enum: ["commercial", "residential"], required: false, trim: true },
      subType: { type: String, required: false, trim: true },
      apartmentConfig: { type: String, required: false, trim: true },
      unitTypeKey: { type: String, required: false, trim: true },
      unitTypeLabel: { type: String, required: false, trim: true },
      inventoryKey: { type: String, required: false, trim: true }
    },

    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "visited", "closed"]
    },

    assignedOpsId: {
      type: Schema.Types.ObjectId,
      ref: "Employee"
    },

    assignedSalesId: {
      type: Schema.Types.ObjectId,
      ref: "Employee"
    },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

leadSchema.index({ projectId: 1 });
leadSchema.index({ userId: 1 });
leadSchema.index({ leadNo: 1 }, { unique: true, sparse: true });
leadSchema.index({ "interest.inventoryKey": 1 });

export const Lead = mongoose.model<ILead>("Lead", leadSchema);

