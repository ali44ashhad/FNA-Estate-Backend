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
        phone: "9876543210",
        interest: { category: "residential", subType: "villa" }
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createLead rejects missing project", async () => {
    vi.mocked(Project.findOne).mockResolvedValue(null as any);

    await expect(
      LeadService.createLead("507f191e810c19729de860ea", {
        projectId: "507f191e810c19729de860eb",
        phone: "9876543210",
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
        phone: "9876543210",
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

    const result = await LeadService.getLeads(
      {
        page: 2,
        limit: 10,
        sortBy: "createdAt",
        sortOrder: "desc"
      } as any,
      { id: "507f191e810c19729de860ea", role: "admin" }
    );

    expect(repo.findLeadsPaged).toHaveBeenCalled();
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.items[0]?.id).toBe("l1");
  });

  it("updateLead throws 404 when missing", async () => {
    vi.mocked(repo.updateLeadById).mockResolvedValue(null as any);

    await expect(
      LeadService.updateLead("507f191e810c19729de860ea", { status: "visited" } as any, {
        id: "507f191e810c19729de860ea",
        role: "admin"
      })
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("getLeads for sales forces assignedSalesId filter", async () => {
    vi.mocked(repo.findLeadsPaged).mockResolvedValue({ items: [], total: 0 } as any);

    const salesId = "507f191e810c19729de860ea";
    await LeadService.getLeads(
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
        assignedSalesId: "507f191e810c19729de860eb"
      } as any,
      { id: salesId, role: "sales" }
    );

    expect(repo.findLeadsPaged).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({
          assignedSalesId: expect.any(Object)
        })
      })
    );
    const lastCall = vi.mocked(repo.findLeadsPaged).mock.calls.at(-1)?.[0];
    expect(String((lastCall?.filters as { assignedSalesId?: { toString: () => string } }).assignedSalesId)).toBe(
      salesId
    );
  });
});

