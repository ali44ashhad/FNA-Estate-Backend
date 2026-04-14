import mongoose from "mongoose";
import { z } from "zod";

export const createEmployeeSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["admin", "operations", "sales"]),
  cityId: z
    .string()
    .min(1)
    .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid cityId" })
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

