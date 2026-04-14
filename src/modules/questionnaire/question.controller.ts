import type { Request, Response } from "express";
import { createQuestionSchema } from "./question.dto";
import * as QuestionService from "./question.service";

export const createQuestion = async (req: Request, res: Response) => {
  const input = createQuestionSchema.parse(req.body);
  const created = await QuestionService.createQuestion(input);

  res.json({
    success: true,
    message: "Question created",
    data: created
  });
};

export const getQuestions = async (req: Request, res: Response) => {
  void req;
  const questions = await QuestionService.getQuestionsWithOptions();

  res.json({
    success: true,
    message: "OK",
    data: questions
  });
};

