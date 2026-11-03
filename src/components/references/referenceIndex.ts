/**
 * Reference library index (IMPROVEMENT_PLAN §6.11).
 *
 * Collects every external link cited by the threat catalogue, the controls, the AISVS chapters
 * and the OWASP Top 10 for Agentic Applications, merges links that point at the same document
 * (same URL modulo scheme / `www.` / trailing slash / case / tracking params, plus the old and
 * new NIST CSRC URL schemes), and records who cites each one so the page can link back.
 *
 * The type facet (paper / standard / tool / blog) is inferred from host and path through the
 * explicit rule tables below — edit those tables, not the inference code, to re-file a link.
 */
import { threatsData, mitigationsData } from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { aisvsData } from "@/data/aisvs";

// ── Types ──────────────────────────────────────────────────────────────────────

export type ReferenceType = "paper" | "standard" | "tool" | "blog";
export type CitingKind = "threat" | "control" | "aisvs" | "asi";

export interface Citation {
  kind: CitingKind;
  /** Stable id of the citing item (threat id, control id, AISVS code, ASI code). */
  id: string;
  /** Short code shown on the chip, e.g. "T6", "M3", "C5", "ASI02". */
  code: string;
  name: string;
  /** In-app route back to the citing item. */
  href: string;
}

export interface ReferenceEntry {
  /** Normalised URL — the de-duplication key and the React key. */
  key: string;
  url: string;
  title: string;
  /** Other titles the same link is cited under (data titles are often editorial labels). */
  alsoCitedAs: string[];
  /** Other URL spellings merged into this entry. */
  variants: string[];
  /** Hostname without `www.`. */
  host: string;
  /** Text label for the domain (no favicons: they would leak browsing to a third party). */
  domain: string;
  type: ReferenceType;
  citedBy: Citation[];
}

export const REFERENCE_TYPES: readonly {
  id: ReferenceType;
  label: string;
  /** Badge text on a single reference. */
  singular: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "standard",
    label: "Standards",
    singular: "Standard",
    icon: "scroll-text",
    description: "Standards, specifications, frameworks and official guidance",
  },
  {
    id: "paper",
    label: "Papers",
    singular: "Paper",
    icon: "file-text",
    description: "Research papers, conference talks and reports",
  },
  {
    id: "tool",
    label: "Tools",
    singular: "Tool",
    icon: "wrench",
    description: "Code repositories, products and their documentation",
  },
  {
    id: "blog",
    label: "Blogs & news",
    singular: "Article",
    icon: "book-open",
    description: "Blog posts, news, advisories and write-ups",
  },
];

export const CITING_KINDS: readonly {
  id: CitingKind;
  label: string;
  icon: string;
}[] = [
  { id: "threat", label: "Threats", icon: "source-threat" },
  { id: "control", label: "Controls", icon: "source-mitigation" },
  { id: "aisvs", label: "AISVS", icon: "source-aisvs" },
  { id: "asi", label: "Agentic Top 10", icon: "shield-alert" },
];

// ── Rule tables (edit these to re-file a link) ─────────────────────────────────

/** Exact-URL overrides, keyed by normalised URL (see `normalizeUrl`). Highest precedence. */
const TYPE_BY_URL: Record<string, ReferenceType> = {};

/**
 * Host (+ optional path prefix) rules. Matching is on the host without `www.`, by exact host or
 * by `.suffix`; when several match, the longest host + path wins.
 */
const TYPE_RULES: readonly { host: string; path?: string; type: ReferenceType }[] = [
  // Standards bodies, specifications and official guidance
  { host: "owasp.org", type: "standard" },
  { host: "owaspai.org", type: "standard" },
  { host: "owaspsamm.org", type: "standard" },
  { host: "nist.gov", type: "standard" },
  { host: "iso.org", type: "standard" },
  { host: "w3.org", type: "standard" },
  { host: "ietf.org", type: "standard" },
  { host: "rfc-editor.org", type: "standard" },
  { host: "mitre.org", type: "standard" },
  { host: "cisa.gov", type: "standard" },
  { host: "europa.eu", type: "standard" },
  { host: "artificialintelligenceact.eu", type: "standard" },
  { host: "gdpr.eu", type: "standard" },
  { host: "oecd.org", type: "standard" },
  { host: "standards.ieee.org", type: "standard" },
  { host: "openid.net", type: "standard" },
  { host: "slsa.dev", type: "standard" },
  { host: "cyclonedx.org", type: "standard" },
  { host: "spdx.github.io", type: "standard" },
  { host: "spiffe.io", type: "standard" },
  { host: "modelcontextprotocol.io", type: "standard" },
  { host: "a2a-protocol.org", type: "standard" },
  { host: "finops.org", type: "standard" },
  { host: "partnershiponai.org", type: "standard" },
  { host: "confidentialcomputing.io", type: "standard" },
  { host: "github.com", path: "/owasp/", type: "standard" },
  { host: "github.com", path: "/genai-security-project/", type: "standard" },
  // Research
  { host: "arxiv.org", type: "paper" },
  { host: "usenix.org", type: "paper" },
  { host: "ndss-symposium.org", type: "paper" },
  { host: "acm.org", type: "paper" },
  { host: "ieeexplore.ieee.org", type: "paper" },
  { host: "openreview.net", type: "paper" },
  { host: "aclanthology.org", type: "paper" },
  { host: "neurips.cc", type: "paper" },
  { host: "mdpi.com", type: "paper" },
  { host: "i.blackhat.com", type: "paper" },
  { host: "css.csail.mit.edu", type: "paper" },
  { host: "hai.stanford.edu", type: "paper" },
  { host: "fhi.ox.ac.uk", type: "paper" },
  { host: "aisi.gov.uk", path: "/research", type: "paper" },
  { host: "sans.org", path: "/white-papers", type: "paper" },
  { host: "perspectiveapi.com", path: "/research", type: "paper" },
  { host: "sre.google", path: "/sre-book", type: "paper" },
  // Tools, products and their docs
  { host: "github.com", type: "tool" },
  { host: "gitlab.com", type: "tool" },
  { host: "pypi.org", type: "tool" },
  { host: "npmjs.com", type: "tool" },
  { host: "kubernetes.io", type: "tool" },
  { host: "gvisor.dev", type: "tool" },
  { host: "promptfoo.dev", type: "tool" },
  // Community write-ups hosted on GitHub
  { host: "github.com", path: "/precize/", type: "blog" },
  { host: "github.com", path: "/bf/", type: "blog" },
];

/** Path / host shapes that mean "article" whatever the site (checked after `TYPE_RULES` paths). */
const BLOG_PATH = /\/(blog|blogs|news|posts?|p|bliki|learn\/blog)\//;
const BLOG_HOST = /^(blog|labs)\./;

/**
 * Display titles for a few standards whose data titles are editorial labels (they describe why
 * the link is cited, not what the document is called). Used for the title and the citation;
 * the data titles still show under "also cited as".
 */
const CANONICAL_TITLES: Record<string, string> = {
  "https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations":
    "OWASP Agentic AI – Threats and Mitigations",
  "https://genai.owasp.org/resource/multi-agentic-system-threat-modeling-guide-v1-0":
    "OWASP Multi-Agentic System Threat Modeling Guide v1.0",
  "https://owaspai.org/docs/ai_security_overview": "OWASP AI Exchange: AI Security Overview",
  "https://oecd.org/going-digital/ai/principles": "OECD AI Principles",
  "https://gdpr.eu/article-32-security-of-processing": "GDPR Article 32: Security of processing",
  "https://cheatsheetseries.owasp.org/cheatsheets/cross_site_scripting_prevention_cheat_sheet.html":
    "OWASP Cross Site Scripting Prevention Cheat Sheet",
  "https://csrc.nist.gov/pubs/sp/800/61/r2/final":
    "NIST SP 800-61 Rev. 2: Computer Security Incident Handling Guide",
  "https://kubernetes.io/docs/concepts/security": "Kubernetes documentation: Security",
};

/** Publisher names for citations, by host suffix (longest match wins). */
const PUBLISHERS: readonly { host: string; path?: string; name: string }[] = [
  { host: "owasp.org", name: "OWASP Foundation" },
  { host: "owaspai.org", name: "OWASP Foundation" },
  { host: "owaspsamm.org", name: "OWASP Foundation" },
  { host: "github.com", path: "/owasp/", name: "OWASP Foundation" },
  { host: "github.com", path: "/genai-security-project/", name: "OWASP Foundation" },
  { host: "cyclonedx.org", name: "OWASP CycloneDX" },
  { host: "nist.gov", name: "National Institute of Standards and Technology (NIST)" },
  { host: "iso.org", name: "International Organization for Standardization (ISO)" },
  { host: "w3.org", name: "World Wide Web Consortium (W3C)" },
  { host: "ietf.org", name: "Internet Engineering Task Force (IETF)" },
  { host: "mitre.org", name: "The MITRE Corporation" },
  { host: "cisa.gov", name: "Cybersecurity and Infrastructure Security Agency (CISA)" },
  { host: "enisa.europa.eu", name: "European Union Agency for Cybersecurity (ENISA)" },
  { host: "eur-lex.europa.eu", name: "Publications Office of the European Union" },
  { host: "oecd.org", name: "OECD" },
  { host: "standards.ieee.org", name: "IEEE Standards Association" },
  { host: "openid.net", name: "OpenID Foundation" },
  { host: "slsa.dev", name: "OpenSSF" },
  { host: "spdx.github.io", name: "SPDX" },
  { host: "spiffe.io", name: "SPIFFE" },
  { host: "modelcontextprotocol.io", name: "Model Context Protocol" },
  { host: "a2a-protocol.org", name: "A2A Protocol" },
];

// ── URL helpers ────────────────────────────────────────────────────────────────

/** True for absolute http(s) URLs — the only ones the page renders as links. */
export function isWebUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Old CSRC publication URLs → the current `/pubs/...` scheme so both spellings merge. */
function canonicalCsrcPath(path: string): string {
  const m = path.match(/^\/publications\/detail\/sp\/(\d+)-(\d+)(?:\/rev-(\d+))?\/final$/);
  if (!m) return path;
  return `/pubs/sp/${m[1]}/${m[2]}${m[3] ? `/r${m[3]}` : ""}/final`;
}

/**
 * De-duplication key: https, no `www.`, lower-case, no trailing slash, no fragment, no
 * `utm_*`/`ref` params, old CSRC paths rewritten. Unparseable input is trimmed and lower-cased.
 */
export function normalizeUrl(url: string): string {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return url.trim().toLowerCase();
  }
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  let path = u.pathname.replace(/\/+$/, "") || "";
  if (host === "csrc.nist.gov") path = canonicalCsrcPath(path.toLowerCase());
  const params = [...u.searchParams.entries()]
    .filter(([k]) => !/^utm_/i.test(k) && k.toLowerCase() !== "ref")
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";
  return `https://${host}${path}${query}`.toLowerCase();
}

/** Hostname without `www.` ("" when the URL does not parse). */
export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Text domain label; GitHub links include the owner ("github.com/OWASP"). */
export function domainLabel(url: string): string {
  const host = hostOf(url);
  if (!host) return "unknown source";
  if (host === "github.com") {
    const owner = new URL(url).pathname.split("/").filter(Boolean)[0];
    if (owner) return `github.com/${owner}`;
  }
  return host;
}

function matchRule<T extends { host: string; path?: string }>(
  rules: readonly T[],
  url: string,
): T | undefined {
  const host = hostOf(url);
  if (!host) return undefined;
  let path = "/";
  try {
    path = `${new URL(url).pathname.toLowerCase().replace(/\/+$/, "")}/`;
  } catch {
    /* keep "/" */
  }
  let best: T | undefined;
  let bestScore = -1;
  for (const r of rules) {
    const hostOk = host === r.host || host.endsWith(`.${r.host}`);
    if (!hostOk) continue;
    if (r.path && !path.startsWith(r.path)) continue;
    const score = r.host.length + (r.path ? 1000 + r.path.length : 0);
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Infer a link's type. Precedence: exact-URL override → host+path rule → blog-shaped path or
 * host → host rule → `.pdf` (paper) → blog.
 */
export function inferReferenceType(url: string): ReferenceType {
  const key = normalizeUrl(url);
  const exact = TYPE_BY_URL[key];
  if (exact) return exact;
  const rule = matchRule(TYPE_RULES, url);
  if (rule?.path) return rule.type;
  const host = hostOf(url);
  let path = "";
  try {
    path = `${new URL(url).pathname.toLowerCase()}`;
  } catch {
    /* keep "" */
  }
  if (BLOG_HOST.test(host) || BLOG_PATH.test(path)) return "blog";
  if (rule) return rule.type;
  if (path.endsWith(".pdf")) return "paper";
  return "blog";
}

/** Publisher used in citations (falls back to the domain label). */
export function publisherOf(url: string): string {
  return matchRule(PUBLISHERS, url)?.name ?? domainLabel(url);
}

// ── Index ──────────────────────────────────────────────────────────────────────

export interface RawCitation {
  url: string;
  title: string;
  citation: Citation;
}

function collectRawCitations(): RawCitation[] {
  const raw: RawCitation[] = [];
  for (const t of Object.values(threatsData)) {
    for (const r of t.references ?? []) {
      raw.push({
        url: r.url,
        title: r.title,
        citation: {
          kind: "threat",
          id: t.id,
          code: t.code,
          name: t.name,
          href: `/threats/${t.id}`,
        },
      });
    }
  }
  for (const m of Object.values(mitigationsData)) {
    for (const r of m.references ?? []) {
      raw.push({
        url: r.url,
        title: r.title,
        citation: {
          kind: "control",
          id: m.id,
          code: m.id.toUpperCase(),
          name: m.name,
          href: `/controls/${m.id}`,
        },
      });
    }
  }
  for (const ch of Object.values(aisvsData)) {
    for (const r of ch.references ?? []) {
      raw.push({
        url: r.url,
        title: r.title,
        citation: {
          kind: "aisvs",
          id: ch.code,
          code: ch.code,
          name: ch.name,
          href: `/aisvs#${ch.code}`,
        },
      });
    }
    for (const sub of ch.subCategories ?? []) {
      for (const req of sub.requirements ?? []) {
        for (const r of req.references ?? []) {
          raw.push({
            url: r.url,
            title: r.title,
            citation: {
              kind: "aisvs",
              id: req.id,
              code: req.id,
              name: req.title,
              href: `/aisvs#${req.id}`,
            },
          });
        }
      }
    }
  }
  for (const e of agenticTop10Data) {
    for (const r of e.references ?? []) {
      raw.push({
        url: r.url,
        title: r.title,
        citation: {
          kind: "asi",
          id: e.id,
          code: e.code,
          name: e.name,
          href: `/taxonomy?tab=owasp-agentic&entry=${encodeURIComponent(e.code)}`,
        },
      });
    }
  }
  return raw;
}

/** Lower is better: plain http and legacy CSRC paths lose to their current spelling. */
function spellingRank(url: string): number {
  let rank = 0;
  if (/^http:/i.test(url)) rank += 1;
  if (/csrc\.nist\.gov\/publications\/detail\//i.test(url)) rank += 1;
  return rank;
}

/** Merge raw citations into one entry per document. Exported for tests. */
export function buildReferenceIndex(raw: readonly RawCitation[]): ReferenceEntry[] {
  const byKey = new Map<string, ReferenceEntry & { titles: string[] }>();
  for (const { url, title, citation } of raw) {
    const cleanUrl = url.trim();
    const key = normalizeUrl(cleanUrl);
    const cleanTitle = title.trim();
    let entry = byKey.get(key);
    if (!entry) {
      entry = {
        key,
        url: cleanUrl,
        title: cleanTitle,
        alsoCitedAs: [],
        variants: [],
        host: hostOf(cleanUrl),
        domain: domainLabel(cleanUrl),
        type: inferReferenceType(cleanUrl),
        citedBy: [],
        titles: [],
      };
      byKey.set(key, entry);
    } else if (cleanUrl !== entry.url && !entry.variants.includes(cleanUrl)) {
      // Show the preferred spelling (https, current CSRC scheme); keep the other as a variant.
      if (spellingRank(cleanUrl) < spellingRank(entry.url)) {
        entry.variants.push(entry.url);
        entry.url = cleanUrl;
      } else entry.variants.push(cleanUrl);
    }
    if (cleanTitle && !entry.titles.includes(cleanTitle)) entry.titles.push(cleanTitle);
    if (!entry.citedBy.some((c) => c.kind === citation.kind && c.id === citation.id)) {
      entry.citedBy.push(citation);
    }
  }
  const kindOrder: Record<CitingKind, number> = { asi: 0, threat: 1, control: 2, aisvs: 3 };
  return [...byKey.values()].map(({ titles, ...entry }) => {
    // Most descriptive data title wins unless a canonical title is on file.
    const longest = [...titles].sort((a, b) => b.length - a.length)[0] ?? entry.url;
    const title = CANONICAL_TITLES[entry.key] ?? longest;
    return {
      ...entry,
      title,
      alsoCitedAs: titles.filter((t) => t !== title),
      citedBy: [...entry.citedBy].sort(
        (a, b) =>
          kindOrder[a.kind] - kindOrder[b.kind] ||
          a.code.localeCompare(b.code, undefined, { numeric: true }),
      ),
    };
  });
}

/** Every distinct reference in the app's data, A–Z by title. */
export const REFERENCES: readonly ReferenceEntry[] = buildReferenceIndex(
  collectRawCitations(),
).sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));

/** Total citations before de-duplication (one per citing item per link). */
export const CITATION_COUNT: number = REFERENCES.reduce((n, r) => n + r.citedBy.length, 0);

// ── Citations ──────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Plain-text citation: `Publisher. "Title." URL (accessed YYYY-MM-DD).` */
export function formatCitation(entry: ReferenceEntry, accessed = new Date()): string {
  const publisher = publisherOf(entry.url);
  const title = entry.title.replace(/[.\s]+$/, "");
  return `${publisher}. "${title}." ${entry.url} (accessed ${formatDate(accessed)}).`;
}

function bibEscape(s: string): string {
  return s.replace(/([&%#_$])/g, "\\$1");
}

/** BibTeX key: first word of the publisher's short form + first title words, e.g. `owasp_top10`. */
export function bibtexKey(entry: ReferenceEntry): string {
  const words = entry.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !["the", "a", "an", "of", "for", "and", "to", "in", "on"].includes(w));
  return words.slice(0, 4).join("_").replace(/_+/g, "_") || "ref";
}

/** `@misc` BibTeX entry for the reference. */
export function formatBibtex(entry: ReferenceEntry, accessed = new Date()): string {
  return [
    `@misc{${bibtexKey(entry)},`,
    `  title        = {{${bibEscape(entry.title)}}},`,
    `  author       = {{${bibEscape(publisherOf(entry.url))}}},`,
    `  howpublished = {\\url{${entry.url}}},`,
    `  note         = {Accessed: ${formatDate(accessed)}}`,
    `}`,
  ].join("\n");
}

// ── Filtering ──────────────────────────────────────────────────────────────────

export interface ReferenceFilters {
  query: string;
  type: ReferenceType | null;
  citedBy: CitingKind | null;
}

/** Case-insensitive match on title, alternate titles, domain, URL and citing codes/names. */
export function referenceMatches(entry: ReferenceEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (entry.title.toLowerCase().includes(q)) return true;
  if (entry.domain.toLowerCase().includes(q) || entry.url.toLowerCase().includes(q)) return true;
  if (entry.alsoCitedAs.some((t) => t.toLowerCase().includes(q))) return true;
  return entry.citedBy.some((c) => c.code.toLowerCase() === q || c.name.toLowerCase().includes(q));
}

export function filterReferences(
  entries: readonly ReferenceEntry[],
  { query, type, citedBy }: ReferenceFilters,
): ReferenceEntry[] {
  return entries.filter(
    (e) =>
      (!type || e.type === type) &&
      (!citedBy || e.citedBy.some((c) => c.kind === citedBy)) &&
      referenceMatches(e, query),
  );
}
