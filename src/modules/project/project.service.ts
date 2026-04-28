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

type PublicProject = {
  id: string;
  name: string;
  propertyType: string;
  status: string;
  pricingType: "unit_based" | "direct";
  amenities: string[];
  description: string;
  units?: { type: string; minPrice: number; maxPrice: number; size?: string }[];
  price?: { min: number; max: number };
  images: string[];
  city: PublicCity | null;
  createdAt?: Date;
  updatedAt?: Date;
};

function assertValidProjectId(projectId: string) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new AppError("Invalid project id", 400);
  }
}

function sanitizeProject(project: {
  _id: unknown;
  name: string;
  propertyType: string;
  status: string;
  pricingType: "unit_based" | "direct";
  amenities?: unknown;
  description?: unknown;
  units?: unknown;
  price?: unknown;
  images: string[];
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

  const units = Array.isArray(project.units)
    ? project.units
        .map((u) => {
          const row = u as Record<string, unknown>;
          const type = typeof row.type === "string" ? row.type : "";
          const minPrice = typeof row.minPrice === "number" ? row.minPrice : NaN;
          const maxPrice = typeof row.maxPrice === "number" ? row.maxPrice : NaN;
          const size = typeof row.size === "string" ? row.size : undefined;
          if (!type || !Number.isFinite(minPrice) || !Number.isFinite(maxPrice)) return null;
          return { type, minPrice, maxPrice, size };
        })
        .filter(Boolean)
    : undefined;

  const priceObj =
    project.price && typeof project.price === "object" && project.price !== null
      ? (project.price as Record<string, unknown>)
      : null;
  const price =
    priceObj &&
    typeof priceObj.min === "number" &&
    Number.isFinite(priceObj.min) &&
    typeof priceObj.max === "number" &&
    Number.isFinite(priceObj.max)
      ? { min: priceObj.min, max: priceObj.max }
      : undefined;

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
    propertyType: project.propertyType,
    status: project.status,
    pricingType: project.pricingType,
    amenities,
    description,
    units: units && units.length > 0 ? (units as any) : undefined,
    price,
    images: Array.isArray(project.images) ? project.images : [],
    city: publicCity && publicCity.id ? publicCity : null,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt
  };
}

export async function createProject(input: CreateProjectInput) {
  await assertCityExists(input.cityId);

  if (input.pricingType === "unit_based") {
    if (!input.units || input.units.length === 0) {
      throw new AppError("Units required for unit-based pricing", 400);
    }
  }

  if (input.pricingType === "direct") {
    if (!input.price) {
      throw new AppError("Price required for direct pricing", 400);
    }
  }

  const created = await repo.createProject({
    name: input.name,
    cityId: new mongoose.Types.ObjectId(input.cityId),
    propertyType: input.propertyType,
    status: input.status,
    pricingType: input.pricingType,
    amenities: input.amenities ?? [],
    description: input.description ?? "",
    units: input.units,
    price: input.price,
    images: input.images ?? []
  });

  const reloaded = await repo.findProjectById(created._id);
  if (!reloaded) throw new AppError("Project not found", 404);

  return sanitizeProject({
    _id: reloaded._id,
    name: reloaded.name,
    propertyType: reloaded.propertyType,
    status: reloaded.status,
    pricingType: reloaded.pricingType,
    amenities: (reloaded as any).amenities,
    description: (reloaded as any).description,
    units: (reloaded as any).units,
    price: (reloaded as any).price,
    images: reloaded.images,
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

  if (typeof filters.propertyType === "string") {
    repoFilters.propertyType = filters.propertyType;
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

  const items = projects.map((p) =>
    sanitizeProject({
      _id: p._id,
      name: p.name,
      propertyType: p.propertyType,
      status: p.status,
      pricingType: (p as any).pricingType,
      amenities: (p as any).amenities,
      description: (p as any).description,
      units: (p as any).units,
      price: (p as any).price,
      images: p.images,
      cityId: p.cityId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })
  );

  return { items, total };
}

export async function getProjectById(projectId: string) {
  assertValidProjectId(projectId);

  const project = await repo.findProjectById(new mongoose.Types.ObjectId(projectId));
  if (!project) throw new AppError("Project not found", 404);

  return sanitizeProject({
    _id: project._id,
    name: project.name,
    propertyType: project.propertyType,
    status: project.status,
    pricingType: (project as any).pricingType,
    amenities: (project as any).amenities,
    description: (project as any).description,
    units: (project as any).units,
    price: (project as any).price,
    images: project.images,
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

  const nextPricingType =
    input.pricingType ?? ((current as any).pricingType as "unit_based" | "direct" | undefined);

  const nextUnits = input.units ?? ((current as any).units as any);
  const nextPrice = input.price ?? ((current as any).price as any);

  if (typeof input.cityId === "string" && input.cityId !== currentCityId) {
    await assertCityExists(input.cityId);
  }

  if (nextPricingType === "unit_based") {
    if (!Array.isArray(nextUnits) || nextUnits.length === 0) {
      throw new AppError("Units required for unit-based pricing", 400);
    }
  }

  if (nextPricingType === "direct") {
    if (!nextPrice) {
      throw new AppError("Price required for direct pricing", 400);
    }
  }

  const updated = await repo.updateProjectById(id, {
    ...(typeof input.name === "string" ? { name: input.name } : {}),
    ...(typeof input.cityId === "string" ? { cityId: new mongoose.Types.ObjectId(input.cityId) } : {}),
    ...(typeof input.propertyType === "string" ? { propertyType: input.propertyType as any } : {}),
    ...(typeof input.status === "string" ? { status: input.status } : {}),
    ...(typeof input.pricingType === "string" ? { pricingType: input.pricingType as any } : {}),
    ...(input.amenities !== undefined ? { amenities: input.amenities ?? [] } : {}),
    ...(input.description !== undefined ? { description: input.description ?? "" } : {}),
    ...(input.units !== undefined ? { units: input.units as any } : {}),
    ...(input.price !== undefined ? { price: input.price as any } : {}),
    ...(input.images !== undefined ? { images: input.images ?? [] } : {})
  } as any);
  if (!updated) throw new AppError("Project not found", 404);

  return sanitizeProject({
    _id: updated._id,
    name: updated.name,
    propertyType: updated.propertyType,
    status: updated.status,
    pricingType: (updated as any).pricingType,
    amenities: (updated as any).amenities,
    description: (updated as any).description,
    units: (updated as any).units,
    price: (updated as any).price,
    images: updated.images,
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
      repoFilters.propertyType = value;
      continue;
    }
  }

  const projects = await repo.findProjects(repoFilters, { skip: 0, limit: 1000 });

  return projects.map((p) =>
    sanitizeProject({
      _id: p._id,
      name: p.name,
      propertyType: p.propertyType,
      status: p.status,
      pricingType: (p as any).pricingType,
      amenities: (p as any).amenities,
      description: (p as any).description,
      units: (p as any).units,
      price: (p as any).price,
      images: p.images,
      cityId: p.cityId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    })
  );
}

