import { describe, expect, it, vi } from "vitest";

import * as PurchaseService from "./purchase.service";
import * as PurchaseRepo from "./purchase.repository";
import * as LeadRepo from "../lead/lead.repository";
import { Lead } from "../lead/lead.model";

vi.mock("./purchase.repository", async () => {
  const actual = await vi.importActual<typeof import("./purchase.repository")>("./purchase.repository");

  return {
    ...actual,
    createPurchase: vi.fn(),
    findPurchasesByUser: vi.fn()
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

describe("purchase.service", () => {
  it("createPurchase rejects invalid lead id", async () => {
    await expect(
      PurchaseService.createPurchase({
        leadId: "bad",
        amount: 123
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createPurchase rejects missing lead", async () => {
    vi.mocked(Lead.findOne).mockResolvedValue(null as any);

    await expect(
      PurchaseService.createPurchase({
        leadId: "507f191e810c19729de860eb",
        amount: 123
      } as any)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("createPurchase creates purchase and closes lead", async () => {
    const now = new Date("2020-01-01");

    vi.mocked(Lead.findOne).mockResolvedValue({
      _id: "507f191e810c19729de860eb",
      userId: "507f191e810c19729de860ea",
      projectId: "507f191e810c19729de860ec",
      interest: {
        category: "residential",
        subType: "villa",
        inventoryKey: "residential/villa"
      }
    } as any);

    vi.mocked(PurchaseRepo.createPurchase).mockResolvedValue({
      _id: "p1",
      userId: "507f191e810c19729de860ea",
      projectId: "507f191e810c19729de860ec",
      leadId: "507f191e810c19729de860eb",
      category: "residential",
      subType: "villa",
      inventoryKey: "residential/villa",
      agreedPrice: 123,
      status: "booked",
      createdAt: now,
      updatedAt: now
    } as any);

    vi.mocked(LeadRepo.updateLeadById).mockResolvedValue({ _id: "507f191e810c19729de860eb" } as any);

    const result = await PurchaseService.createPurchase({
      leadId: "507f191e810c19729de860eb",
      amount: 123
    } as any);

    expect(result.id).toBe("p1");
    expect(result.status).toBe("booked");
    expect(result.inventoryKey).toBe("residential/villa");
    expect(LeadRepo.updateLeadById).toHaveBeenCalled();
  });
});

