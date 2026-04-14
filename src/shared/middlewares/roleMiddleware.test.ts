import { describe, expect, it, vi } from "vitest";

import { roleMiddleware } from "./roleMiddleware";

describe("roleMiddleware", () => {
  it("throws 401 when req.user.role missing", () => {
    const mw = roleMiddleware("user");

    expect(() =>
      mw({} as any, {} as any, (() => void 0) as any)
    ).toThrowError(/Unauthorized/);
  });

  it("throws 403 when role not allowed", () => {
    const mw = roleMiddleware("user");

    expect(() =>
      mw({ user: { role: "admin" } } as any, {} as any, (() => void 0) as any)
    ).toThrowError(/Forbidden/);
  });

  it("calls next when role allowed", () => {
    const mw = roleMiddleware("user");
    const next = vi.fn();

    mw({ user: { role: "user" } } as any, {} as any, next);

    expect(next).toHaveBeenCalled();
  });
});

