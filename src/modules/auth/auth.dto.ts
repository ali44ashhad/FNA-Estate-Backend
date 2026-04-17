import { z } from "zod";

export const registerUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const googleCodeSchema = z.object({
  code: z.string().min(1)
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleCodeInput = z.infer<typeof googleCodeSchema>;

