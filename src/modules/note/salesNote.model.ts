import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface ISalesNote extends Document {
  leadId: mongoose.Types.ObjectId;
  salesId: mongoose.Types.ObjectId;
  content: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const salesNoteSchema = new Schema<ISalesNote>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    salesId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    content: { type: String, required: true, trim: true },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

salesNoteSchema.index({ leadId: 1, createdAt: -1 });

export const SalesNote = mongoose.model<ISalesNote>(
  "SalesNote",
  salesNoteSchema
);

