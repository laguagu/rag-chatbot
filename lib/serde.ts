// Helpers to make DB rows JSON-serializable (BigInt, Date)

export function toJSONCompatible<T>(value: T): any {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((v) => toJSONCompatible(v));
  if (typeof value === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      out[k] = toJSONCompatible(v);
    }
    return out;
  }
  return value;
}

export function toJSONList<T>(rows: T[]): any[] {
  return rows.map((r) => toJSONCompatible(r));
}
