import type { UpdateQuery } from "mongoose";
import { User, type IUser } from "./user.model";

export async function findUserById(id: string) {
  return User.findOne({ _id: id, isDeleted: false });
}

export async function updateUserById(id: string, data: UpdateQuery<IUser>) {
  return User.findOneAndUpdate({ _id: id, isDeleted: false }, { $set: data }, { new: true });
}

