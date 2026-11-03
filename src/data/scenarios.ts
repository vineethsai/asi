/**
 * Scenario walkthroughs (IMPROVEMENT_PLAN P4-03). Built at module load from two data sources —
 * nothing here is hand-written:
 *
 *   1. every `attackScenarios[]` entry of the OWASP Top 10 for Agentic Applications
 *      (owaspAgenticTop10Data.ts), walked through the reference architecture whose `threatIds`
 *      overlap the entry's `relatedThreats` the most (ties rotate by scenario index);
 *   2. every `relevantThreats[]` entry of the five reference architectures (architecturesData.ts).
 *
 * Each scenario has 4–6 steps (setup → attack → technique → threat → …), each pointing at the key
 * component it lands on (`kc`) so a diagram can highlight it. `controlsThatStop` are the controls
 * mapped to the scenario's threats (both sides of the mapping): the architecture's own controls
 * first, then by how many of the scenario's threats each covers (at most six).
 *
 * Diagram ids: `nodeId` / `edgeId` point into the architecture's flow definition
 * (src/components/visual/architectureFlows.ts), resolved by KC category with
 * `resolveScenarioPath`; a step whose KC has no node in that diagram has no `nodeId`.
 *
 * Usage:
 *   scenariosForAsi("ASI01")             // walkthroughs for an ASI entry
 *   scenariosForArchitecture("reactive") // walkthroughs set in one architecture
 *   scenariosForThreat("t6")             // walkthroughs that involve a threat
 *   <Link to={scenarioPath(s.id)}>{s.title}</Link>
 */
import {
  agenticTop10Data,
  type AgenticTop10Entry,
} from "@/components/components/owaspAgenticTop10Data";
import { architecturesData, type Architecture } from "@/components/components/architecturesData";
import { mitigationsData, threatsData, type Threat } from "@/components/components/securityData";
import { kcId, type KcId } from "@/data/kc";
import { compareBands, impactBand, maxBand, type Band } from "@/lib/severity";
import {
  flowEntryNode,
  getArchitectureFlow,
  type FlowDef,
} from "@/components/visual/architectureFlows";

export interface ScenarioStep {
  title: string;
  narrative: string;
  /** Key component the step lands on (drives the diagram highlight). */
  kc?: KcId;
  /** The entry step: the actor or event source where the attack starts. */
  entry?: boolean;
  /** Diagram node / edge ids in ARCHITECTURE_FLOWS (see `resolveScenarioPath`). */
  nodeId?: string;
  edgeId?: string;
  /** The edge is traversed target → source. */
  reverse?: boolean;
  severity: Band;
  /** Threat the step is about, when any. */
  threatId?: string;
}

export interface Scenario {
  /** URL slug, e.g. "asi01-echoleak-zero-click-indirect-prompt-injection". */
  id: string;
  title: string;
  /** One-paragraph summary (the source scenario text). */
  summary: string;
  source: "asi" | "architecture";
  asiId?: string;
  archId: string;
  threatIds: string[];
  steps: ScenarioStep[];
  /** Mitigation ids, most relevant first. */
  controlsThatStop: string[];
  /** Highest step severity. */
  severity: Band;
}

const ARCHITECTURES: readonly Architecture[] = Object.values(architecturesData).sort(
  (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99),
);
const MITIGATIONS = Object.values(mitigationsData);
const MAX_CONTROLS = 6;

const slugify = (text: string, maxWords = 6) =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join("-");

/** Threat ids cited as "T6", "T15" … in a text, in order of appearance (existing ids only). */
function threatIdsIn(text: string): string[] {
  const ids = [...text.matchAll(/\bT(\d{1,2})\b/g)].map((m) => `t${m[1]}`);
  return [...new Set(ids)].filter((id) => id in threatsData);
}

/** First key component cited as "KC4.2", "KC1" … in a text. */
function kcIn(text: string): KcId | undefined {
  const m = text.match(/\bKC\s?([1-6])(?:\.\d+)*/);
  return m ? kcId(`kc${m[1]}`) : undefined;
}

const archKcs = (a: Architecture) =>
  new Set(a.keyComponents.map((c) => kcId(c)).filter(Boolean) as KcId[]);

/** Threat KCs that exist in the architecture (falls back to the threat's own list). */
function threatKcsIn(t: Threat, a: Architecture): KcId[] {
  const own = t.componentIds.map((c) => kcId(c)).filter(Boolean) as KcId[];
  const present = archKcs(a);
  const inArch = own.filter((k) => present.has(k));
  // KCs the architecture's diagram actually draws come first (stable otherwise).
  const drawn = new Set(getArchitectureFlow(a.id)?.nodes.map((n) => n.data.category) ?? []);
  return (inArch.length ? inArch : own)
    .map((k, i) => ({ k, i, d: drawn.has(k) ? 0 : 1 }))
    .sort((x, y) => x.d - y.d || x.i - y.i)
    .map((x) => x.k);
}

/** Controls mapped to a threat from either side of the mapping. */
function controlsFor(t: Threat): Set<string> {
  const ids = new Set(t.mitigationIds ?? []);
  for (const m of MITIGATIONS) if (m.threatIds?.includes(t.id)) ids.add(m.id);
  return ids;
}

const idNumber = (id: string) => Number(id.replace(/\D/g, "")) || 0;

function controlsThatStop(threats: Threat[], arch: Architecture): string[] {
  const coverage = new Map<string, number>();
  for (const t of threats)
    for (const id of controlsFor(t)) coverage.set(id, (coverage.get(id) ?? 0) + 1);
  const inArch = (id: string) => (arch.mitigationIds.includes(id) ? 1 : 0);
  return [...coverage.keys()]
    .sort(
      (a, b) =>
        inArch(b) - inArch(a) ||
        (coverage.get(b) ?? 0) - (coverage.get(a) ?? 0) ||
        idNumber(a) - idNumber(b),
    )
    .slice(0, MAX_CONTROLS);
}

/** Most severe vector of a threat, rotating among equals by `index`. */
function vectorFor(t: Threat, index: number) {
  const vectors = (t.attackVectors ?? []).filter((v) => v.severity);
  if (!vectors.length) return undefined;
  const top = maxBand(vectors.map((v) => impactBand(v.severity)));
  const candidates = vectors.filter((v) => impactBand(v.severity) === top);
  return candidates[index % candidates.length];
}

/**
 * ASI entry for a threat: the most specific Top 10 Appendix A entry (fewest related threats), then
 * the site's own mapping.
 */
function asiFor(t: Threat): AgenticTop10Entry | undefined {
  const official = agenticTop10Data
    .filter((e) => e.relatedThreats.includes(t.id))
    .sort((a, b) => a.relatedThreats.length - b.relatedThreats.length);
  return official[0] ?? agenticTop10Data.find((e) => t.asiMapping?.includes(e.id));
}

const shortArch = (a: Architecture) => a.name.replace(/ (Agent )?Architecture$/, "");
const threatLabel = (t: Threat) => `${t.code} ${t.shortName ?? t.name}`;

function setupStep(a: Architecture): ScenarioStep {
  return {
    title: "The setup",
    narrative: `The target is a ${a.name}. ${a.description}`,
    entry: true,
    severity: "info",
  };
}

function techniqueStep(t: Threat, a: Architecture, index: number): ScenarioStep | null {
  const v = vectorFor(t, index);
  if (!v) return null;
  const kcs = threatKcsIn(t, a);
  return {
    title: `Technique: ${v.vector}`,
    narrative: v.example
      ? `${v.example.replace(/\.$/, "")}. The threat catalog rates this ${t.code} vector ${impactBand(v.severity)}.`
      : `The threat catalog rates this ${t.code} vector ${impactBand(v.severity)}.`,
    kc: kcs[0],
    severity: impactBand(v.severity),
    threatId: t.id,
  };
}

function threatStep(t: Threat, a: Architecture, title: string): ScenarioStep {
  const kcs = threatKcsIn(t, a);
  return {
    title,
    narrative: `${t.code} ${t.name}: ${t.description}`,
    kc: kcs[1] ?? kcs[0],
    severity: impactBand(t.impactLevel),
    threatId: t.id,
  };
}

function finish(
  base: Omit<Scenario, "severity" | "controlsThatStop" | "steps"> & { steps: ScenarioStep[] },
  threats: Threat[],
  arch: Architecture,
): Scenario {
  const flow = getArchitectureFlow(arch.id);
  const steps = flow ? resolveScenarioPath(base.steps.slice(0, 6), flow) : base.steps.slice(0, 6);
  return {
    ...base,
    steps,
    controlsThatStop: controlsThatStop(threats, arch),
    severity: maxBand(steps.map((s) => s.severity)) as Band,
  };
}

/** Number of distinct KCs of `threatIds` that the architecture's diagram draws as nodes. */
function diagramCoverage(threatIds: string[], a: Architecture): number {
  const drawn = new Set(getArchitectureFlow(a.id)?.nodes.map((n) => n.data.category) ?? []);
  const kcs = new Set(
    threatIds.flatMap((id) => threatsData[id]?.componentIds.map((c) => kcId(c)) ?? []),
  );
  return [...kcs].filter((k) => k && drawn.has(k)).length;
}

function fromAsi(entry: AgenticTop10Entry, index: number): Scenario | null {
  const s = entry.attackScenarios[index];
  const related = entry.relatedThreats.filter((id) => id in threatsData);
  if (!s || !related.length) return null;
  const scored = ARCHITECTURES.map((a) => ({
    a,
    overlap: related.filter((id) => a.threatIds.includes(id)).length,
  }));
  const best = Math.max(...scored.map((x) => x.overlap));
  const top =
    best > 0 ? scored.filter((x) => x.overlap === best).map((x) => x.a) : [...ARCHITECTURES];
  // Prefer patterns whose diagram draws at least one component these threats hit.
  const drawn = top.filter((a) => {
    const used = related.filter((id) => a.threatIds.includes(id));
    return diagramCoverage(used.length ? used : related, a) > 0;
  });
  const candidates = drawn.length ? drawn : top;
  const arch = candidates[index % candidates.length];
  const inArch = related.filter((id) => arch.threatIds.includes(id));
  const threatIds = (inArch.length ? inArch : related).slice(0, 2);
  const threats = threatIds.map((id) => threatsData[id]);
  const [primary, secondary] = threats;
  const kcs = threatKcsIn(primary, arch);

  const steps: ScenarioStep[] = [setupStep(arch)];
  steps.push({
    title: "The attack",
    narrative: s.description,
    kc: kcs[0],
    severity: impactBand(primary.impactLevel),
    threatId: primary.id,
  });
  const technique = techniqueStep(primary, arch, index);
  if (technique) steps.push(technique);
  steps.push(threatStep(primary, arch, `Threat: ${threatLabel(primary)}`));
  if (secondary) steps.push(threatStep(secondary, arch, `Also in play: ${threatLabel(secondary)}`));
  const exposure = arch.relevantThreats?.find((rt) =>
    threatIdsIn(rt.title).some((id) => threatIds.includes(id)),
  );
  if (exposure) {
    steps.push({
      title: `Why the ${shortArch(arch)} pattern is exposed`,
      narrative: exposure.description,
      kc: kcIn(exposure.description) ?? kcs[0],
      severity: impactBand(primary.impactLevel),
      threatId: threatIdsIn(exposure.title)[0],
    });
  }
  return finish(
    {
      id: `${entry.id.toLowerCase()}-${slugify(s.title)}`,
      title: s.title,
      summary: s.description,
      source: "asi",
      asiId: entry.id,
      archId: arch.id,
      threatIds,
      steps,
    },
    threats,
    arch,
  );
}

function fromArchitecture(arch: Architecture, index: number): Scenario | null {
  const rt = arch.relevantThreats?.[index];
  if (!rt) return null;
  const threatIds = threatIdsIn(rt.title);
  if (!threatIds.length) return null;
  const threats = threatIds.map((id) => threatsData[id]);
  const [primary, secondary] = threats;
  const asi = asiFor(primary);
  const kcs = threatKcsIn(primary, arch);

  const steps: ScenarioStep[] = [setupStep(arch)];
  steps.push({
    title: "The attack",
    narrative: rt.description,
    kc: kcIn(rt.description) ?? kcs[0],
    severity: impactBand(primary.impactLevel),
    threatId: primary.id,
  });
  const technique = techniqueStep(primary, arch, index);
  if (technique) steps.push(technique);
  steps.push(threatStep(primary, arch, `Threat: ${threatLabel(primary)}`));
  if (secondary) steps.push(threatStep(secondary, arch, `Also in play: ${threatLabel(secondary)}`));
  const realWorld = asi?.attackScenarios[index % Math.max(1, asi.attackScenarios.length)];
  if (asi && realWorld) {
    steps.push({
      title: `In the wild: ${realWorld.title}`,
      narrative: `${asi.code} ${asi.name} in the OWASP Top 10 for Agentic Applications describes the same pattern: ${realWorld.description}`,
      kc: kcs[0],
      severity: impactBand(primary.impactLevel),
      threatId: primary.id,
    });
  }
  return finish(
    {
      id: `${arch.id.replace(/_/g, "-")}-${slugify(rt.title)}`,
      // Architecture-derived walkthroughs name the pattern: the same threat can
      // appear under several architectures and titles must stay unique.
      title: `${rt.title} in ${shortArch(arch)}`,
      summary: rt.description,
      source: "architecture",
      asiId: asi?.id,
      archId: arch.id,
      threatIds,
      steps,
    },
    threats,
    arch,
  );
}

function buildScenarios(): Scenario[] {
  const out: Scenario[] = [];
  for (const entry of agenticTop10Data) {
    entry.attackScenarios.forEach((_, i) => {
      const s = fromAsi(entry, i);
      if (s) out.push(s);
    });
  }
  for (const arch of ARCHITECTURES) {
    (arch.relevantThreats ?? []).forEach((_, i) => {
      const s = fromArchitecture(arch, i);
      if (s) out.push(s);
    });
  }
  // Ids must be unique.
  const seen = new Map<string, number>();
  for (const s of out) {
    const n = seen.get(s.id) ?? 0;
    seen.set(s.id, n + 1);
    if (n > 0) s.id = `${s.id}-${n + 1}`;
  }
  return out;
}

/** Every scenario: ASI scenarios in Top 10 order, then architecture scenarios. */
export const SCENARIOS: readonly Scenario[] = buildScenarios();

const BY_ID = new Map(SCENARIOS.map((s) => [s.id, s]));

export function getScenario(id: string | null | undefined): Scenario | undefined {
  return id ? BY_ID.get(id) : undefined;
}

export function scenarioPath(id: string): string {
  return `/scenarios/${encodeURIComponent(id)}`;
}

/** Walkthroughs for an ASI entry ("ASI01"): its own attack scenarios first, then architecture ones mapped to it. */
export function scenariosForAsi(asiId: string): Scenario[] {
  const id = asiId.toUpperCase();
  return SCENARIOS.filter((s) => s.asiId === id).sort(
    (a, b) => Number(a.source !== "asi") - Number(b.source !== "asi"),
  );
}

/** Walkthroughs set in an architecture ("reactive"): its own relevant threats first. */
export function scenariosForArchitecture(archId: string): Scenario[] {
  return SCENARIOS.filter((s) => s.archId === archId).sort(
    (a, b) => Number(a.source !== "architecture") - Number(b.source !== "architecture"),
  );
}

/** Walkthroughs that involve a threat ("t6"), most severe first. */
export function scenariosForThreat(threatId: string): Scenario[] {
  const id = threatId.toLowerCase();
  return SCENARIOS.filter((s) => s.threatIds.includes(id)).sort((a, b) =>
    compareBands(a.severity, b.severity),
  );
}

/** Deterministic pick for a day (Home "featured scenario"). */
export function featuredScenario(date: Date = new Date()): Scenario {
  // UTC day, matching featuredThreatFor() so both rotate together.
  const day = Math.floor(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000,
  );
  return SCENARIOS[((day % SCENARIOS.length) + SCENARIOS.length) % SCENARIOS.length];
}

/** Previous / next scenario in SCENARIOS order (wrapping). */
export function adjacentScenarios(id: string): { prev: Scenario; next: Scenario } | undefined {
  const i = SCENARIOS.findIndex((s) => s.id === id);
  if (i < 0) return undefined;
  const n = SCENARIOS.length;
  return { prev: SCENARIOS[(i - 1 + n) % n], next: SCENARIOS[(i + 1) % n] };
}

// ─── Diagram path resolution ───────────────────────────────────────────────

type FlowEdge = FlowDef["edges"][number];

/** Edges of the shortest undirected path between two nodes (null when unreachable). */
function shortestPath(flow: FlowDef, from: string, to: string): FlowEdge[] | null {
  if (from === to) return [];
  const via = new Map<string, FlowEdge | null>([[from, null]]);
  let frontier = [from];
  while (frontier.length) {
    const next: string[] = [];
    for (const id of frontier) {
      for (const e of flow.edges) {
        const other = e.source === id ? e.target : e.target === id ? e.source : undefined;
        if (!other || via.has(other)) continue;
        via.set(other, e);
        if (other === to) {
          const path: FlowEdge[] = [];
          for (let cur = to; cur !== from; ) {
            const edge = via.get(cur);
            if (!edge) break;
            path.unshift(edge);
            cur = edge.source === cur ? edge.target : edge.source;
          }
          return path;
        }
        next.push(other);
      }
    }
    frontier = next;
  }
  return null;
}

/**
 * Fill `nodeId` / `edgeId` / `reverse` on each step from a flow definition: the entry step lands
 * on the flow's entry node; a KC step lands on the node of that category closest to the previous
 * step's node, arriving over the last edge of the shortest path between them. Steps whose KC has
 * no node in the diagram are left without a `nodeId`.
 */
export function resolveScenarioPath(steps: readonly ScenarioStep[], flow: FlowDef): ScenarioStep[] {
  let prev: string | undefined;
  return steps.map((step) => {
    const { nodeId: _n, edgeId: _e, reverse: _r, ...rest } = step;
    const resolved: ScenarioStep = { ...rest };
    let nodeId: string | undefined;
    let path: FlowEdge[] | null = null;
    if (step.entry) {
      nodeId = flowEntryNode(flow)?.id;
    } else if (step.kc) {
      const ranked = flow.nodes
        .filter((n) => n.data.category === step.kc)
        .map((n) => ({ id: n.id, path: prev ? shortestPath(flow, prev, n.id) : null }))
        .sort((x, y) => (x.path?.length ?? Infinity) - (y.path?.length ?? Infinity));
      nodeId = ranked[0]?.id;
      path = ranked[0]?.path ?? null;
    }
    if (!nodeId) return resolved;
    resolved.nodeId = nodeId;
    const edge = path?.[path.length - 1];
    if (edge) {
      resolved.edgeId = edge.id;
      if (edge.source === nodeId) resolved.reverse = true;
    }
    prev = nodeId;
    return resolved;
  });
}
