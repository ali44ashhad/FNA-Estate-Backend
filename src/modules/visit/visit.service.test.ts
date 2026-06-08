import { describe, expect, it, vi } from "vitest";

import * as VisitService from "./visit.service";
import * as VisitRepo from "./visit.repository";
import * as LeadRepo from "../lead/lead.repository";
import { Lead } from "../lead/lead.model";
import { Employee } from "../employee/employee.model";

vi.mock("./visit.repository", async () => {
  const actual = await vi.importActual<typeof import("./visit.repository")>("./visit.repository");

  return {
    ...actual,
    createVisit: vi.fn(),
    findVisitByLeadId: vi.fn(),
    findVisitById: vi.fn(),
    updateVisitById: vi.fn()
  };
});

vi.mock("../lead/lead.repository", async () => {
  const actual = await vi.importActual<typeof import("../lead/lead.repository")>("../lead/lead.repository");

  return {
    ...actual,
    updateLeadById: vi.fn()
  };
});

vi.mock("../lead/lead.model", async () => {
  const actual = await vi.importActual<typeof import("../lead/lead.model")>("../lead/lead.model");

  return {
    ...actual,
    Lead: {
      findOne: vi.fn()
    }
  };
});

vi.mock("../employee/employee.model", async () => {
  const actual = await vi.importActual<typeof import("../employee/employee.model")>("../employee/employee.model");

  return {
    ...actual,
    Employee: {
      findOne: vi.fn()
    }
  };
});

describe("visit.service", () => {
  it("createVisit rejects invalid lead id", async () => {
    await expect(
      VisitService.createVisit({
        leadId: "bad",
        salesId: "507f191e810c19729de860ea",
        visitTime: new Date(),
        location: "Loc"
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createVisit rejects missing lead", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue(null as any);

    await expect(
      VisitService.createVisit({
        leadId: "507f191e810c19729de860eb",
        salesId: "507f191e810c19729de860ea",
        visitTime: new Date(),
        location: "Loc"
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createVisit rejects lead that is not contacted", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1", status: "new" } as any);

    await expect(
      VisitService.createVisit({
        leadId: "507f191e810c19729de860eb",
        salesId: "507f191e810c19729de860ea",
        visitTime: new Date(),
        location: "Loc"
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createVisit rejects duplicate visit for lead", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1", status: "contacted" } as any);
    vi.mocked(VisitRepo.findVisitByLeadId).mockResolvedValue({ _id: "v1" } as any);

    await expect(
      VisitService.createVisit({
        leadId: "507f191e810c19729de860eb",
        salesId: "507f191e810c19729de860ea",
        visitTime: new Date(),
        location: "Loc"
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createVisit rejects non-sales employee", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1", status: "contacted" } as any);
    vi.mocked(VisitRepo.findVisitByLeadId).mockResolvedValue(null as any);
    vi.mocked(Employee.findOne).mockResolvedValue({ _id: "e1", role: "operations" } as any);

    await expect(
      VisitService.createVisit({
        leadId: "507f191e810c19729de860eb",
        salesId: "507f191e810c19729de860ea",
        visitTime: new Date(),
        location: "Loc"
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createVisit schedules visit and updates lead", async () => {
    const now = new Date("2020-01-01");

    vi.mocked(Lead.findOne).mockResolvedValue({ _id: "l1", status: "contacted" } as any);
    vi.mocked(VisitRepo.findVisitByLeadId).mockResolvedValue(null as any);
    vi.mocked(Employee.findOne).mockResolvedValue({ _id: "e1", role: "sales" } as any);

    vi.mocked(VisitRepo.createVisit).mockResolvedValue({
      _id: "v1",
      leadId: "507f191e810c19729de860eb",
      salesId: "507f191e810c19729de860ea",
      visitTime: now,
      status: "scheduled",
      location: "Loc",
      createdAt: now,
      updatedAt: now
    } as any);

    vi.mocked(LeadRepo.updateLeadById).mockResolvedValue({ _id: "l1" } as any);

    const result = await VisitService.createVisit({
      leadId: "507f191e810c19729de860eb",
      salesId: "507f191e810c19729de860ea",
      visitTime: now,
      location: "Loc"
    } as any);

    expect(result.id).toBe("v1");
    expect(result.status).toBe("scheduled");
    expect(LeadRepo.updateLeadById).toHaveBeenCalled();
  });

  it("updateVisitAsAdminOps throws 404 when missing", async () => {
    vi.mocked(VisitRepo.updateVisitById).mockResolvedValue(null as any);

    await expect(
      VisitService.updateVisitAsAdminOps("507f191e810c19729de860ea", { status: "completed" } as any)
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("updateVisitStatusAsSales throws 404 when missing", async () => {
    vi.mocked(VisitRepo.updateVisitById).mockResolvedValue(null as any);

    await expect(
      VisitService.updateVisitStatusAsSales("507f191e810c19729de860ea", { status: "completed" } as any)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

