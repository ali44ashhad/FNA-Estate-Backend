import type { Types, UpdateQuery } from "mongoose";
import { User, type IUser } from "./user.model";

const USER_SEARCH_MAX = 200;

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findUserById(id: string) {
  return User.findOne({ _id: id, isDeleted: false });
}

export async function findUsers(where: Record<string, unknown> = {}) {
  return User.find({ isDeleted: false, ...(where as any) }).sort({ createdAt: -1 });
}

/** Users whose name or email contains `q` (case-insensitive). Capped for safe `$in` queries on leads. */
export async function findUserIdsMatchingNameOrEmail(q: string): Promise<Types.ObjectId[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const re = new RegExp(escapeRegex(trimmed), "i");
  const rows = await User.find({ isDeleted: false, $or: [{ name: re }, { email: re }] })
    .select("_id")
    .limit(USER_SEARCH_MAX)
    .lean();

  return rows.map((r) => r._id as Types.ObjectId);
}

export async function updateUserById(id: string, data: UpdateQuery<IUser>) {
  return User.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true });
}

