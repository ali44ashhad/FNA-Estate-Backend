import mongoose from "mongoose";
import { z } from "zod";

export const submitResponseSchema = z.object({
  responses: z
    .array(
      z.object({
        questionId: z
          .string()
          .min(1)
          .refine((val) => mongoose.Types.ObjectId.isValid(val), {
            message: "Invalid questionId"
          }),
        optionId: z
          .string()
          .min(1)
          .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid optionId" })
      })
    )
    .min(1)
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

