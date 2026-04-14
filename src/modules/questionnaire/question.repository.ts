import type { Types } from "mongoose";
import { Option } from "./option.model";
import { Question } from "./question.model";

export type CreateQuestionData = {
  questionText: string;
  type: string;
  isActive: boolean;
};

export type CreateOptionData = {
  questionId: Types.ObjectId;
  value: string;
};

export async function createQuestion(data: CreateQuestionData) {
  return Question.create(data);
}

export async function insertOptions(options: CreateOptionData[]) {
  return Option.insertMany(options);
}

export async function findQuestions() {
  return Question.find({ isDeleted: false, isActive: true }).sort({ createdAt: 1 });
}

export async function findQuestionById(id: Types.ObjectId) {
  return Question.findOne({ _id: id, isDeleted: false });
}

export async function findOptionsByQuestionIds(questionIds: Types.ObjectId[]) {
  return Option.find({ questionId: { $in: questionIds }, isDeleted: false }).sort({
    createdAt: 1
  });
}

export async function findOptionsByIds(optionIds: Types.ObjectId[]) {
  return Option.find({ _id: { $in: optionIds }, isDeleted: false });
}

