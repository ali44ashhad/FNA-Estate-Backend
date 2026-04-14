import mongoose from "mongoose";
import { z } from "zod";

export const VISIT_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

const objectIdString = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid id" });

export const createVisitSchema = z.object({
  leadId: objectIdString,
  salesId: objectIdString,
  visitTime: z.coerce.date(),
  location: z.string().trim().min(1)
});

export const updateVisitSchema = z
  .object({
    status: z.enum(VISIT_STATUSES).optional(),
    salesId: objectIdString.optional(),
    visitTime: z.coerce.date().optional(),
    location: z.string().trim().min(1).optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field is required" });

export const updateVisitStatusSchema = z.object({
  status: z.enum(VISIT_STATUSES)
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;

