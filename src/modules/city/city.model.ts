import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface ICity extends Document {
  name: string;
  state: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: String,
    state: String,

    ...baseSchemaFields
  },
  baseSchemaOptions
);

export const City = mongoose.model<ICity>("City", citySchema);

