function first(val: unknown): unknown {
  return Array.isArray(val) ? val[0] : val;
}

function parsePositiveInt(val: unknown): number | null {
  const v = first(val);
  if (typeof v !== "string" && typeof v !== "number") return null;

  const n = typeof v === "number" ? v : Number.parseInt(v, 10);
  if (!Number.isFinite(n)) return null;
  if (n < 1) return null;
  return n;
}

export function getPagination(query: unknown) {
  const q = (typeof query === "object" && query !== null ? query : {}) as Record<string, unknown>;

  const page = parsePositiveInt(q.page) ?? 1;
  const limit = parsePositiveInt(q.limit) ?? 10;
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

