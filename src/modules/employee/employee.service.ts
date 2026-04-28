import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import type { CreateEmployeeInput, FilterEmployeesInput } from "./employee.dto";
import * as repo from "./employee.repository";
import { assertCityExists } from "../city/city.service";

const BCRYPT_SALT_ROUNDS = 10;

type PublicEmployee = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "operations" | "sales";
  cityId?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function sanitizeEmployee(employee: {
  _id: unknown;
  name: string;
  email: string;
  role: "admin" | "operations" | "sales";
  cityId?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicEmployee {
  return {
    id: String(employee._id),
    name: employee.name,
    email: employee.email,
    role: employee.role,
    cityId: employee.cityId ? String(employee.cityId) : undefined,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt
  };
}

export async function createEmployee(input: CreateEmployeeInput) {
  const existing = await repo.findEmployeeByEmail(input.email);
  if (existing) throw new AppError("Employee already exists", 400);

  if (input.role !== "admin") {
    await assertCityExists(input.cityId);
  } else if (typeof input.cityId === "string") {
    await assertCityExists(input.cityId);
  }

  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  const created = await repo.createEmployee({
    name: input.name,
    email: input.email,
    password: hashedPassword,
    role: input.role,
    ...(typeof input.cityId === "string" ? { cityId: new mongoose.Types.ObjectId(input.cityId) } : {})
  });

  return sanitizeEmployee(created);
}

export async function getEmployees() {
  const employees = await repo.getAllEmployees();
  return employees.map((e) =>
    sanitizeEmployee({
      _id: e._id,
      name: e.name,
      email: e.email,
      role: e.role,
      cityId: e.cityId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    })
  );
}

export async function getEmployeesPaged(
  filters: FilterEmployeesInput,
  pagination: { skip: number; limit: number }
) {
  const repoFilters: repo.EmployeeFilters = {};

  if (typeof filters.role === "string") {
    repoFilters.role = filters.role as any;
  }

  if (typeof filters.q === "string") {
    repoFilters.q = filters.q.trim();
  }

  const [employees, total] = await Promise.all([
    repo.findEmployees(repoFilters, pagination),
    repo.countEmployees(repoFilters)
  ]);

  const items = employees.map((e) =>
    sanitizeEmployee({
      _id: e._id,
      name: e.name,
      email: e.email,
      role: e.role,
      cityId: e.cityId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt
    })
  );

  return { items, total };
}

