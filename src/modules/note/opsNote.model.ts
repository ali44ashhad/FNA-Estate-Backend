import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface IOpsNote extends Document {
  leadId: mongoose.Types.ObjectId;
  opsId: mongoose.Types.ObjectId;
  content: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const opsNoteSchema = new Schema<IOpsNote>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    opsId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    content: { type: String, required: true, trim: true },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

opsNoteSchema.index({ leadId: 1, createdAt: -1 });

export const OpsNote = mongoose.model<IOpsNote>("OpsNote", opsNoteSchema);

