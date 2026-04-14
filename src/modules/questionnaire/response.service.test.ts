import { describe, expect, it, vi } from "vitest";

import { AppError } from "../../shared/errors/AppError";
import * as questionRepo from "./question.repository";
import * as repo from "./response.repository";
import * as ResponseService from "./response.service";

vi.mock("./question.repository", async () => {
  const actual = await vi.importActual<typeof import("./question.repository")>(
    "./question.repository"
  );

  return {
    ...actual,
    findQuestionById: vi.fn(),
    findOptionsByIds: vi.fn()
  };
});

vi.mock("./response.repository", async () => {
  const actual = await vi.importActual<typeof import("./response.repository")>(
    "./response.repository"
  );

  return {
    ...actual,
    insertResponses: vi.fn()
  };
});

describe("response.service", () => {
  it("rejects invalid ids", async () => {
    await expect(
      ResponseService.submitResponses("not-an-id", [{ questionId: "q", optionId: "o" }])
    ).rejects.toBeInstanceOf(AppError);
  });

  it("rejects when option does not belong to question", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const questionId = "507f1f77bcf86cd799439012";
    const optionId = "507f1f77bcf86cd799439013";

    vi.mocked(questionRepo.findQuestionById).mockResolvedValue({ _id: questionId } as any);
    vi.mocked(questionRepo.findOptionsByIds).mockResolvedValue([
      { _id: optionId, questionId: "507f1f77bcf86cd799439099" }
    ] as any);

    await expect(
      ResponseService.submitResponses(userId, [{ questionId, optionId }])
    ).rejects.toMatchObject({ message: "Option does not belong to question" });
  });

  it("inserts append-only responses when valid", async () => {
    const userId = "507f1f77bcf86cd799439011";
    const questionId = "507f1f77bcf86cd799439012";
    const optionId = "507f1f77bcf86cd799439013";

    vi.mocked(questionRepo.findQuestionById).mockResolvedValue({ _id: questionId } as any);
    vi.mocked(questionRepo.findOptionsByIds).mockResolvedValue([
      { _id: optionId, questionId }
    ] as any);
    vi.mocked(repo.insertResponses).mockResolvedValue([{ _id: "r1" }] as any);

    const result = await ResponseService.submitResponses(userId, [{ questionId, optionId }]);

    expect(repo.insertResponses).toHaveBeenCalledTimes(1);
    expect(Array.isArray(result)).toBe(true);
  });
});

