import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid id" });

export const createPurchaseSchema = z.object({
  leadId: objectIdString,
  amount: z.number().positive()
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

