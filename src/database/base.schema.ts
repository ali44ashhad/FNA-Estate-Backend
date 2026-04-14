import { Schema } from "mongoose";

export const baseSchemaFields = {
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
};

export const baseSchemaOptions = {
  timestamps: true
};

