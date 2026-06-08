import mongoose from "mongoose";
import { z } from "zod";

export const VISIT_STATUSES = ["scheduled", "completed", "cancelled"] as const;
export type VisitStatus = (typeof VISIT_STATUSES)[number];

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

export const createVisitSchema = z.object({
  leadId: objectIdString,
  salesId: objectIdString,
  visitTime: z.coerce.date(),
  location: z.string().trim().min(1),
  locationLink: z.string().trim().min(1).optional()
});

export const updateVisitSchema = z
  .object({
    status: z.enum(VISIT_STATUSES).optional(),
    salesId: objectIdString.optional(),
    visitTime: z.coerce.date().optional(),
    location: z.string().trim().min(1).optional(),
    locationLink: z.string().trim().min(1).optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field is required" });

export const updateVisitStatusSchema = z.object({
  status: z.enum(VISIT_STATUSES)
});

export const listVisitSchema = z.object({
  status: z.preprocess(firstQueryValue, z.enum(VISIT_STATUSES).optional()),
  salesId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid salesId"
    }),
  leadId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid leadId"
    }),
  from: z.preprocess(firstQueryValue, z.coerce.date().optional()),
  to: z.preprocess(firstQueryValue, z.coerce.date().optional()),

  page: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(1),
  limit: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(20),
  sortBy: z
    .preprocess(firstQueryValue, z.enum(["visitTime", "createdAt", "updatedAt"] as const).optional())
    .default("visitTime"),
  sortOrder: z.preprocess(asSortOrder, z.enum(["asc", "desc"] as const).optional()).default("desc")
});

export const listMyVisitsSchema = z.object({
  from: z.preprocess(firstQueryValue, z.coerce.date().optional()),
  to: z.preprocess(firstQueryValue, z.coerce.date().optional()),

  page: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(1),
  limit: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(20),
  sortBy: z
    .preprocess(firstQueryValue, z.enum(["visitTime", "createdAt", "updatedAt"] as const).optional())
    .default("visitTime"),
  sortOrder: z.preprocess(asSortOrder, z.enum(["asc", "desc"] as const).optional()).default("desc")
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;
export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;
export type UpdateVisitStatusInput = z.infer<typeof updateVisitStatusSchema>;
export type ListVisitInput = z.infer<typeof listVisitSchema>;
export type ListMyVisitsInput = z.infer<typeof listMyVisitsSchema>;

