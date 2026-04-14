import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import type { UpdateUserInput } from "./user.dto";
import * as repo from "./user.repository";

type PublicUser = {
  id: string;
  name: string;
  email: string;
};

function sanitizeUser(user: { _id: unknown; name: string; email: string }): PublicUser {
  return { id: String(user._id), name: user.name, email: user.email };
}

function assertValidUserId(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid user id", 400);
  }
}

export async function getProfile(userId: string) {
  assertValidUserId(userId);

  const user = await repo.findUserById(userId);
  if (!user) throw new AppError("User not found", 404);

  return sanitizeUser(user);
}

export async function updateProfile(userId: string, input: UpdateUserInput) {
  assertValidUserId(userId);

  const update: Partial<Pick<UpdateUserInput, "name" | "email">> = {};
  if (typeof input.name === "string") update.name = input.name;
  if (typeof input.email === "string") update.email = input.email;

  const user = await repo.updateUserById(userId, update);
  if (!user) throw new AppError("User not found", 404);

  return sanitizeUser(user);
}

