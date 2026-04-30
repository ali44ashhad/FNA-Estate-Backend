import type { Types } from "mongoose";
import { Project } from "./project.model";

export type CreateProjectData = {
  name: string;
  cityId: Types.ObjectId;
  status: string;
  projectCode: string;
  categories: ("commercial" | "residential")[];
  inventory: unknown[];
  amenities?: string[];
  description?: string;
  images: string[];
};

export type ProjectFilters = {
  cityId?: Types.ObjectId;
  // New filters
  category?: "commercial" | "residential";
  subType?: string;
  apartmentConfig?: string;

  // Legacy filter (mapped in service for backward compatibility)
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

export async function findProjectRawById(id: Types.ObjectId) {
  return Project.findOne({ _id: id, isDeleted: false }).lean();
}

function buildFindQuery(filters: ProjectFilters) {
  const query: Record<string, unknown> = { isDeleted: false };

  if (filters.cityId) query.cityId = filters.cityId;

  const inventoryElemMatch: Record<string, unknown> = {};
  if (filters.category) inventoryElemMatch.category = filters.category;
  if (filters.subType) inventoryElemMatch.subType = filters.subType;

  // apartmentConfig filter applies only to residential/apartment configs
  if (filters.apartmentConfig) {
    inventoryElemMatch.category = "residential";
    inventoryElemMatch.subType = "apartment";
    inventoryElemMatch.apartmentConfigs = { $elemMatch: { config: filters.apartmentConfig } };
  }

  if (Object.keys(inventoryElemMatch).length > 0) {
    query.inventory = { $elemMatch: inventoryElemMatch };
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const min = typeof filters.minPrice === "number" ? filters.minPrice : 0;
    const max =
      typeof filters.maxPrice === "number" ? filters.maxPrice : Number.MAX_SAFE_INTEGER;

    const apartmentConfig = filters.apartmentConfig;

    query.$or = [
      {
        // Non-apartment direct pricing
        inventory: {
          $elemMatch: {
            ...(filters.category ? { category: filters.category } : {}),
            ...(filters.subType ? { subType: filters.subType } : {}),
            pricingType: "direct",
            "price.min": { $lte: max },
            "price.max": { $gte: min }
          }
        }
      },
      {
        // Non-apartment unit-based pricing
        inventory: {
          $elemMatch: {
            ...(filters.category ? { category: filters.category } : {}),
            ...(filters.subType ? { subType: filters.subType } : {}),
            pricingType: "unit_based",
            units: {
              $elemMatch: {
                minPrice: { $lte: max },
                maxPrice: { $gte: min }
              }
            }
          }
        }
      },
      {
        // Apartment config direct pricing
        inventory: {
          $elemMatch: {
            category: "residential",
            subType: "apartment",
            apartmentConfigs: {
              $elemMatch: {
                ...(apartmentConfig ? { config: apartmentConfig } : {}),
                pricingType: "direct",
                "price.min": { $lte: max },
                "price.max": { $gte: min }
              }
            }
          }
        }
      },
      {
        // Apartment config unit-based pricing
        inventory: {
          $elemMatch: {
            category: "residential",
            subType: "apartment",
            apartmentConfigs: {
              $elemMatch: {
                ...(apartmentConfig ? { config: apartmentConfig } : {}),
                pricingType: "unit_based",
                units: {
                  $elemMatch: {
                    minPrice: { $lte: max },
                    maxPrice: { $gte: min }
                  }
                }
              }
            }
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

export async function updateProjectById(id: Types.ObjectId, data: Partial<CreateProjectData>) {
  return Project.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true })
    .populate("cityId", "name state")
    .lean();
}

export async function softDeleteProjectById(id: Types.ObjectId) {
  return Project.findOneAndUpdate(
    { _id: id, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { new: true }
  ).lean();
}

