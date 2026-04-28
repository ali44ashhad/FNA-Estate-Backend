import type { Request, Response } from "express";
import { createEmployeeSchema, filterEmployeesSchema } from "./employee.dto";
import * as EmployeeService from "./employee.service";
import { getPagination } from "../../shared/utils/pagination";

export const createEmployee = async (req: Request, res: Response) => {
  const input = createEmployeeSchema.parse(req.body);
  const employee = await EmployeeService.createEmployee(input);

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
    const employees = await EmployeeService.getEmployees();
    res.json({
      success: true,
      message: "OK",
      data: employees
    });
    return;
  }

  const { page, limit, skip } = getPagination({ page: filters.page, limit: filters.limit });
  const { items, total } = await EmployeeService.getEmployeesPaged(filters, { skip, limit });

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

