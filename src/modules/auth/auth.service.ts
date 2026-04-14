import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/AppError";
import {
  generateAccessToken,
  generateRefreshToken
} from "../../shared/utils/jwt";
import { Employee } from "../employee/employee.model";
import { User } from "../user/user.model";
import type { LoginInput, RegisterUserInput } from "./auth.dto";

function sanitizeUser(user: { _id: unknown; name: string; email: string }) {
  return { id: String(user._id), name: user.name, email: user.email };
}

export async function registerUser(data: RegisterUserInput) {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError("User already exists", 400);

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: hashedPassword
  });

  return sanitizeUser(user);
}

export async function loginUser(data: LoginInput) {
  const user = await User.findOne({ email: data.email });
  if (!user) throw new AppError("User not found", 404);

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const payload = { id: String(user._id), role: "user" };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    user: sanitizeUser(user)
  };
}

export async function loginEmployee(data: LoginInput) {
  const employee = await Employee.findOne({ email: data.email });
  if (!employee) throw new AppError("Employee not found", 404);

  const isMatch = await bcrypt.compare(data.password, employee.password);
  if (!isMatch) throw new AppError("Invalid credentials", 401);

  const payload = { id: String(employee._id), role: employee.role };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
    employee: {
      id: String(employee._id),
      name: employee.name,
      email: employee.email,
      role: employee.role
    }
  };
}

