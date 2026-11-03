/**
 * Search index for the command palette (IMPROVEMENT_PLAN P1-10). Loaded lazily the first time
 * the palette opens; every entry is built from the data modules so counts and names never drift.
 */
import { navItemsFor } from "@/config/navigation";

export type PaletteGroup =
  | "recent"
  | "actions"
  | "pages"
  | "threats"
  | "controls"
  | "components"
  | "architectures"
  | "aisvs"
  | "asi"
  | "cisco"
  | "aiuc1"
  | "nist";

export const PALETTE_GROUP_LABELS: Record<PaletteGroup, string> = {
  recent: "Recent",
  actions: "Actions",
  pages: "Pages",
  threats: "Threats",
  controls: "Controls",
  components: "Components",
  architectures: "Architectures",
  aisvs: "AISVS",
  asi: "OWASP Agentic Top 10",
  cisco: "Cisco AI Security Taxonomy",
  aiuc1: "AIUC-1",
  nist: "NIST AI RMF",
};

export interface PaletteEntry {
  /** Unique, stable id ("threat:t1"); also the cmdk item value. */
  id: string;
  group: PaletteGroup;
  title: string;
  /** Display code (T7, M3, C5, 1.2.3, ASI01, OB-004, A001, GOVERN.1.1). */
  code?: string;
  subtitle?: string;
  /** Router path to navigate to; actions use `action` instead. */
  path?: string;
  action?: "toggle-theme";
  /** Normalized codes (see normalizeCode) for exact / prefix matching. */
  aliases: string[];
  titleLower: string;
  haystack: string;
}

/** Upper-case and strip whitespace: "asi 01" → "ASI01", "govern 1.1" → "GOVERN1.1". */
export function normalizeCode(value: string): string {
  return value.toUpperCase().replace(/\s+/g, "");
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalizeCode).filter(Boolean))];
}

function clip(text: string | undefined, max = 280): string {
  if (!text) return "";
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function entry(
  e: Omit<PaletteEntry, "aliases" | "titleLower" | "haystack"> & {
    aliases?: string[];
    keywords?: string;
  },
): PaletteEntry {
  const { keywords, aliases, ...rest } = e;
  return {
    ...rest,
    aliases: unique(aliases ?? (e.code ? [e.code] : [])),
    titleLower: e.title.toLowerCase(),
    haystack: [e.code, e.title, e.subtitle, keywords].filter(Boolean).join(" ").toLowerCase(),
  };
}

/** Zero-padding variants: "ASI01" ↔ "ASI1", "OB-004" ↔ "OB4", "A001" ↔ "A1". */
function paddedVariants(code: string): string[] {
  const m = code.match(/^([A-Za-z]+)(-?)0*(\d+)$/);
  if (!m) return [code];
  const [, prefix, dash, digits] = m;
  return [
    code,
    `${prefix}${digits}`,
    `${prefix}-${digits}`,
    `${prefix}${dash}${digits}`,
    code.replace("-", ""),
  ];
}

/** Static entries (pages and actions) that are available before the data index loads. */
export function staticEntries(): PaletteEntry[] {
  const pages = navItemsFor("palette").map((item) =>
    entry({
      id: `page:${item.path}`,
      group: "pages",
      title: item.label,
      subtitle: item.description,
      path: item.path,
      aliases: [],
    }),
  );
  const actions = [
    entry({
      id: "action:toggle-theme",
      group: "actions",
      title: "Toggle theme",
      subtitle: "Switch between light and dark",
      action: "toggle-theme",
      aliases: [],
      keywords: "dark light mode appearance colour color",
    }),
    entry({
      id: "action:threat-modeler",
      group: "actions",
      title: "Open Threat Modeler",
      subtitle: "Model an agentic system and generate threats",
      path: "/threat-modeler",
      aliases: [],
      keywords: "canvas diagram model maestro",
    }),
  ];
  return [...actions, ...pages];
}

let dataIndex: Promise<PaletteEntry[]> | null = null;

/** Threats, controls, components, architectures, AISVS, ASI, Cisco and AIUC-1 entries. */
export function loadDataIndex(): Promise<PaletteEntry[]> {
  if (!dataIndex) {
    dataIndex = buildDataIndex().catch((err) => {
      dataIndex = null;
      throw err;
    });
  }
  return dataIndex;
}

async function buildDataIndex(): Promise<PaletteEntry[]> {
  const [security, framework, architectures, asi, cisco, aiuc1] = await Promise.all([
    import("@/components/components/securityData"),
    import("@/components/components/frameworkData"),
    import("@/components/components/architecturesData"),
    import("@/components/components/owaspAgenticTop10Data"),
    import("@/components/components/ciscoTaxonomyData"),
    import("@/components/components/aiuc1Data"),
  ]);
  const out: PaletteEntry[] = [];

  for (const t of Object.values(security.threatsData)) {
    out.push(
      entry({
        id: `threat:${t.id}`,
        group: "threats",
        code: t.code,
        title: t.name,
        subtitle: clip(t.description, 140),
        path: `/threats/${t.id}`,
        keywords: [clip(t.description), (t.tags ?? []).join(" ")].join(" "),
      }),
    );
  }

  for (const m of Object.values(security.mitigationsData)) {
    const code = m.id.toUpperCase();
    out.push(
      entry({
        id: `control:${m.id}`,
        group: "controls",
        code,
        title: m.name,
        subtitle: clip(m.description, 140),
        path: `/controls/${m.id}`,
        keywords: [clip(m.description), (m.tags ?? []).join(" ")].join(" "),
      }),
    );
  }

  type Node = (typeof framework.frameworkData)[number];
  const addComponents = (nodes: Node[], parent?: string) => {
    for (const c of nodes) {
      const id = c.id.replace(/-/g, ".");
      const code = id.toUpperCase();
      const title = c.title.replace(/\s*\(KC[\d.]+\)\s*$/i, "");
      out.push(
        entry({
          id: `component:${id}`,
          group: "components",
          code,
          title,
          subtitle: parent ? `${parent} › ${clip(c.description, 100)}` : clip(c.description, 140),
          path: `/components/${id}`,
          keywords: clip(c.description),
        }),
      );
      if (c.children?.length) addComponents(c.children, title);
    }
  };
  addComponents(framework.frameworkData);

  for (const a of Object.values(architectures.architecturesData)) {
    out.push(
      entry({
        id: `architecture:${a.id}`,
        group: "architectures",
        title: a.name,
        subtitle: clip(a.description, 140),
        path: `/architectures/${a.id}`,
        aliases: [],
        keywords: [clip(a.description), (a.tags ?? []).join(" ")].join(" "),
      }),
    );
  }

  // AISVS: chapters (C5), sections (C5.1) and requirements (C5.1.2). Chapter count comes from data.
  for (const cat of Object.values(security.aisvsData)) {
    const chapter = cat.code.replace(/^[CV]/i, "");
    out.push(
      entry({
        id: `aisvs:${cat.id}`,
        group: "aisvs",
        code: cat.code,
        title: cat.name,
        subtitle: clip(cat.description, 140),
        path: `/aisvs#C${chapter}`,
        aliases: [cat.code, `C${chapter}`, `V${chapter}`],
        keywords: clip(cat.description),
      }),
    );
    for (const sub of cat.subCategories) {
      const subCode = sub.code.replace(/^[CV]/i, "");
      out.push(
        entry({
          id: `aisvs:${sub.id}`,
          group: "aisvs",
          code: `C${subCode}`,
          title: sub.name,
          subtitle: `${cat.code} ${cat.name}`,
          path: `/aisvs#C${subCode}`,
          aliases: [`C${subCode}`, `V${subCode}`, subCode],
        }),
      );
      for (const req of sub.requirements) {
        const reqCode = req.code.replace(/^[CV]/i, "");
        out.push(
          entry({
            id: `aisvs:${req.id}`,
            group: "aisvs",
            code: reqCode,
            title: req.title,
            subtitle: `Level ${req.level} · ${clip(req.description, 120)}`,
            path: `/aisvs#C${reqCode}`,
            aliases: [reqCode, `C${reqCode}`, `V${reqCode}`],
            keywords: clip(req.description),
          }),
        );
      }
    }
  }

  for (const e of asi.agenticTop10Data) {
    out.push(
      entry({
        id: `asi:${e.code}`,
        group: "asi",
        code: e.code,
        title: e.name,
        subtitle: clip(e.description, 140),
        path: `/taxonomy?tab=owasp-agentic&entry=${encodeURIComponent(e.code)}`,
        aliases: paddedVariants(e.code),
        keywords: clip(e.description),
      }),
    );
  }

  for (const og of cisco.ciscoTaxonomyData) {
    out.push(
      entry({
        id: `cisco:${og.code}`,
        group: "cisco",
        code: og.code,
        title: og.description,
        subtitle: og.objective_group ? `Objective · ${og.objective_group}` : "Objective",
        path: `/taxonomy?tab=cisco&entry=${encodeURIComponent(og.code)}`,
        aliases: paddedVariants(og.code),
        keywords: clip(og.definition),
      }),
    );
    for (const tech of og.ai_tech) {
      out.push(
        entry({
          id: `cisco:${tech.code}`,
          group: "cisco",
          code: tech.code,
          title: tech.description,
          subtitle: `Technique · ${og.code} ${og.description}`,
          path: `/taxonomy?tab=cisco&entry=${encodeURIComponent(tech.code)}`,
          aliases: [tech.code, tech.code.replace("-", "")],
          keywords: clip(tech.definition),
        }),
      );
      for (const sub of tech.ai_subtech) {
        out.push(
          entry({
            id: `cisco:${sub.code}`,
            group: "cisco",
            code: sub.code,
            title: sub.description,
            subtitle: `Sub-technique · ${tech.code} ${tech.description}`,
            path: `/taxonomy?tab=cisco&entry=${encodeURIComponent(sub.code)}`,
            aliases: [sub.code, sub.code.replace("-", "")],
            keywords: clip(sub.definition),
          }),
        );
      }
    }
  }

  for (const principle of aiuc1.aiuc1Principles) {
    for (const r of principle.requirements) {
      // Retired ids stay in the data for old links but are not search results.
      if (!aiuc1.isAiuc1RequirementActive(r)) continue;
      out.push(
        entry({
          id: `aiuc1:${r.id}`,
          group: "aiuc1",
          code: r.id,
          title: r.title,
          subtitle: `${principle.name} · ${r.application}`,
          path: `/taxonomy?tab=aiuc1&entry=${encodeURIComponent(r.id)}`,
          aliases: paddedVariants(r.id),
          keywords: clip(r.fullText),
        }),
      );
    }
  }

  return out;
}

let nistIndex: Promise<PaletteEntry[]> | null = null;

/**
 * NIST AI RMF subcategories (src/data/nist.ts). A separate, non-blocking load so the NIST data
 * stays out of the main data index chunk.
 */
export function loadNistIndex(): Promise<PaletteEntry[]> {
  if (!nistIndex) {
    nistIndex = import("@/data/nist")
      .then((mod) =>
        mod.NIST_SUBCATEGORIES.map((sub) =>
          entry({
            id: `nist:${sub.code}`,
            group: "nist",
            code: sub.code,
            title: sub.name,
            subtitle: clip(sub.description, 140),
            path: `/nist-mapping?sub=${encodeURIComponent(sub.code)}`,
            aliases: [sub.code, sub.code.replace(/^([A-Z]+)\./, "$1")],
            keywords: clip(sub.description),
          }),
        ),
      )
      .catch((err) => {
        nistIndex = null;
        throw err;
      });
  }
  return nistIndex;
}

const GROUP_WEIGHT: Partial<Record<PaletteGroup, number>> = {
  actions: 6,
  pages: 5,
  threats: 4,
  controls: 3,
  components: 2,
  architectures: 2,
  asi: 2,
};

function isWordStart(text: string, query: string): boolean {
  let i = text.indexOf(query);
  while (i !== -1) {
    if (i === 0 || /[^a-z0-9]/.test(text[i - 1])) return true;
    i = text.indexOf(query, i + 1);
  }
  return false;
}

/** Relevance of one entry for a query; 0 = no match. Codes outrank text. */
export function scoreEntry(e: PaletteEntry, query: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const qCode = normalizeCode(q);
  let best = 0;

  for (const alias of e.aliases) {
    if (alias === qCode) return 1000 + (GROUP_WEIGHT[e.group] ?? 0);
    if (qCode.length >= 2 && alias.startsWith(qCode)) {
      best = Math.max(best, 700 - Math.min(50, alias.length - qCode.length));
    }
  }

  const title = e.titleLower;
  if (title === q) best = Math.max(best, 900);
  else if (title.startsWith(q)) best = Math.max(best, 600);
  else if (isWordStart(title, q)) best = Math.max(best, 450);
  else if (q.length >= 2 && title.includes(q)) best = Math.max(best, 350);

  if (best < 300 && q.length >= 2) {
    const tokens = q.split(/\s+/).filter(Boolean);
    if (tokens.length && tokens.every((t) => e.haystack.includes(t))) {
      best = Math.max(best, tokens.every((t) => title.includes(t)) ? 260 : 150);
    }
  }

  return best ? best + (GROUP_WEIGHT[e.group] ?? 0) : 0;
}

export interface PaletteResultGroup {
  group: PaletteGroup;
  label: string;
  items: PaletteEntry[];
}

/** Top matches per group, groups ordered by their best match. */
export function searchEntries(
  entries: PaletteEntry[],
  query: string,
  perGroup = 5,
): PaletteResultGroup[] {
  const byGroup = new Map<PaletteGroup, { entry: PaletteEntry; score: number }[]>();
  for (const e of entries) {
    const score = scoreEntry(e, query);
    if (!score) continue;
    const list = byGroup.get(e.group) ?? [];
    list.push({ entry: e, score });
    byGroup.set(e.group, list);
  }
  return [...byGroup.entries()]
    .map(([group, list]) => {
      list.sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title));
      return { group, best: list[0].score, items: list.slice(0, perGroup).map((x) => x.entry) };
    })
    .sort((a, b) => b.best - a.best)
    .map(({ group, items }) => ({ group, label: PALETTE_GROUP_LABELS[group], items }));
}

function bigrams(value: string): Map<string, number> {
  const s = ` ${value} `;
  const map = new Map<string, number>();
  for (let i = 0; i < s.length - 1; i++) {
    const bg = s.slice(i, i + 2);
    map.set(bg, (map.get(bg) ?? 0) + 1);
  }
  return map;
}

/** Sørensen–Dice similarity on character bigrams (0..1); tolerant of typos and reordering. */
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrams(a);
  const B = bigrams(b);
  let overlap = 0;
  let total = 0;
  A.forEach((n, bg) => {
    overlap += Math.min(n, B.get(bg) ?? 0);
    total += n;
  });
  B.forEach((n) => {
    total += n;
  });
  return total ? (2 * overlap) / total : 0;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-|-$/g, "");

const SUGGEST_GROUPS: PaletteGroup[] = [
  "threats",
  "controls",
  "architectures",
  "components",
  "pages",
];

/**
 * "Did you mean" for a 404 path: fuzzy-matches the last URL segment against the ids and titles
 * of threats, controls, architectures, components and pages, favouring the URL's section.
 */
export function suggestForPath(
  entries: PaletteEntry[],
  pathname: string,
  limit = 5,
): PaletteEntry[] {
  const segments = pathname.toLowerCase().split("/").filter(Boolean).map(decodeURIComponent);
  if (!segments.length) return [];
  const last = slugify(segments[segments.length - 1]);
  const section = segments[0];
  const scored: { entry: PaletteEntry; score: number }[] = [];
  for (const e of entries) {
    if (!SUGGEST_GROUPS.includes(e.group) || !e.path) continue;
    const idSlug = slugify(e.path.split("?")[0].split("/").filter(Boolean).pop() ?? "");
    let score = Math.max(
      similarity(last, idSlug),
      similarity(last, slugify(e.title)),
      similarity(slugify(segments.join("-")), slugify(e.path)),
    );
    if (e.aliases.includes(normalizeCode(last))) score = 1;
    if (segments.length > 1 && e.path.startsWith(`/${section}`)) score += 0.15;
    if (score >= 0.4) scored.push({ entry: e, score });
  }
  scored.sort((a, b) => b.score - a.score);
  const out: PaletteEntry[] = [];
  const seen = new Set<string>();
  for (const { entry } of scored) {
    if (!entry.path || seen.has(entry.path)) continue;
    seen.add(entry.path);
    out.push(entry);
    if (out.length >= limit) break;
  }
  return out;
}
