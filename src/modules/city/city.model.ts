import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface ICity extends Document {
  name: string;
  state: string;
  pincode: string;
  isDeleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: String,
    state: String,
    pincode: { type: String, required: true },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

citySchema.index(
  { pincode: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export const City = mongoose.model<ICity>("City", citySchema);

