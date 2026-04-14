import { describe, expect, it, vi } from "vitest";

import * as QuestionService from "./question.service";
import * as repo from "./question.repository";

vi.mock("./question.repository", async () => {
  const actual = await vi.importActual<typeof import("./question.repository")>(
    "./question.repository"
  );

  return {
    ...actual,
    createQuestion: vi.fn(),
    insertOptions: vi.fn(),
    findQuestions: vi.fn(),
    findOptionsByQuestionIds: vi.fn()
  };
});

describe("question.service", () => {
  it("createQuestion creates a question and options", async () => {
    vi.mocked(repo.createQuestion).mockResolvedValue({
      _id: "q1",
      questionText: "Q?",
      type: "single",
      isActive: true,
      createdAt: new Date("2020-01-01"),
      updatedAt: new Date("2020-01-01")
    } as any);

    vi.mocked(repo.insertOptions).mockResolvedValue([
      {
        _id: "o1",
        questionId: "q1",
        value: "A",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01")
      },
      {
        _id: "o2",
        questionId: "q1",
        value: "B",
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01")
      }
    ] as any);

    const result = await QuestionService.createQuestion({
      questionText: "  Q? ",
      type: " single ",
      options: [" A ", "B"]
    });

    expect(repo.createQuestion).toHaveBeenCalledWith({
      questionText: "Q?",
      type: "single",
      isActive: true
    });
    expect(repo.insertOptions).toHaveBeenCalled();
    expect(result).toEqual({
      id: "q1",
      questionText: "Q?",
      type: "single",
      isActive: true,
      createdAt: new Date("2020-01-01"),
      updatedAt: new Date("2020-01-01"),
      options: [
        {
          id: "o1",
          questionId: "q1",
          value: "A",
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01")
        },
        {
          id: "o2",
          questionId: "q1",
          value: "B",
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01")
        }
      ]
    });
  });

  it("getQuestionsWithOptions returns questions with options embedded", async () => {
    vi.mocked(repo.findQuestions).mockResolvedValue([
      {
        _id: "q1",
        questionText: "Q1",
        type: "single",
        isActive: true,
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01")
      },
      {
        _id: "q2",
        questionText: "Q2",
        type: "single",
        isActive: true,
        createdAt: new Date("2020-01-02"),
        updatedAt: new Date("2020-01-02")
      }
    ] as any);

    vi.mocked(repo.findOptionsByQuestionIds).mockResolvedValue([
      { _id: "o1", questionId: "q1", value: "A" },
      { _id: "o2", questionId: "q1", value: "B" },
      { _id: "o3", questionId: "q2", value: "C" }
    ] as any);

    const result = await QuestionService.getQuestionsWithOptions();

    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe("q1");
    expect(result[0]?.options.map((o) => o.id)).toEqual(["o1", "o2"]);
    expect(result[1]?.id).toBe("q2");
    expect(result[1]?.options.map((o) => o.id)).toEqual(["o3"]);
  });
});

