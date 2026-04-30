import mongoose, { Schema, Document } from "mongoose";
import { baseSchemaFields, baseSchemaOptions } from "../../database/base.schema";

export interface ICounter extends Document {
  key: string;
  projectId?: mongoose.Types.ObjectId;
  seq: number;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const counterSchema = new Schema<ICounter>(
  {
    key: { type: String, required: true, trim: true },
    projectId: { type: Schema.Types.ObjectId, required: false, index: true },
    seq: { type: Number, required: true, default: 0, min: 0 },
    ...baseSchemaFields
  },
  baseSchemaOptions
);

counterSchema.index({ key: 1, projectId: 1 }, { unique: true, sparse: true });
counterSchema.index({ key: 1 }, { unique: true, partialFilterExpression: { projectId: { $exists: false } } });

export const Counter = mongoose.model<ICounter>("Counter", counterSchema);

