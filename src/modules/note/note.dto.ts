import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid id" });

export const createNoteSchema = z.object({
  leadId: objectIdString,
  content: z.string().trim().min(1)
});

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

