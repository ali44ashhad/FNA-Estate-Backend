import type { Request, Response } from "express";
import {
  createProjectSchema,
  filterProjectSchema,
  recommendProjectsSchema,
  updateProjectSchema
} from "./project.dto";
import * as ProjectService from "./project.service";
import { getPagination } from "../../shared/utils/pagination";

export const createProject = async (req: Request, res: Response) => {
  const input = createProjectSchema.parse(req.body);
  const project = await ProjectService.createProject(input);

  res.json({
    success: true,
    message: "Project created",
    data: project
  });
};

export const getProjects = async (req: Request, res: Response) => {
  const filters = filterProjectSchema.parse(req.query);
  const { page, limit, skip } = getPagination({ page: filters.page, limit: filters.limit });
  const { items, total } = await ProjectService.getProjects(filters, { skip, limit });

  res.json({
    success: true,
    message: "OK",
    data: items,
    meta: {
      page,
      limit,
      total,
      hasNext: page * limit < total
    }
  });
};

export const getAdminProjects = async (req: Request, res: Response) => {
  const filters = filterProjectSchema.parse(req.query);
  const { page, limit, skip } = getPagination({ page: filters.page, limit: filters.limit });
  const { items, total } = await ProjectService.getAdminProjects(filters, { skip, limit });

  res.json({
    success: true,
    message: "OK",
    data: items,
    meta: {
      page,
      limit,
      total,
      hasNext: page * limit < total
    }
  });
};

export const getProjectById = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = await ProjectService.getProjectById(id);

  res.json({
    success: true,
    message: "OK",
    data: project
  });
};

export const getAdminProjectById = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = await ProjectService.getAdminProjectById(id);

  res.json({
    success: true,
    message: "OK",
    data: project
  });
};

export const updateProject = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const input = updateProjectSchema.parse(req.body);
  const project = await ProjectService.updateProject(id, input);

  res.json({
    success: true,
    message: "Project updated",
    data: project
  });
};

export const deleteProject = async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await ProjectService.deleteProject(id);

  res.json({
    success: true,
    message: "Project deleted"
  });
};

export const recommendProjects = async (req: Request, res: Response) => {
  const input = recommendProjectsSchema.parse(req.body);
  const projects = await ProjectService.recommendProjects(input);

  res.json({
    success: true,
    message: "OK",
    data: projects
  });
};

