import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface IEmployee extends Document {
  name: string;
  email: string;
  password: string;
  role: "admin" | "operations" | "sales";
  cityId?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "operations", "sales"],
      required: true
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City"
    },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

employeeSchema.index({ cityId: 1 });

export const Employee = mongoose.model<IEmployee>("Employee", employeeSchema);

