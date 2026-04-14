import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import type { CreateQuestionInput } from "./question.dto";
import * as repo from "./question.repository";

type PublicOption = {
  id: string;
  questionId: string;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type PublicQuestion = {
  id: string;
  questionText: string;
  type: string;
  isActive: boolean;
  options: PublicOption[];
  createdAt?: Date;
  updatedAt?: Date;
};

function sanitizeOption(option: {
  _id: unknown;
  questionId: unknown;
  value: string;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicOption {
  return {
    id: String(option._id),
    questionId: String(option.questionId),
    value: option.value,
    createdAt: option.createdAt,
    updatedAt: option.updatedAt
  };
}

function sanitizeQuestion(question: {
  _id: unknown;
  questionText: string;
  type: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}): Omit<PublicQuestion, "options"> {
  return {
    id: String(question._id),
    questionText: question.questionText,
    type: question.type,
    isActive: question.isActive,
    createdAt: question.createdAt,
    updatedAt: question.updatedAt
  };
}

export async function createQuestion(input: CreateQuestionInput) {
  const questionText = input.questionText.trim();
  const type = input.type.trim();

  const optionsNormalized = input.options.map((o) => o.trim()).filter((o) => o.length > 0);
  if (!optionsNormalized.length) {
    throw new AppError("At least one option is required", 400);
  }

  const createdQuestion = await repo.createQuestion({
    questionText,
    type,
    isActive: true
  });

  const questionId = createdQuestion._id as mongoose.Types.ObjectId;
  const optionDocs = await repo.insertOptions(
    optionsNormalized.map((value) => ({
      questionId,
      value
    }))
  );

  return {
    ...sanitizeQuestion({
      _id: createdQuestion._id,
      questionText: createdQuestion.questionText,
      type: createdQuestion.type,
      isActive: createdQuestion.isActive,
      createdAt: createdQuestion.createdAt,
      updatedAt: createdQuestion.updatedAt
    }),
    options: optionDocs.map((o) =>
      sanitizeOption({
        _id: o._id,
        questionId: o.questionId,
        value: o.value,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      })
    )
  } satisfies PublicQuestion;
}

export async function getQuestionsWithOptions() {
  const questions = await repo.findQuestions();
  if (!questions.length) return [] as PublicQuestion[];

  const questionIds = questions.map((q) => q._id as mongoose.Types.ObjectId);
  const options = await repo.findOptionsByQuestionIds(questionIds);

  const optionsByQuestionId = new Map<string, PublicOption[]>();
  for (const o of options) {
    const qid = String(o.questionId);
    const entry = optionsByQuestionId.get(qid) ?? [];
    entry.push(
      sanitizeOption({
        _id: o._id,
        questionId: o.questionId,
        value: o.value,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt
      })
    );
    optionsByQuestionId.set(qid, entry);
  }

  return questions.map((q) => {
    const base = sanitizeQuestion({
      _id: q._id,
      questionText: q.questionText,
      type: q.type,
      isActive: q.isActive,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt
    });

    return {
      ...base,
      options: optionsByQuestionId.get(String(q._id)) ?? []
    };
  });
}

