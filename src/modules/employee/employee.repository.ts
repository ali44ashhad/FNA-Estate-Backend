import type { Types } from "mongoose";
import { Employee, type IEmployee } from "./employee.model";

export type CreateEmployeeData = {
  name: string;
  email: string;
  password: string;
  role: IEmployee["role"];
  cityId?: Types.ObjectId;
};

export type EmployeeFilters = {
  q?: string;
  role?: IEmployee["role"];
};

export type EmployeeFindOptions = {
  skip: number;
  limit: number;
};

export async function createEmployee(data: CreateEmployeeData) {
  return Employee.create(data);
}

export async function findEmployeeByEmail(email: string) {
  return Employee.findOne({ email, isDeleted: false });
}

export async function getAllEmployees() {
  return Employee.find({ isDeleted: false });
}

function buildFindQuery(filters: EmployeeFilters) {
  const query: Record<string, unknown> = { isDeleted: false };

  if (filters.role) query.role = filters.role;

  if (filters.q) {
    const escaped = filters.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(escaped, "i");
    query.$or = [{ name: re }, { email: re }, { role: re }];
  }

  return query;
}

export async function findEmployees(filters: EmployeeFilters, options: EmployeeFindOptions) {
  const query = buildFindQuery(filters);
  return Employee.find(query).sort({ createdAt: -1 }).skip(options.skip).limit(options.limit);
}

export async function countEmployees(filters: EmployeeFilters) {
  const query = buildFindQuery(filters);
  return Employee.countDocuments(query);
}

export async function findEmployeeById(id: string) {
  return Employee.findById(id);
}

