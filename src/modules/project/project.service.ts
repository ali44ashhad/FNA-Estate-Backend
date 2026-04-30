import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import type {
  CreateProjectInput,
  FilterProjectInput,
  RecommendProjectsInput,
  UpdateProjectInput
} from "./project.dto";
import * as repo from "./project.repository";
import { assertCityExists } from "../city/city.service";
import * as questionRepo from "../questionnaire/question.repository";

type PublicCity = { id: string; name: string; state: string };

type PublicInventoryItem = {
  category: "commercial" | "residential";
  subType: string;
  apartmentConfigs?: { config: string; configLabel?: string }[];
};

type PublicProject = {
  id: string;
  name: string;
  status: string;
  amenities: string[];
  description: string;
  images: string[];
  categories: Array<"commercial" | "residential">;
  inventory: PublicInventoryItem[];
  city: PublicCity | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type AdminUnit = {
  unitKey: string;
  unitLabel: string;
  minPrice: number;
  maxPrice: number;
  size?: string;
};

type AdminApartmentConfig = {
  config: string;
  configLabel?: string;
  pricingType: "unit_based" | "direct";
  units?: AdminUnit[];
  price?: { min: number; max: number };
};

type AdminInventoryItem = {
  category: "commercial" | "residential";
  subType: string;
  pricingType?: "unit_based" | "direct";
  units?: AdminUnit[];
  price?: { min: number; max: number };
  apartmentConfigs?: AdminApartmentConfig[];
};

type AdminProject = {
  id: string;
  name: string;
  projectCode: string;
  status: string;
  amenities: string[];
  description: string;
  images: string[];
  categories: Array<"commercial" | "residential">;
  inventory: AdminInventoryItem[];
  city: PublicCity | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function assertValidProjectId(projectId: string) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400);
  }
}

function sanitizeProjectPublic(project: {
  _id: unknown;
  name: string;
  status: string;
  amenities?: unknown;
  description?: unknown;
  images: string[];
  categories?: unknown;
  inventory?: unknown;
  cityId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicProject {
  const city = project.cityId as { _id?: unknown; name?: unknown; state?: unknown } | undefined;

  const amenities = Array.isArray(project.amenities)
    ? project.amenities
        .map((a) => (typeof a === "string" ? a.trim() : ""))
        .filter(Boolean)
    : [];

  const description = typeof project.description === "string" ? project.description : "";

  const categories = Array.isArray(project.categories)
    ? project.categories
        .map((c) => (typeof c === "string" ? c.trim() : ""))
        .filter((c): c is "commercial" | "residential" => c === "commercial" || c === "residential")
    : [];

  const inventory = Array.isArray(project.inventory)
    ? project.inventory
        .map((row) => {
          const r = (row ?? {}) as Record<string, unknown>;
          const category = r.category === "commercial" || r.category === "residential" ? r.category : null;
          const subType = typeof r.subType === "string" ? r.subType : "";
          if (!category || !subType) return null;

          const isApartment = category === "residential" && subType === "apartment";
          const apartmentConfigs = isApartment && Array.isArray(r.apartmentConfigs)
            ? r.apartmentConfigs
                .map((c) => {
                  const cfg = (c ?? {}) as Record<string, unknown>;
                  const config = typeof cfg.config === "string" ? cfg.config : "";
                  if (!config) return null;
                  const configLabel = typeof cfg.configLabel === "string" ? cfg.configLabel : undefined;
                  return { config, configLabel };
                })
                .filter(Boolean)
            : undefined;

          return {
            category,
            subType,
            ...(apartmentConfigs && apartmentConfigs.length > 0 ? { apartmentConfigs } : {})
          } satisfies PublicInventoryItem;
        })
        .filter(Boolean)
    : [];

  const publicCity =
    city &&
    typeof city === "object" &&
    city !== null &&
    typeof city.name === "string" &&
    typeof city.state === "string" &&
    city._id
      ? {
          id: String(city._id),
          name: city.name,
          state: city.state
        }
      : null;

  return {
    id: String(project._id),
    name: project.name,
    status: project.status,
    amenities,
    description,
    images: Array.isArray(project.images) ? project.images : [],
    categories,
    inventory,
    city: publicCity && publicCity.id ? publicCity : null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

function sanitizeProjectAdmin(project: {
  _id: unknown;
  name: string;
  projectCode?: unknown;
  status: string;
  amenities?: unknown;
  description?: unknown;
  images: string[];
  categories?: unknown;
  inventory?: unknown;
  cityId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): AdminProject {
  const base = sanitizeProjectPublic(project);
  const inventory = Array.isArray(project.inventory)
    ? project.inventory
        .map((row) => {
          const r = (row ?? {}) as Record<string, unknown>;
          const category = r.category === "commercial" || r.category === "residential" ? r.category : null;
          const subType = typeof r.subType === "string" ? r.subType : "";
          if (!category || !subType) return null;

          const pricingType = r.pricingType === "unit_based" || r.pricingType === "direct" ? r.pricingType : undefined;

          const units = Array.isArray(r.units)
            ? r.units
                .map((u) => {
                  const uu = (u ?? {}) as Record<string, unknown>;
                  const unitKey = typeof uu.unitKey === "string" ? uu.unitKey : "";
                  const unitLabel = typeof uu.unitLabel === "string" ? uu.unitLabel : "";
                  const minPrice = typeof uu.minPrice === "number" ? uu.minPrice : NaN;
                  const maxPrice = typeof uu.maxPrice === "number" ? uu.maxPrice : NaN;
                  const size = typeof uu.size === "string" ? uu.size : undefined;
                  if (!unitKey || !unitLabel || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return null;
                  return { unitKey, unitLabel, minPrice, maxPrice, size } satisfies AdminUnit;
                })
                .filter(Boolean)
            : undefined;

          const priceObj =
            r.price && typeof r.price === "object" && r.price !== null ? (r.price as Record<string, unknown>) : null;
          const price =
            priceObj &&
            typeof priceObj.min === "number" &&
            Number.isFinite(priceObj.min) &&
            typeof priceObj.max === "number" &&
            Number.isFinite(priceObj.max)
              ? { min: priceObj.min, max: priceObj.max }
              : undefined;

          const apartmentConfigs = Array.isArray(r.apartmentConfigs)
            ? r.apartmentConfigs
                .map((c) => {
                  const cfg = (c ?? {}) as Record<string, unknown>;
                  const config = typeof cfg.config === "string" ? cfg.config : "";
                  if (!config) return null;
                  const configLabel = typeof cfg.configLabel === "string" ? cfg.configLabel : undefined;
                  const cfgPricingType =
                    cfg.pricingType === "unit_based" || cfg.pricingType === "direct" ? cfg.pricingType : undefined;
                  if (!cfgPricingType) return null;

                  const cfgUnits = Array.isArray(cfg.units)
                    ? cfg.units
                        .map((u) => {
                          const uu = (u ?? {}) as Record<string, unknown>;
                          const unitKey = typeof uu.unitKey === "string" ? uu.unitKey : "";
                          const unitLabel = typeof uu.unitLabel === "string" ? uu.unitLabel : "";
                          const minPrice = typeof uu.minPrice === "number" ? uu.minPrice : NaN;
                          const maxPrice = typeof uu.maxPrice === "number" ? uu.maxPrice : NaN;
                          const size = typeof uu.size === "string" ? uu.size : undefined;
                          if (!unitKey || !unitLabel || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice))
                            return null;
                          return { unitKey, unitLabel, minPrice, maxPrice, size } satisfies AdminUnit;
                        })
                        .filter(Boolean)
                    : undefined;

                  const cfgPriceObj =
                    cfg.price && typeof cfg.price === "object" && cfg.price !== null
                      ? (cfg.price as Record<string, unknown>)
                      : null;
                  const cfgPrice =
                    cfgPriceObj &&
                    typeof cfgPriceObj.min === "number" &&
                    Number.isFinite(cfgPriceObj.min) &&
                    typeof cfgPriceObj.max === "number" &&
                    Number.isFinite(cfgPriceObj.max)
                      ? { min: cfgPriceObj.min, max: cfgPriceObj.max }
                      : undefined;

                  return {
                    config,
                    configLabel,
                    pricingType: cfgPricingType,
                    ...(cfgUnits && cfgUnits.length > 0 ? { units: cfgUnits as AdminUnit[] } : {}),
                    ...(cfgPrice ? { price: cfgPrice } : {})
                  } satisfies AdminApartmentConfig;
                })
                .filter(Boolean)
            : undefined;

          return {
            category,
            subType,
            ...(pricingType ? { pricingType } : {}),
            ...(units && units.length > 0 ? { units: units as AdminUnit[] } : {}),
            ...(price ? { price } : {}),
            ...(apartmentConfigs && apartmentConfigs.length > 0
              ? { apartmentConfigs: apartmentConfigs as AdminApartmentConfig[] }
              : {})
          } satisfies AdminInventoryItem;
        })
        .filter(Boolean)
    : [];

  const projectCode = typeof project.projectCode === "string" ? project.projectCode : "";

  return {
    id: base.id,
    name: base.name,
    projectCode,
    status: base.status,
    amenities: base.amenities,
    description: base.description,
    images: base.images,
    categories: base.categories,
    inventory,
    city: base.city,
    createdAt: base.createdAt,
    updatedAt: base.updatedAt
  };
}

function uniqueCategoriesFromInventory(inventory: Array<{ category: string }>) {
  const set = new Set<"commercial" | "residential">();
  for (const i of inventory) {
    if (i.category === "commercial" || i.category === "residential") set.add(i.category);
  }
  return [...set];
}

function legacyToInventory(legacy: {
  propertyType?: unknown;
  pricingType?: unknown;
  units?: unknown;
  price?: unknown;
}): { categories: Array<"commercial" | "residential">; inventory: AdminInventoryItem[] } {
  const propertyType = typeof legacy.propertyType === "string" ? legacy.propertyType : "";
  const pricingType = legacy.pricingType === "unit_based" || legacy.pricingType === "direct" ? legacy.pricingType : null;

  const subType =
    propertyType === "apartment" ? "apartment" : propertyType === "villa" ? "villa" : propertyType === "plot" ? "residential_plot" : "";
  if (!subType || !pricingType) return { categories: [], inventory: [] };

  // Legacy units are {type,minPrice,maxPrice,size?} but new schema expects {unitKey,unitLabel,...}
  const units = Array.isArray(legacy.units)
    ? legacy.units
        .map((u) => {
          const r = (u ?? {}) as Record<string, unknown>;
          const label = typeof r.type === "string" ? r.type.trim() : "";
          const minPrice = typeof r.minPrice === "number" ? r.minPrice : NaN;
          const maxPrice = typeof r.maxPrice === "number" ? r.maxPrice : NaN;
          const size = typeof r.size === "string" ? r.size : undefined;
          if (!label || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return null;
          const unitKey = label.toLowerCase().replace(/\s+/g, "_");
          return { unitKey, unitLabel: label, minPrice, maxPrice, size } satisfies AdminUnit;
        })
        .filter(Boolean)
    : undefined;

  const priceObj =
    legacy.price && typeof legacy.price === "object" && legacy.price !== null ? (legacy.price as Record<string, unknown>) : null;
  const price =
    priceObj && typeof priceObj.min === "number" && typeof priceObj.max === "number"
      ? { min: priceObj.min, max: priceObj.max }
      : undefined;

  const inv: AdminInventoryItem = {
    category: "residential",
    subType,
    pricingType,
    ...(pricingType === "unit_based" && units && units.length > 0 ? { units: units as AdminUnit[] } : {}),
    ...(pricingType === "direct" && price ? { price } : {})
  };

  return { categories: uniqueCategoriesFromInventory([inv]), inventory: [inv] };
}

export async function createProject(input: CreateProjectInput) {
  await assertCityExists(input.cityId);
  const categories = uniqueCategoriesFromInventory(input.inventory);

  const created = await repo.createProject({
    name: input.name,
    cityId: new mongoose.Types.ObjectId(input.cityId),
    status: input.status,
    projectCode: input.projectCode,
    categories,
    inventory: input.inventory as any,
    amenities: input.amenities ?? [],
    description: input.description ?? "",
    images: input.images ?? []
  });

  const reloaded = await repo.findProjectById(created._id);
  if (!reloaded) throw new AppError("Project not found", 404);

  return sanitizeProjectAdmin({
    _id: reloaded._id,
    name: reloaded.name,
    projectCode: (reloaded as any).projectCode,
    status: reloaded.status,
    amenities: (reloaded as any).amenities,
    description: (reloaded as any).description,
    images: reloaded.images,
    categories: (reloaded as any).categories,
    inventory: (reloaded as any).inventory,
    cityId: reloaded.cityId,
    createdAt: reloaded.createdAt,
    updatedAt: reloaded.updatedAt
  });
}

export async function getProjects(
  filters: FilterProjectInput,
  pagination: { skip: number; limit: number }
) {
  const repoFilters: repo.ProjectFilters = {};

  if (typeof filters.cityId === "string") {
    repoFilters.cityId = new mongoose.Types.ObjectId(filters.cityId);
  }

  if (filters.category) repoFilters.category = filters.category;
  if (typeof filters.subType === "string") repoFilters.subType = filters.subType;
  if (typeof filters.apartmentConfig === "string") repoFilters.apartmentConfig = filters.apartmentConfig;

  // Backward compatible filter mapping for legacy callers
  if (!repoFilters.category && !repoFilters.subType && typeof filters.propertyType === "string") {
    const v = filters.propertyType.trim();
    if (v === "apartment") {
      repoFilters.category = "residential";
      repoFilters.subType = "apartment";
    } else if (v === "villa") {
      repoFilters.category = "residential";
      repoFilters.subType = "villa";
    } else if (v === "plot") {
      repoFilters.category = "residential";
      repoFilters.subType = "residential_plot";
    }
  }

  if (typeof filters.minPrice === "number") {
    repoFilters.minPrice = filters.minPrice;
  }

  if (typeof filters.maxPrice === "number") {
    repoFilters.maxPrice = filters.maxPrice;
  }

  const [projects, total] = await Promise.all([
    repo.findProjects(repoFilters, pagination),
    repo.countProjects(repoFilters)
  ]);

  const items = projects.map((p) => {
    const inv = Array.isArray((p as any).inventory) ? ((p as any).inventory as unknown[]) : null;
    const cats = Array.isArray((p as any).categories) ? ((p as any).categories as unknown[]) : null;

    const derived = !inv || inv.length === 0 ? legacyToInventory(p as any) : null;

    return sanitizeProjectPublic({
      _id: p._id,
      name: p.name,
      status: p.status,
      amenities: (p as any).amenities,
      description: (p as any).description,
      images: p.images,
      categories: cats ?? derived?.categories,
      inventory: inv ?? derived?.inventory,
      cityId: p.cityId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  });

  return { items, total };
}

export async function getProjectById(projectId: string) {
  assertValidProjectId(projectId);

  const project = await repo.findProjectById(new mongoose.Types.ObjectId(projectId));
  if (!project) throw new AppError("Project not found", 404);

  const inv = Array.isArray((project as any).inventory) ? ((project as any).inventory as unknown[]) : null;
  const cats = Array.isArray((project as any).categories) ? ((project as any).categories as unknown[]) : null;
  const derived = !inv || inv.length === 0 ? legacyToInventory(project as any) : null;

  return sanitizeProjectPublic({
    _id: project._id,
    name: project.name,
    status: project.status,
    amenities: (project as any).amenities,
    description: (project as any).description,
    images: project.images,
    categories: cats ?? derived?.categories,
    inventory: inv ?? derived?.inventory,
    cityId: project.cityId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  });
}

export async function getAdminProjects(
  filters: FilterProjectInput,
  pagination: { skip: number; limit: number }
) {
  const { items, total } = await getProjects(filters, pagination);

  // Re-fetch raw docs for admin view (pricing included)
  const repoFilters: repo.ProjectFilters = {};
  if (typeof filters.cityId === "string") repoFilters.cityId = new mongoose.Types.ObjectId(filters.cityId);
  if (filters.category) repoFilters.category = filters.category;
  if (typeof filters.subType === "string") repoFilters.subType = filters.subType;
  if (typeof filters.apartmentConfig === "string") repoFilters.apartmentConfig = filters.apartmentConfig;
  if (typeof filters.minPrice === "number") repoFilters.minPrice = filters.minPrice;
  if (typeof filters.maxPrice === "number") repoFilters.maxPrice = filters.maxPrice;

  const [projects, total2] = await Promise.all([
    repo.findProjects(repoFilters, pagination),
    Promise.resolve(total)
  ]);
  void total2;

  const adminItems = projects.map((p) => {
    const inv = Array.isArray((p as any).inventory) ? ((p as any).inventory as unknown[]) : null;
    const cats = Array.isArray((p as any).categories) ? ((p as any).categories as unknown[]) : null;
    const derived = !inv || inv.length === 0 ? legacyToInventory(p as any) : null;
    return sanitizeProjectAdmin({
      _id: p._id,
      name: p.name,
      projectCode: (p as any).projectCode,
      status: p.status,
      amenities: (p as any).amenities,
      description: (p as any).description,
      images: p.images,
      categories: cats ?? derived?.categories,
      inventory: inv ?? derived?.inventory,
      cityId: p.cityId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  });

  return { items: adminItems, total };
}

export async function getAdminProjectById(projectId: string) {
  assertValidProjectId(projectId);
  const project = await repo.findProjectById(new mongoose.Types.ObjectId(projectId));
  if (!project) throw new AppError("Project not found", 404);

  const inv = Array.isArray((project as any).inventory) ? ((project as any).inventory as unknown[]) : null;
  const cats = Array.isArray((project as any).categories) ? ((project as any).categories as unknown[]) : null;
  const derived = !inv || inv.length === 0 ? legacyToInventory(project as any) : null;

  return sanitizeProjectAdmin({
    _id: project._id,
    name: project.name,
    projectCode: (project as any).projectCode,
    status: project.status,
    amenities: (project as any).amenities,
    description: (project as any).description,
    images: project.images,
    categories: cats ?? derived?.categories,
    inventory: inv ?? derived?.inventory,
    cityId: project.cityId,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  });
}

export async function updateProject(projectId: string, input: UpdateProjectInput) {
  assertValidProjectId(projectId);
  const id = new mongoose.Types.ObjectId(projectId);

  const current = await repo.findProjectRawById(id);
  if (!current) throw new AppError("Project not found", 404);

  const currentCityId = String((current as any).cityId);

  if (typeof input.cityId === "string" && input.cityId !== currentCityId) {
    await assertCityExists(input.cityId);
  }

  const nextInventory = input.inventory ?? ((current as any).inventory as any);
  const nextCategories = Array.isArray(nextInventory)
    ? uniqueCategoriesFromInventory(nextInventory)
    : ((current as any).categories as any);

  const updated = await repo.updateProjectById(id, {
    ...(typeof input.name === "string" ? { name: input.name } : {}),
    ...(typeof input.cityId === "string" ? { cityId: new mongoose.Types.ObjectId(input.cityId) } : {}),
    ...(typeof input.status === "string" ? { status: input.status } : {}),
    ...(typeof input.projectCode === "string" ? { projectCode: input.projectCode } : {}),
    ...(input.inventory !== undefined ? { inventory: input.inventory as any } : {}),
    ...(input.inventory !== undefined ? { categories: nextCategories } : {}),
    ...(input.amenities !== undefined ? { amenities: input.amenities ?? [] } : {}),
    ...(input.description !== undefined ? { description: input.description ?? "" } : {}),
    ...(input.images !== undefined ? { images: input.images ?? [] } : {})
  } as any);
  if (!updated) throw new AppError("Project not found", 404);

  return sanitizeProjectAdmin({
    _id: updated._id,
    name: updated.name,
    projectCode: (updated as any).projectCode,
    status: updated.status,
    amenities: (updated as any).amenities,
    description: (updated as any).description,
    images: updated.images,
    categories: (updated as any).categories,
    inventory: (updated as any).inventory,
    cityId: updated.cityId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt
  });
}

export async function deleteProject(projectId: string) {
  assertValidProjectId(projectId);
  const deleted = await repo.softDeleteProjectById(new mongoose.Types.ObjectId(projectId));
  if (!deleted) throw new AppError("Project not found", 404);
}

function normalizeQuestionType(type: string) {
  return type.trim().toLowerCase();
}

export async function recommendProjects(input: RecommendProjectsInput) {
  const rows = input.responses;

  const questionIds = [...new Set(rows.map((r) => r.questionId))].map((id) => new mongoose.Types.ObjectId(id));
  const optionIds = [...new Set(rows.map((r) => r.optionId))].map((id) => new mongoose.Types.ObjectId(id));

  const [questions, options] = await Promise.all([
    Promise.all(questionIds.map((id) => questionRepo.findQuestionById(id))),
    questionRepo.findOptionsByIds(optionIds)
  ]);

  const questionsById = new Map<string, { _id: unknown; type?: unknown }>();
  for (const q of questions) {
    if (q?._id) questionsById.set(String(q._id), { _id: q._id, type: (q as any).type });
  }
  if (questionsById.size !== questionIds.length) {
    throw new AppError("Invalid questionId", 400);
  }

  const optionsById = new Map<string, { _id: unknown; questionId?: unknown; value?: unknown }>();
  for (const o of options) {
    if (o?._id) {
      optionsById.set(String(o._id), {
        _id: o._id,
        questionId: (o as any).questionId,
        value: (o as any).value
      });
    }
  }
  if (optionsById.size !== optionIds.length) {
    throw new AppError("Invalid optionId", 400);
  }

  const repoFilters: repo.ProjectFilters = {};

  for (const r of rows) {
    const q = questionsById.get(r.questionId);
    const o = optionsById.get(r.optionId);
    if (!q) throw new AppError("Invalid questionId", 400);
    if (!o) throw new AppError("Invalid optionId", 400);

    if (String(o.questionId) !== r.questionId) {
      throw new AppError("Option does not belong to question", 400);
    }

    const qType = typeof q.type === "string" ? normalizeQuestionType(q.type) : "";
    const value = typeof o.value === "string" ? o.value.trim() : "";

    if ((qType === "cityid" || qType === "city") && mongoose.Types.ObjectId.isValid(value)) {
      repoFilters.cityId = new mongoose.Types.ObjectId(value);
      continue;
    }

    if (qType === "propertytype" && value.length > 0) {
      // Backward compatible recommendation filters
      if (value === "apartment") {
        repoFilters.category = "residential";
        repoFilters.subType = "apartment";
      } else if (value === "villa") {
        repoFilters.category = "residential";
        repoFilters.subType = "villa";
      } else if (value === "plot") {
        repoFilters.category = "residential";
        repoFilters.subType = "residential_plot";
      }
      continue;
    }
  }

  const projects = await repo.findProjects(repoFilters, { skip: 0, limit: 1000 });

  return projects.map((p) => {
    const inv = Array.isArray((p as any).inventory) ? ((p as any).inventory as unknown[]) : null;
    const cats = Array.isArray((p as any).categories) ? ((p as any).categories as unknown[]) : null;
    const derived = !inv || inv.length === 0 ? legacyToInventory(p as any) : null;

    return sanitizeProjectPublic({
      _id: p._id,
      name: p.name,
      status: p.status,
      amenities: (p as any).amenities,
      description: (p as any).description,
      images: p.images,
      categories: cats ?? derived?.categories,
      inventory: inv ?? derived?.inventory,
      cityId: p.cityId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    });
  });
}

