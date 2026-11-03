import { describe, expect, it } from "vitest";
import {
  CROSSWALK,
  CROSSWALK_GROUPS,
  FRAMEWORK_PAIR_COUNTS,
} from "@/components/taxonomy/overview/crosswalkGraph";

describe("crosswalk graph", () => {
  it("only links known nodes, with positive integer values", () => {
    const ids = new Set(CROSSWALK.nodes.map((n) => n.id));
    for (const l of CROSSWALK.links) {
      expect(ids.has(l.source)).toBe(true);
      expect(ids.has(l.target)).toBe(true);
      expect(Number.isInteger(l.value) && l.value > 0).toBe(true);
    }
  });
  it("has symmetric pair counts and links every framework", () => {
    for (const a of CROSSWALK_GROUPS)
      for (const b of CROSSWALK_GROUPS)
        expect(FRAMEWORK_PAIR_COUNTS[`${a.id}|${b.id}`]).toBe(
          FRAMEWORK_PAIR_COUNTS[`${b.id}|${a.id}`],
        );
    for (const g of CROSSWALK_GROUPS) {
      const total = CROSSWALK_GROUPS.reduce(
        (n, o) => n + FRAMEWORK_PAIR_COUNTS[`${g.id}|${o.id}`],
        0,
      );
      expect(total).toBeGreaterThan(0);
    }
  });
});
