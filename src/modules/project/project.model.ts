import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

export const PROJECT_PROPERTY_TYPES = ["apartment", "plot", "villa"] as const;
export type ProjectPropertyType = (typeof PROJECT_PROPERTY_TYPES)[number];

export const PROJECT_PRICING_TYPES = ["unit_based", "direct"] as const;
export type ProjectPricingType = (typeof PROJECT_PRICING_TYPES)[number];

export interface IProject extends Document {
  name: string;
  cityId: mongoose.Types.ObjectId;
  propertyType: ProjectPropertyType;
  status: string;
  pricingType: ProjectPricingType;
  amenities?: string[];
  description?: string;

  units?: {
    type: string;
    minPrice: number;
    maxPrice: number;
    size?: string;
  }[];

  price?: {
    min: number;
    max: number;
  };
  images: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true
    },
    propertyType: {
      type: String,
      enum: PROJECT_PROPERTY_TYPES,
      required: true,
      trim: true
    },
    status: { type: String, required: true, trim: true },
    pricingType: {
      type: String,
      enum: PROJECT_PRICING_TYPES,
      required: true
    },
    amenities: {
      type: [String],
      default: [],
      set: (vals: unknown) => {
        const arr = Array.isArray(vals) ? vals : [];
        const cleaned = arr
          .map((v) => (typeof v === "string" ? v.trim() : ""))
          .filter(Boolean);
        return [...new Set(cleaned)];
      }
    },
    description: { type: String, trim: true, default: "" },
    units: [
      {
        type: { type: String, required: true, trim: true },
        minPrice: { type: Number, required: true, min: 0 },
        maxPrice: { type: Number, required: true, min: 0 },
        size: { type: String, trim: true }
      }
    ],
    price: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    images: { type: [String], default: [] },

    ...baseSchemaFields
  },
  baseSchemaOptions
);

projectSchema.index({ cityId: 1 });
projectSchema.index({ propertyType: 1 });
projectSchema.index({ amenities: 1 });
projectSchema.index({ "price.min": 1 });
projectSchema.index({ "units.minPrice": 1 });

export const Project = mongoose.model<IProject>("Project", projectSchema);

