/**
 * Small deterministic hashing helpers (no crypto dependency so they run in
 * the worker, in tests and in Node scripts alike).
 */

/** FNV-1a 32-bit hash rendered as 8 hex chars. */
export function fnv1a(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** 64-bit-ish hash: two FNV passes with different seeds, 16 hex chars. */
export function stableHash(input: string): string {
  return fnv1a(input) + fnv1a(`${input.length}:${input}`);
}

/** JSON.stringify with sorted object keys so equal values hash equally. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(",")}}`;
}
