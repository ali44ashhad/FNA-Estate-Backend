import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional()
  })
  .refine((data) => typeof data.name === "string" || typeof data.email === "string", {
    message: "At least one field is required"
  });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

