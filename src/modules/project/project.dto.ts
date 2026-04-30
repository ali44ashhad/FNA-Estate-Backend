import mongoose from "mongoose";
import { z } from "zod";

function firstQueryValue(val: unknown): unknown {
  return Array.isArray(val) ? val[0] : val;
}

function parseQueryNumber(val: unknown): number | undefined {
  const v = firstQueryValue(val);
  if (v === undefined || v === null || v === "") return undefined;

  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v !== "string") return undefined;

  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

const projectCategorySchema = z.enum(["commercial", "residential"]);
const projectPricingTypeSchema = z.enum(["unit_based", "direct"]);

const unitSchema = z.object({
  unitKey: z.string().min(1),
  unitLabel: z.string().min(1),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
  size: z.string().min(1).optional()
});

const directPriceSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0)
});

const apartmentConfigSchema = z
  .object({
    config: z.string().min(1),
    configLabel: z.string().min(1).optional(),
    pricingType: projectPricingTypeSchema,
    units: z.array(unitSchema).optional(),
    price: directPriceSchema.optional()
  })
  .superRefine((cfg, ctx) => {
    if (cfg.pricingType === "unit_based") {
      if (!Array.isArray(cfg.units) || cfg.units.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "units required for unit_based config" });
      }
      if (cfg.price !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "price not allowed when unit_based" });
      }
    }

    if (cfg.pricingType === "direct") {
      if (!cfg.price) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "price required for direct config" });
      }
      if (cfg.units !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "units not allowed when direct" });
      }
    }
  });

const inventoryItemSchema = z
  .object({
    category: projectCategorySchema,
    subType: z.string().min(1),

    // For non-apartment inventory
    pricingType: projectPricingTypeSchema.optional(),
    units: z.array(unitSchema).optional(),
    price: directPriceSchema.optional(),

    // For apartment inventory
    apartmentConfigs: z.array(apartmentConfigSchema).optional()
  })
  .superRefine((item, ctx) => {
    const isApartment = item.category === "residential" && item.subType === "apartment";

    if (isApartment) {
      if (!Array.isArray(item.apartmentConfigs) || item.apartmentConfigs.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "apartmentConfigs required when subType=apartment"
        });
      }
      if (item.pricingType !== undefined || item.units !== undefined || item.price !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Do not set pricingType/units/price at inventory level for apartments"
        });
      }
      return;
    }

    // Non-apartment
    if (!item.pricingType) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "pricingType required for non-apartment inventory" });
      return;
    }

    if (item.apartmentConfigs !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "apartmentConfigs only allowed for residential/apartment"
      });
    }

    if (item.pricingType === "unit_based") {
      if (!Array.isArray(item.units) || item.units.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "units required for unit_based pricing" });
      }
      if (item.price !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "price not allowed when unit_based" });
      }
    }

    if (item.pricingType === "direct") {
      if (!item.price) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "price required for direct pricing" });
      }
      if (item.units !== undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "units not allowed when direct" });
      }
    }
  });

export const createProjectSchema = z.object({
  name: z.string().min(1),
  cityId: z
    .string()
    .min(1)
    .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid cityId" }),
  projectCode: z.string().min(1),
  status: z.string().min(1),
  inventory: z.array(inventoryItemSchema).min(1),
  amenities: z.array(z.string().min(1)).optional(),
  description: z
    .string()
    .transform((s) => s.trim())
    .optional(),
  images: z.array(z.string().min(1)).optional()
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1).optional(),
    cityId: z
      .string()
      .min(1)
      .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid cityId" })
      .optional(),
    projectCode: z.string().min(1).optional(),
    status: z.string().min(1).optional(),
    inventory: z.array(inventoryItemSchema).min(1).optional(),
    amenities: z.array(z.string().min(1)).optional(),
    description: z
      .string()
      .transform((s) => s.trim())
      .optional(),
    images: z.array(z.string().min(1)).optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "No fields to update" });

export const filterProjectSchema = z.object({
  cityId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid cityId"
    }),
  // Backward compatible filter for legacy clients (mapped server-side)
  propertyType: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  category: z.preprocess(firstQueryValue, projectCategorySchema.optional()),
  subType: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  apartmentConfig: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  minPrice: z.preprocess(parseQueryNumber, z.number().min(0).optional()),
  maxPrice: z.preprocess(parseQueryNumber, z.number().min(0).optional()),
  page: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  limit: z.preprocess(firstQueryValue, z.string().min(1).optional())
});

export const recommendProjectsSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: z
          .string()
          .min(1)
          .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid questionId" }),
        optionId: z
          .string()
          .min(1)
          .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid optionId" })
      })
    )
    .min(1)
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type FilterProjectInput = z.infer<typeof filterProjectSchema>;
export type RecommendProjectsInput = z.infer<typeof recommendProjectsSchema>;

export const createProjectRequestSchema = z.object({ body: createProjectSchema });
export const updateProjectRequestSchema = z.object({ body: updateProjectSchema });
export const filterProjectRequestSchema = z.object({ query: filterProjectSchema });
export const recommendProjectsRequestSchema = z.object({ body: recommendProjectsSchema });

