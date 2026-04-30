import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid id" });

export const createPurchaseSchema = z.object({
  leadId: objectIdString.optional(),
  createdByAdmin: z.boolean().optional(),
  userId: objectIdString.optional(),
  projectId: objectIdString.optional(),

  category: z.enum(["commercial", "residential"]).optional(),
  subType: z.string().min(1).optional(),
  apartmentConfig: z.string().min(1).optional(),
  unitTypeKey: z.string().min(1).optional(),
  unitTypeLabel: z.string().min(1).optional(),

  agreedPrice: z.number().positive().optional(),
  // Backward-compatible alias
  amount: z.number().positive().optional(),
  meta: z.record(z.unknown()).optional()
}).superRefine((obj, ctx) => {
  const price = obj.agreedPrice ?? obj.amount;
  if (typeof price !== "number" || !Number.isFinite(price) || price <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "agreedPrice is required" });
  }

  const hasLead = typeof obj.leadId === "string";
  const byAdmin = obj.createdByAdmin === true;

  if (!hasLead && !byAdmin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either leadId is required or createdByAdmin=true with userId+projectId"
    });
  }

  if (byAdmin) {
    if (!obj.userId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "userId required when createdByAdmin=true" });
    if (!obj.projectId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "projectId required when createdByAdmin=true" });
  }

  if (obj.unitTypeLabel && !obj.unitTypeKey) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "unitTypeKey required when unitTypeLabel is provided" });
  }
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

