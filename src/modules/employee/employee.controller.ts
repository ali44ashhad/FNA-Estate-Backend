import type { Request, Response } from "express";
import { createEmployeeSchema } from "./employee.dto";
import * as EmployeeService from "./employee.service";

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
  void req;
  const employees = await EmployeeService.getEmployees();

  res.json({
    success: true,
    message: "OK",
    data: employees
  });
};

