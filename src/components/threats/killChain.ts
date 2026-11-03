/**
 * Kill-chain view of one threat: its attack vectors ordered by severity, each paired with the
 * mapped controls whose text best matches the vector, split by lifecycle phase.
 *
 * The data has no vector → control mapping, so the pairing is a transparent keyword heuristic:
 * shared word stems between the vector (name + example) and the control (name, description,
 * tags), weighted by the control name. Only controls already mapped to the threat are
 * considered, so a pairing can never invent a mapping; the UI labels it as a heuristic.
 */
import type { Mitigation, Threat } from "@/components/components/securityData";

export type VectorSeverity = "high" | "medium" | "low";

export interface KillChainVector {
  vector: string;
  example?: string;
  severity: VectorSeverity;
  /** Matched controls, best first (at most `limit`). */
  controls: Mitigation[];
}

const STOP = new Set(
  "a an and are as at be by for from in into is it its of on or that the their this to via with without agent agents ai system systems use using used through across based malicious attack attacks attacker attackers can".split(
    " ",
  ),
);

/** Lower-case word stems (naive suffix stripping; enough for "poisoning" ≈ "poisoned"). */
export function stems(text: string): Set<string> {
  const out = new Set<string>();
  for (const raw of text.toLowerCase().split(/[^a-z0-9]+/)) {
    if (raw.length < 3 || STOP.has(raw)) continue;
    out.add(raw.replace(/(ations?|ing|ed|es|s|ion|ment)$/, "").slice(0, 7));
  }
  return out;
}

function score(vector: Set<string>, m: Mitigation): number {
  const name = stems(m.name);
  const body = stems(`${m.description} ${(m.tags ?? []).join(" ")}`);
  let s = 0;
  for (const w of vector) {
    if (name.has(w)) s += 3;
    else if (body.has(w)) s += 1;
  }
  return s;
}

const SEVERITY_RANK: Record<VectorSeverity, number> = { high: 0, medium: 1, low: 2 };

export function killChain(threat: Threat, controls: Mitigation[], limit = 2): KillChainVector[] {
  return (threat.attackVectors ?? [])
    .map((v, i) => {
      const words = stems(`${v.vector} ${v.example ?? ""}`);
      const controlsRanked = controls
        .map((m) => ({ m, s: score(words, m) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map((x) => x.m);
      return {
        i,
        vector: v.vector,
        example: v.example,
        severity: (v.severity ?? "medium") as VectorSeverity,
        controls: controlsRanked,
      };
    })
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || a.i - b.i)
    .map(({ i: _i, ...rest }) => rest);
}
