import mongoose from "mongoose";
import { z } from "zod";

function firstQueryValue(val: unknown): unknown {
  return Array.isArray(val) ? val[0] : val;
}

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

export const filterEmployeesSchema = z.object({
  q: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  role: z.preprocess(firstQueryValue, z.enum(["admin", "operations", "sales"]).optional()),
  page: z.preprocess(firstQueryValue, z.string().min(1).optional()),
  limit: z.preprocess(firstQueryValue, z.string().min(1).optional())
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type FilterEmployeesInput = z.infer<typeof filterEmployeesSchema>;

export const createEmployeeRequestSchema = z.object({ body: createEmployeeSchema });
export const filterEmployeesRequestSchema = z.object({ query: filterEmployeesSchema });

