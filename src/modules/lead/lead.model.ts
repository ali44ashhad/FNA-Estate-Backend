import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface ILead extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
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

export const Lead = mongoose.model<ILead>("Lead", leadSchema);

