import type { Types } from "mongoose";
import { UserResponse } from "./userResponse.model";

export type CreateUserResponseData = {
  userId: Types.ObjectId;
  questionId: Types.ObjectId;
  optionId: Types.ObjectId;
};

export async function insertResponses(data: CreateUserResponseData[]) {
  return UserResponse.insertMany(data);
}

