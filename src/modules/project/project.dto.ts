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

export const createProjectSchema = z.object({
  name: z.string().min(1),
  cityId: z
    .string()
    .min(1)
    .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid cityId" }),
  propertyType: z.enum(["apartment", "plot", "villa"]),
  status: z.string().min(1),
  pricingType: z.enum(["unit_based", "direct"]),
  amenities: z.array(z.string().min(1)).optional(),
  description: z
    .string()
    .transform((s) => s.trim())
    .optional(),
  units: z
    .array(
      z.object({
        type: z.string().min(1),
        minPrice: z.number().min(0),
        maxPrice: z.number().min(0),
        size: z.string().min(1).optional()
      })
    )
    .optional(),
  price: z
    .object({
      min: z.number().min(0),
      max: z.number().min(0)
    })
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
    propertyType: z.enum(["apartment", "plot", "villa"]).optional(),
    status: z.string().min(1).optional(),
    pricingType: z.enum(["unit_based", "direct"]).optional(),
    amenities: z.array(z.string().min(1)).optional(),
    description: z
      .string()
      .transform((s) => s.trim())
      .optional(),
    units: z
      .array(
        z.object({
          type: z.string().min(1),
          minPrice: z.number().min(0),
          maxPrice: z.number().min(0),
          size: z.string().min(1).optional()
        })
      )
      .optional(),
    price: z
      .object({
        min: z.number().min(0),
        max: z.number().min(0)
      })
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
  propertyType: z.preprocess(firstQueryValue, z.string().min(1).optional()),
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

