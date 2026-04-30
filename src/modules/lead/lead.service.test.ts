import { describe, expect, it, vi } from "vitest";

import * as LeadService from "./lead.service";
import * as repo from "./lead.repository";
import { Project } from "../project/project.model";
import * as CounterRepo from "../counter/counter.repository";

vi.mock("./lead.repository", async () => {
  const actual = await vi.importActual<typeof import("./lead.repository")>("./lead.repository");

  return {
    ...actual,
    createLead: vi.fn(),
    findLeads: vi.fn(),
    findLeadsPaged: vi.fn(),
    findLeadById: vi.fn(),
    updateLeadById: vi.fn()
  };
});

vi.mock("../project/project.model", async () => {
  const actual = await vi.importActual<typeof import("../project/project.model")>(
    "../project/project.model"
  );

  return {
    ...actual,
    Project: {
      findOne: vi.fn()
    }
  };
});

vi.mock("../counter/counter.repository", async () => {
  const actual = await vi.importActual<typeof import("../counter/counter.repository")>("../counter/counter.repository");
  return { ...actual, nextCounterSeq: vi.fn() };
});

describe("lead.service", () => {
  it("createLead rejects invalid project id", async () => {
    await expect(
      LeadService.createLead("507f191e810c19729de860ea", {
        projectId: "bad",
        interest: { category: "residential", subType: "villa" }
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createLead rejects missing project", async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null as any);

    await expect(
      LeadService.createLead("507f191e810c19729de860ea", {
        projectId: "507f191e810c19729de860eb",
        interest: { category: "residential", subType: "villa" }
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createLead rejects duplicates", async () => {
    vi.mocked(Project.findOne).mockResolvedValue({ _id: "p1" } as any);
    vi.mocked(repo.findLeads).mockResolvedValue([
      { _id: "l1", interest: { inventoryKey: "residential/villa", unitTypeKey: "" } }
    ] as any);
    vi.mocked(CounterRepo.nextCounterSeq).mockResolvedValue(1 as any);

    await expect(
      LeadService.createLead("507f191e810c19729de860ea", {
        projectId: "507f191e810c19729de860eb",
        interest: { category: "residential", subType: "villa" }
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("getLeads returns paged result and passes expected repo args", async () => {
    vi.mocked(repo.findLeadsPaged).mockResolvedValue({
      items: [
        {
          _id: "l1",
          userId: "u1",
          projectId: "p1",
          status: "new",
          createdAt: new Date("2020-01-01"),
          updatedAt: new Date("2020-01-01")
        }
      ],
      total: 1
    } as any);

    const result = await LeadService.getLeads({
      page: 2,
      limit: 10,
      sortBy: "createdAt",
      sortOrder: "desc"
    } as any);

    expect(repo.findLeadsPaged).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.items[0]?.id).toBe("l1");
  });

  it("updateLead throws 404 when missing", async () => {
    vi.mocked(repo.updateLeadById).mockResolvedValue(null as any);

    await expect(
      LeadService.updateLead("507f191e810c19729de860ea", { status: "visited" } as any)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

