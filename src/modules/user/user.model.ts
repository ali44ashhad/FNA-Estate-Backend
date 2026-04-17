import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  authProvider?: "password" | "google";
  googleId?: string;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: false },
    authProvider: { type: String, enum: ["password", "google"], default: "password" },
    googleId: { type: String, required: false },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

export const User = mongoose.model<IUser>("User", userSchema);

