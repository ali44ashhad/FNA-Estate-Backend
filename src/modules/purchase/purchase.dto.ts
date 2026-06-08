import mongoose from "mongoose";
import { z } from "zod";

const objectIdString = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid id" });

function firstQueryValue(val: unknown): unknown {
  return Array.isArray(val) ? val[0] : val;
}

function asPositiveInt(val: unknown): number | undefined {
  const raw = firstQueryValue(val);
  if (raw === undefined || raw === null || raw === "") return undefined;

  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return undefined;
  const int = Math.floor(n);
  return int > 0 ? int : undefined;
}

function asSortOrder(val: unknown): "asc" | "desc" | undefined {
  const raw = firstQueryValue(val);
  if (raw === undefined || raw === null || raw === "") return undefined;
  if (raw === "asc" || raw === "desc") return raw;
  return undefined;
}

export const createPurchaseSchema = z.object({
  leadId: objectIdString.optional(),
  visitId: objectIdString.optional(),
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

  if (byAdmin && !hasLead) {
    if (!obj.userId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "userId required when createdByAdmin=true" });
    if (!obj.projectId) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "projectId required when createdByAdmin=true" });
  }

  if (obj.unitTypeLabel && !obj.unitTypeKey) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "unitTypeKey required when unitTypeLabel is provided" });
  }
});

export const listPurchasesSchema = z.object({
  status: z.preprocess(
    firstQueryValue,
    z.enum(["booked", "cancelled", "refunded"] as const).optional()
  ),
  from: z.preprocess(firstQueryValue, z.coerce.date().optional()),
  to: z.preprocess(firstQueryValue, z.coerce.date().optional()),

  page: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(1),
  limit: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(20),
  sortBy: z
    .preprocess(firstQueryValue, z.enum(["createdAt", "updatedAt"] as const).optional())
    .default("createdAt"),
  sortOrder: z.preprocess(asSortOrder, z.enum(["asc", "desc"] as const).optional()).default("desc")
});

export const updatePurchaseStatusSchema = z.object({
  status: z.enum(["booked", "cancelled", "refunded"] as const)
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type ListPurchasesInput = z.infer<typeof listPurchasesSchema>;
export type UpdatePurchaseStatusInput = z.infer<typeof updatePurchaseStatusSchema>;

