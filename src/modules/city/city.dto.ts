import mongoose from "mongoose";
import { z } from "zod";

function firstQueryValue(val: unknown): unknown {
  return Array.isArray(val) ? val[0] : val;
}

export const createCitySchema = z.object({
  name: z.string().trim().min(1),
  state: z.string().trim().min(1),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Pincode must be 6 digits" })
});

export const updateCitySchema = z.object({
  name: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
  pincode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, { message: "Pincode must be 6 digits" })
    .optional()
});

export const cityIdParamSchema = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid city id" });

export const filterCitiesSchema = z.object({
  q: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  page: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  limit: z.preprocess(firstQueryValue, z.string().min(1).optional())
});

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;
export type FilterCitiesInput = z.infer<typeof filterCitiesSchema>;

export const createCityRequestSchema = z.object({ body: createCitySchema });
export const updateCityRequestSchema = z.object({ body: updateCitySchema });
export const filterCitiesRequestSchema = z.object({ query: filterCitiesSchema });

