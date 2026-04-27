import mongoose from "mongoose";
import { z } from "zod";

const cityIdSchema = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid cityId" });

const baseCreateEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

export const createEmployeeSchema = z.discriminatedUnion("role", [
  baseCreateEmployeeSchema.extend({
    role: z.literal("admin"),
    cityId: cityIdSchema.optional()
  }),
  baseCreateEmployeeSchema.extend({
    role: z.literal("operations"),
    cityId: cityIdSchema
  }),
  baseCreateEmployeeSchema.extend({
    role: z.literal("sales"),
    cityId: cityIdSchema
  })
]);

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

