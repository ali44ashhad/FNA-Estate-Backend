import mongoose from "mongoose";
import { z } from "zod";

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

export type CreateCityInput = z.infer<typeof createCitySchema>;
export type UpdateCityInput = z.infer<typeof updateCitySchema>;

