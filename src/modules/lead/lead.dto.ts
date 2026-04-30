import mongoose from "mongoose";
import { z } from "zod";

export const LEAD_STATUSES = ["new", "contacted", "scheduled", "visited", "closed"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

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

const objectIdString = z
  .string()
  .min(1)
  .refine((val) => mongoose.Types.ObjectId.isValid(val), { message: "Invalid id" });

export const createLeadSchema = z.object({
  projectId: objectIdString,
  interest: z
    .object({
      category: z.enum(["commercial", "residential"]),
      subType: z.string().min(1),
      apartmentConfig: z.string().min(1).optional(),
      unitTypeKey: z.string().min(1).optional(),
      unitTypeLabel: z.string().min(1).optional()
    })
    .superRefine((interest, ctx) => {
      if (interest.category === "residential" && interest.subType === "apartment") {
        if (!interest.apartmentConfig) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "interest.apartmentConfig is required when subType=apartment"
          });
        }
      }
      if (interest.unitTypeLabel && !interest.unitTypeKey) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "interest.unitTypeKey is required when unitTypeLabel is provided"
        });
      }
    })
});

export const updateLeadSchema = z
  .object({
    status: z.enum(LEAD_STATUSES).optional(),
    assignedOpsId: objectIdString.optional(),
    assignedSalesId: objectIdString.optional()
  })
  .refine((obj) => Object.keys(obj).length > 0, { message: "At least one field is required" });

export const listLeadSchema = z.object({
  status: z.preprocess(firstQueryValue, z.enum(LEAD_STATUSES).optional()),
  userId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid userId"
    }),
  projectId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid projectId"
    }),
  assignedOpsId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid assignedOpsId"
    }),
  assignedSalesId: z
    .preprocess(firstQueryValue, z.string().min(1).optional())
    .refine((val) => val === undefined || mongoose.Types.ObjectId.isValid(val), {
      message: "Invalid assignedSalesId"
    }),

  page: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(1),
  limit: z.preprocess(asPositiveInt, z.number().int().positive().optional()).default(20),
  sortBy: z
    .preprocess(firstQueryValue, z.enum(["createdAt", "updatedAt"] as const).optional())
    .default("createdAt"),
  sortOrder: z.preprocess(asSortOrder, z.enum(["asc", "desc"] as const).optional()).default("desc")
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadInput = z.infer<typeof listLeadSchema>;

