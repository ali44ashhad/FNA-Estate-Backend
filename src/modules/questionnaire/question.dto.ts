import { z } from "zod";

export const createQuestionSchema = z.object({
  questionText: z.string().trim().min(1),
  type: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).min(1)
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;

