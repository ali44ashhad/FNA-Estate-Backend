import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export interface IUserResponse extends Document {
  userId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  optionId: mongoose.Types.ObjectId;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const userResponseSchema = new Schema<IUserResponse>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    questionId: { type: Schema.Types.ObjectId, ref: "Question" },
    optionId: { type: Schema.Types.ObjectId, ref: "Option" },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

export const UserResponse = mongoose.model<IUserResponse>(
  "UserResponse",
  userResponseSchema
);

