import { describe, expect, it } from "vitest";

import { createLeadSchema } from "./lead.dto";

describe("lead.dto", () => {
  it("createLeadSchema rejects invalid phone", () => {
    expect(() =>
      createLeadSchema.parse({
        projectId: "507f191e810c19729de860eb",
        phone: "12345",
        interest: { category: "residential", subType: "villa" }
      })
    ).toThrow();
  });

  it("createLeadSchema accepts 10-digit phone", () => {
    const parsed = createLeadSchema.parse({
      projectId: "507f191e810c19729de860eb",
      phone: "9876543210",
      interest: { category: "residential", subType: "villa" }
    });

    expect(parsed.phone).toBe("9876543210");
  });
});

