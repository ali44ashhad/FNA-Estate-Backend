import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface IOption extends Document {
  questionId: mongoose.Types.ObjectId;
  value: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const optionSchema = new Schema<IOption>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question"
    },
    value: String,

    ...baseSchemaFields
  },
  baseSchemaOptions
);

export const Option = mongoose.model<IOption>("Option", optionSchema);

