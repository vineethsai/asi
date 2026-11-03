import "@testing-library/jest-dom/vitest";

// Node >= 25 ships an experimental global `localStorage` that shadows jsdom's.
// Give tests a plain in-memory implementation so persistence code behaves.
class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  key(index: number) {
    return Array.from(this.map.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    this.map.set(key, String(value));
  }
}

const needsPolyfill =
  typeof globalThis.localStorage === "undefined" ||
  typeof globalThis.localStorage.getItem !== "function";
if (needsPolyfill) {
  Object.defineProperty(globalThis, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}
