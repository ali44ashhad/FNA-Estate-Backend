import mongoose from "mongoose";
import { AppError } from "../../shared/errors/AppError";
import * as questionRepo from "./question.repository";
import * as repo from "./response.repository";

type SubmitRow = { questionId: string; optionId: string };

function assertValidObjectId(id: string, message: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(message, 400);
  }
}

export async function submitResponses(userId: string, rows: SubmitRow[]) {
  if (!userId) throw new AppError("Unauthorized", 401);
  assertValidObjectId(userId, "Invalid user id");

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new AppError("At least one response is required", 400);
  }

  const parsedRows = rows.map((r) => ({
    questionId: (() => {
      const raw = (r as { questionId?: unknown }).questionId;
      if (Array.isArray(raw)) return String(raw[0]);
      return String(r.questionId);
    })(),
    optionId: (() => {
      const raw = (r as { optionId?: unknown }).optionId;
      if (Array.isArray(raw)) return String(raw[0]);
      return String(r.optionId);
    })()
  }));

  for (const r of parsedRows) {
    assertValidObjectId(r.questionId, "Invalid questionId");
    assertValidObjectId(r.optionId, "Invalid optionId");
  }

  const questionIds = [...new Set(parsedRows.map((r) => r.questionId))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );
  const optionIds = [...new Set(parsedRows.map((r) => r.optionId))].map(
    (id) => new mongoose.Types.ObjectId(id)
  );

  const [questions, options] = await Promise.all([
    Promise.all(questionIds.map((id) => questionRepo.findQuestionById(id))),
    questionRepo.findOptionsByIds(optionIds)
  ]);

  const existingQuestions = new Map<string, { _id: unknown }>();
  for (const q of questions) {
    if (q?._id) existingQuestions.set(String(q._id), { _id: q._id });
  }

  if (existingQuestions.size !== questionIds.length) {
    throw new AppError("Invalid questionId", 400);
  }

  const optionById = new Map<string, { _id: unknown; questionId: unknown }>();
  for (const o of options) {
    optionById.set(String(o._id), { _id: o._id, questionId: o.questionId });
  }

  if (optionById.size !== optionIds.length) {
    throw new AppError("Invalid optionId", 400);
  }

  for (const r of parsedRows) {
    const option = optionById.get(r.optionId);
    if (!option) throw new AppError("Invalid optionId", 400);

    if (String(option.questionId) !== r.questionId) {
      throw new AppError("Option does not belong to question", 400);
    }
  }

  const payload: repo.CreateUserResponseData[] = parsedRows.map((r) => ({
    userId: new mongoose.Types.ObjectId(userId),
    questionId: new mongoose.Types.ObjectId(r.questionId),
    optionId: new mongoose.Types.ObjectId(r.optionId)
  }));

  return repo.insertResponses(payload);
}

