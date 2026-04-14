import type { Types } from "mongoose";
import { Employee, type IEmployee } from "./employee.model";

export type CreateEmployeeData = {
  name: string;
  email: string;
  password: string;
  role: IEmployee["role"];
  cityId: Types.ObjectId;
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

export async function findEmployeeById(id: string) {
  return Employee.findById(id);
}

