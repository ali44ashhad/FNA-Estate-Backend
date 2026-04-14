import type { Types } from "mongoose";
import { Project } from "./project.model";

export type CreateProjectData = {
  name: string;
  cityId: Types.ObjectId;
  propertyType: "apartment" | "plot" | "villa";
  status: string;
  pricingType: "unit_based" | "direct";
  units?: { type: string; minPrice: number; maxPrice: number; size?: string }[];
  price?: { min: number; max: number };
  images: string[];
};

export type ProjectFilters = {
  cityId?: Types.ObjectId;
  propertyType?: string;
  minPrice?: number;
  maxPrice?: number;
};

export type ProjectFindOptions = {
  skip: number;
  limit: number;
};

export async function createProject(data: CreateProjectData) {
  return Project.create(data);
}

function buildFindQuery(filters: ProjectFilters) {
  const query: Record<string, unknown> = { isDeleted: false };

  if (filters.cityId) query.cityId = filters.cityId;
  if (filters.propertyType) query.propertyType = filters.propertyType;

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = typeof filters.minPrice === "number" ? filters.minPrice : 0;
    const max =
      typeof filters.maxPrice === "number" ? filters.maxPrice : Number.MAX_SAFE_INTEGER;

    query.$or = [
      {
        pricingType: "direct",
        "price.min": { $lte: max },
        "price.max": { $gte: min }
      },
      {
        pricingType: "unit_based",
        units: {
          $elemMatch: {
            minPrice: { $lte: max },
            maxPrice: { $gte: min }
          }
        }
      }
    ];
  }

  return query;
}

export async function findProjects(filters: ProjectFilters, options: ProjectFindOptions) {
  const query = buildFindQuery(filters);

  return Project.find(query)
    .populate("cityId", "name state")
    .skip(options.skip)
    .limit(options.limit)
    .lean();
}

export async function countProjects(filters: ProjectFilters) {
  const query = buildFindQuery(filters);
  return Project.countDocuments(query);
}

export async function findProjectById(id: Types.ObjectId) {
  return Project.findOne({ _id: id, isDeleted: false }).populate("cityId", "name state").lean();
}

