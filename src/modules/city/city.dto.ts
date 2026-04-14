import mongoose from "mongoose";
import { z } from "zod";

export const createCitySchema = z.object({
  name: z.string().trim().min(1),
  state: z.string().trim().min(1)
});

export const updateCitySchema = z.object({
  name: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional()
});

export const cityIdParamSchema = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid city id" });

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;

