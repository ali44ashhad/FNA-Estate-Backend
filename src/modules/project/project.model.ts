import mongoose, { Schema, Document } from "mongoose";
import {
  baseSchemaFields,
  baseSchemaOptions
} from "../../database/base.schema";

// Legacy enums (kept for read-compat with existing documents)
export const PROJECT_PROPERTY_TYPES = ["apartment", "plot", "villa"] as const;
export type ProjectPropertyType = (typeof PROJECT_PROPERTY_TYPES)[number];

export const PROJECT_PRICING_TYPES = ["unit_based", "direct"] as const;
export type ProjectPricingType = (typeof PROJECT_PRICING_TYPES)[number];

// New inventory enums
export const PROJECT_CATEGORIES = ["commercial", "residential"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const COMMERCIAL_SUBTYPES = ["sco", "office", "showroom", "commercial_plot"] as const;
export type CommercialSubType = (typeof COMMERCIAL_SUBTYPES)[number];

export const RESIDENTIAL_SUBTYPES = ["residential_plot", "apartment", "villa"] as const;
export type ResidentialSubType = (typeof RESIDENTIAL_SUBTYPES)[number];

export interface IProject extends Document {
  name: string;
  cityId: mongoose.Types.ObjectId;
  status: string;
  amenities?: string[];
  description?: string;
  images: string[];

  // New mixed-use fields
  projectCode?: string;
  categories?: ProjectCategory[];
  inventory?: unknown[];

  // Legacy fields (optional)
  propertyType?: ProjectPropertyType;
  pricingType?: ProjectPricingType;
  units?: { type: string; minPrice: number; maxPrice: number; size?: string }[];
  price?: { min: number; max: number };
  createdAt?: Date;
  updatedAt?: Date;
}

const unitSchema = new Schema(
  {
    unitKey: { type: String, required: true, trim: true },
    unitLabel: { type: String, required: true, trim: true },
    minPrice: { type: Number, required: true, min: 0 },
    maxPrice: { type: Number, required: true, min: 0 },
    size: { type: String, trim: true }
  },
  { _id: false }
);

const directPriceSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const apartmentConfigSchema = new Schema(
  {
    config: { type: String, required: true, trim: true },
    configLabel: { type: String, trim: true },
    pricingType: { type: String, enum: PROJECT_PRICING_TYPES, required: true },
    units: { type: [unitSchema], default: undefined },
    price: { type: directPriceSchema, default: undefined }
  },
  { _id: false }
);

const inventoryItemSchema = new Schema(
  {
    category: { type: String, enum: PROJECT_CATEGORIES, required: true, trim: true },
    subType: { type: String, required: true, trim: true },

    pricingType: { type: String, enum: PROJECT_PRICING_TYPES, default: undefined },
    units: { type: [unitSchema], default: undefined },
    price: { type: directPriceSchema, default: undefined },

    apartmentConfigs: { type: [apartmentConfigSchema], default: undefined }
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: "City",
      required: true
    },
    status: { type: String, required: true, trim: true },

    projectCode: { type: String, trim: true },
    categories: { type: [String], enum: PROJECT_CATEGORIES, default: [] },
    inventory: { type: [inventoryItemSchema], default: undefined },

    // Legacy fields (kept optional for read-compat)
    propertyType: { type: String, enum: PROJECT_PROPERTY_TYPES, trim: true },
    pricingType: { type: String, enum: PROJECT_PRICING_TYPES },
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
projectSchema.index({ categories: 1 });
projectSchema.index({ "inventory.category": 1, "inventory.subType": 1 });
projectSchema.index({ projectCode: 1 }, { unique: true, sparse: true });
projectSchema.index({ propertyType: 1 });
projectSchema.index({ amenities: 1 });
projectSchema.index({ "price.min": 1 });
projectSchema.index({ "units.minPrice": 1 });
projectSchema.index({ "inventory.price.min": 1 });
projectSchema.index({ "inventory.units.minPrice": 1 });
projectSchema.index({ "inventory.apartmentConfigs.price.min": 1 });
projectSchema.index({ "inventory.apartmentConfigs.units.minPrice": 1 });

export const Project = mongoose.model<IProject>("Project", projectSchema);

