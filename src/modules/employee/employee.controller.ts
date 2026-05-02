import type { Request, Response } from "express";
import { createEmployeeSchema, filterEmployeesSchema } from "./employee.dto";
import {
  createEmployee as createEmployeeSvc,
  getEmployees as getEmployeesSvc,
  getEmployeesLookup as getEmployeesLookupSvc,
  getEmployeesLookupPaged as getEmployeesLookupPagedSvc,
  getEmployeesPaged as getEmployeesPagedSvc
} from "./employee.service";
import { getPagination } from "../../shared/utils/pagination";

export const createEmployee = async (req: Request, res: Response) => {
  const input = createEmployeeSchema.parse(req.body);
  const employee = await createEmployeeSvc(input);

  res.json({
    success: true,
    message: "Employee created",
    data: employee
  });
};

export const getEmployees = async (req: Request, res: Response) => {
  const filters = filterEmployeesSchema.parse(req.query);

  const wantsPagination =
    filters.page !== undefined ||
    filters.limit !== undefined ||
    filters.q !== undefined ||
    filters.role !== undefined;

  if (!wantsPagination) {
    const employees = await getEmployeesSvc();
    res.json({
      success: true,
      message: "OK",
      data: employees
    });
    return;
  }

  const { page, limit, skip } = getPagination({ page: filters.page, limit: filters.limit });
  const { items, total } = await getEmployeesPagedSvc(filters, { skip, limit });

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

export const getEmployeeLookup = async (req: Request, res: Response) => {
  const filters = filterEmployeesSchema.parse(req.query);

  const wantsPagination =
    filters.page !== undefined ||
    filters.limit !== undefined ||
    filters.q !== undefined ||
    filters.role !== undefined;

  if (!wantsPagination) {
    const employees = await getEmployeesLookupSvc();
    res.json({
      success: true,
      message: "OK",
      data: employees
    });
    return;
  }

  const { page, limit, skip } = getPagination({ page: filters.page, limit: filters.limit });
  const { items, total } = await getEmployeesLookupPagedSvc(filters, { skip, limit });

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

