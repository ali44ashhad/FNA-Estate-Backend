import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface IQuestion extends Document {
  questionText: string;
  type: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    questionText: String,
    type: String,
    isActive: Boolean,

    ...baseSchemaFields
  },
  baseSchemaOptions
);

export const Question = mongoose.model<IQuestion>("Question", questionSchema);

