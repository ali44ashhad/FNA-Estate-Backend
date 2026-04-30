import { describe, expect, it, vi } from "vitest";

import * as ProjectService from "./project.service";
import * as ProjectRepo from "./project.repository";
import * as QuestionRepo from "../questionnaire/question.repository";
import * as CityService from "../city/city.service";

vi.mock("./project.repository", async () => {
  const actual = await vi.importActual<typeof import("./project.repository")>("./project.repository");

  return {
    ...actual,
    findProjects: vi.fn(),
    findProjectRawById: vi.fn(),
    updateProjectById: vi.fn(),
    softDeleteProjectById: vi.fn()
  };
});

vi.mock("../questionnaire/question.repository", async () => {
  const actual = await vi.importActual<typeof import("../questionnaire/question.repository")>(
    "../questionnaire/question.repository"
  );

  return {
    ...actual,
    findQuestionById: vi.fn(),
    findOptionsByIds: vi.fn()
  };
});

vi.mock("../city/city.service", async () => {
  const actual = await vi.importActual<typeof import("../city/city.service")>("../city/city.service");

  return {
    ...actual,
    assertCityExists: vi.fn()
  };
});

describe("project.service recommendProjects", () => {
  it("throws 400 when questionId does not exist", async () => {
    vi.mocked(QuestionRepo.findQuestionById).mockResolvedValue(null as any);
    vi.mocked(QuestionRepo.findOptionsByIds).mockResolvedValue([
      { _id: "507f191e810c19729de860ea", questionId: "507f191e810c19729de860eb", value: "villa" }
    ] as any);

    await expect(
      ProjectService.recommendProjects({
        responses: [
          {
            questionId: "507f191e810c19729de860eb",
            optionId: "507f191e810c19729de860ea"
          }
        ]
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when optionId does not exist", async () => {
    vi.mocked(QuestionRepo.findQuestionById).mockResolvedValue({
      _id: "507f191e810c19729de860eb",
      type: "propertyType"
    } as any);
    vi.mocked(QuestionRepo.findOptionsByIds).mockResolvedValue([] as any);

    await expect(
      ProjectService.recommendProjects({
        responses: [
          {
            questionId: "507f191e810c19729de860eb",
            optionId: "507f191e810c19729de860ea"
          }
        ]
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("throws 400 when option does not belong to question", async () => {
    vi.mocked(QuestionRepo.findQuestionById).mockResolvedValue({
      _id: "507f191e810c19729de860eb",
      type: "propertyType"
    } as any);
    vi.mocked(QuestionRepo.findOptionsByIds).mockResolvedValue([
      {
        _id: "507f191e810c19729de860ea",
        questionId: "507f191e810c19729de860ec",
        value: "villa"
      }
    ] as any);

    await expect(
      ProjectService.recommendProjects({
        responses: [
          {
            questionId: "507f191e810c19729de860eb",
            optionId: "507f191e810c19729de860ea"
          }
        ]
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("derives cityId filter from cityId-type question and sanitizes output", async () => {
    const cityId = "507f191e810c19729de860ff";

    vi.mocked(QuestionRepo.findQuestionById).mockResolvedValue({
      _id: "507f191e810c19729de860eb",
      type: "cityId"
    } as any);
    vi.mocked(QuestionRepo.findOptionsByIds).mockResolvedValue([
      {
        _id: "507f191e810c19729de860ea",
        questionId: "507f191e810c19729de860eb",
        value: cityId
      }
    ] as any);

    vi.mocked(ProjectRepo.findProjects).mockResolvedValue([
      {
        _id: "p1",
        name: "Proj",
        propertyType: "villa",
        status: "active",
        pricingType: "direct",
        price: { min: 10, max: 20 },
        images: [],
        cityId: { _id: cityId, name: "City", state: "ST" },
        createdAt: new Date("2020-01-01"),
        updatedAt: new Date("2020-01-01")
      }
    ] as any);

    const result = await ProjectService.recommendProjects({
      responses: [
        {
          questionId: "507f191e810c19729de860eb",
          optionId: "507f191e810c19729de860ea"
        }
      ]
    });

    expect(ProjectRepo.findProjects).toHaveBeenCalled();
    expect(result[0]?.id).toBe("p1");
    expect(result[0]?.city?.id).toBe(cityId);
    expect((result[0] as any)?.pricingType).toBeUndefined();
    expect(result[0]?.inventory?.[0]?.category).toBe("residential");
    expect(result[0]?.inventory?.[0]?.subType).toBe("villa");
  });

  it("derives propertyType filter from propertyType-type question", async () => {
    vi.mocked(QuestionRepo.findQuestionById).mockResolvedValue({
      _id: "507f191e810c19729de860eb",
      type: "propertyType"
    } as any);
    vi.mocked(QuestionRepo.findOptionsByIds).mockResolvedValue([
      {
        _id: "507f191e810c19729de860ea",
        questionId: "507f191e810c19729de860eb",
        value: "apartment"
      }
    ] as any);

    vi.mocked(ProjectRepo.findProjects).mockResolvedValue([] as any);

    await ProjectService.recommendProjects({
      responses: [
        {
          questionId: "507f191e810c19729de860eb",
          optionId: "507f191e810c19729de860ea"
        }
      ]
    });

    const calls = vi.mocked(ProjectRepo.findProjects).mock.calls;
    const passed = calls.some(
      (args) => (args[0] as any)?.category === "residential" && (args[0] as any)?.subType === "apartment"
    );
    expect(passed).toBe(true);
  });
});

describe("project.service createProject", () => {
  it("derives categories from inventory", async () => {
    vi.mocked(CityService.assertCityExists).mockResolvedValue(undefined as any);
    const spy = vi.spyOn(ProjectRepo, "createProject").mockResolvedValue({ _id: "p1" } as any);
    vi.spyOn(ProjectRepo, "findProjectById").mockResolvedValue({
      _id: "p1",
      name: "Proj",
      projectCode: "PRJ-001",
      status: "active",
      categories: ["commercial", "residential"],
      inventory: [],
      images: [],
      cityId: null
    } as any);

    await ProjectService.createProject({
      name: "Proj",
      cityId: "507f191e810c19729de860ff",
      projectCode: "PRJ-001",
      status: "active",
      inventory: [
        { category: "commercial", subType: "office", pricingType: "direct", price: { min: 10, max: 20 } },
        { category: "residential", subType: "villa", pricingType: "direct", price: { min: 30, max: 40 } }
      ],
      images: []
    } as any);

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ categories: expect.arrayContaining(["commercial", "residential"]) }));
  });
});

describe("project.service getProjects price filter passthrough", () => {
  it("passes minPrice/maxPrice into repository filters", async () => {
    vi.mocked(ProjectRepo.findProjects).mockResolvedValue([] as any);
    vi.spyOn(ProjectRepo, "countProjects").mockResolvedValue(0 as any);

    await ProjectService.getProjects(
      {
        minPrice: 100,
        maxPrice: 200
      } as any,
      { skip: 0, limit: 10 }
    );

    expect(ProjectRepo.findProjects).toHaveBeenCalledWith(
      expect.objectContaining({ minPrice: 100, maxPrice: 200 }),
      expect.anything()
    );
  });
});

describe("project.service updateProject/deleteProject", () => {
  const projectId = "507f191e810c19729de860ff";
  const projectDocId = { toString: () => projectId };

  const baseCurrent = {
    _id: projectDocId,
    name: "Proj",
    cityId: projectDocId,
    status: "active",
    projectCode: "PRJ-001",
    categories: ["residential"],
    inventory: [{ category: "residential", subType: "villa", pricingType: "direct", price: { min: 10, max: 20 } }],
    images: []
  };

  it("validates city when cityId changes", async () => {
    vi.mocked(ProjectRepo.findProjectRawById).mockResolvedValue(baseCurrent as any);
    vi.mocked(CityService.assertCityExists).mockResolvedValue(undefined as any);
    vi.mocked(ProjectRepo.updateProjectById).mockResolvedValue({
      _id: projectDocId,
      name: "Proj",
      cityId: { _id: projectDocId, name: "City", state: "ST" },
      projectCode: "PRJ-001",
      status: "active",
      categories: ["residential"],
      inventory: [{ category: "residential", subType: "villa", pricingType: "direct", price: { min: 10, max: 20 } }],
      images: []
    } as any);

    await ProjectService.updateProject(projectId, {
      cityId: "507f191e810c19729de860aa"
    } as any);

    expect(CityService.assertCityExists).toHaveBeenCalled();
    expect(ProjectRepo.updateProjectById).toHaveBeenCalled();
  });

  it("throws 404 when deleting missing project", async () => {
    vi.mocked(ProjectRepo.softDeleteProjectById).mockResolvedValue(null as any);

    await expect(ProjectService.deleteProject(projectId)).rejects.toMatchObject({ statusCode: 404 });
  });
});

