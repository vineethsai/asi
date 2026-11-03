#!/usr/bin/env node
/**
 * Data integrity checks for the site's datasets (`npm run check:data`).
 *
 * Errors fail the run; warnings are printed but do not. Warnings that name a
 * file outside the data modules (pages, the threat modeler, …) mark consumers
 * that still use identifiers which no longer exist in the current data.
 *
 *   npm run check:data                    # offline checks
 *   npm run check:data -- --check-links   # also HEAD/GET every reference URL (404/410 are errors;
 *                                         # timeouts, blocks and 5xx are warnings). Run weekly by
 *                                         # .github/workflows/weekly-links.yml
 *
 * `loadTsModule` is exported for scripts/print-counts.mjs.
 */

import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath, pathToFileURL } from "url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const projectRoot = path.join(__dirname, "..");

const errors = [];
const warnings = [];
const notes = [];
const collectedReferenceUrls = [];

const args = new Set(process.argv.slice(2));
const shouldCheckLinks = args.has("--check-links");

const TODAY = new Date();
const RETRIEVED_MAX_MONTHS = 12;
const LAST_UPDATED_MAX_MONTHS = 18;

/** Project homepages that are legitimately cited without a path. */
const BARE_DOMAIN_ALLOWLIST = new Set([
  "attack.mitre.org",
  "owaspsamm.org",
  "partnershiponai.org",
  "slsa.dev",
  "arize.com",
  "robustbench.github.io",
  "aivss.owasp.org",
  "genai.owasp.org",
]);

function addError(message) {
  errors.push(message);
}

function addWarning(message) {
  warnings.push(message);
}

function addNote(message) {
  notes.push(message);
}

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function loadJson(relativePath) {
  return JSON.parse(readFile(relativePath));
}

// ── Module loader ──────────────────────────────────────────────────────────
// Transpiles TS/TSX to CommonJS and evaluates it in one shared VM realm,
// resolving relative and "@/" imports (and JSON) the way Vite does. Bare
// package imports are rejected: data modules must not depend on runtime
// packages.

const moduleCache = new Map();
const RESOLVE_SUFFIXES = [
  "",
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  "/index.ts",
  "/index.tsx",
  "/index.js",
];
let sharedContext;

function resolveSpecifier(specifier, fromFile) {
  let base;
  if (specifier.startsWith("@/")) base = path.join(projectRoot, "src", specifier.slice(2));
  else if (specifier.startsWith(".")) base = path.resolve(path.dirname(fromFile), specifier);
  else {
    throw new Error(
      `Unsupported package import "${specifier}" while loading ${path.relative(projectRoot, fromFile)}`,
    );
  }
  for (const suffix of RESOLVE_SUFFIXES) {
    const candidate = base + suffix;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  throw new Error(`Cannot resolve "${specifier}" from ${path.relative(projectRoot, fromFile)}`);
}

function loadModuleAbsolute(absolutePath) {
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  if (absolutePath.endsWith(".json")) {
    const module = { exports: JSON.parse(fs.readFileSync(absolutePath, "utf8")) };
    moduleCache.set(absolutePath, module);
    return module.exports;
  }

  const source = fs.readFileSync(absolutePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true,
    },
    fileName: absolutePath,
  });

  const module = { exports: {} };
  moduleCache.set(absolutePath, module); // set before evaluation so import cycles resolve like CJS

  sharedContext ??= vm.createContext({ console, process, Buffer, URL, setTimeout, clearTimeout });
  const wrapper = vm.runInContext(
    `(function (exports, require, module, __filename, __dirname) {${outputText}\n})`,
    sharedContext,
    { filename: absolutePath },
  );
  const localRequire = (specifier) => loadModuleAbsolute(resolveSpecifier(specifier, absolutePath));
  wrapper(module.exports, localRequire, module, absolutePath, path.dirname(absolutePath));
  return module.exports;
}

/** Load a project TS module (path relative to the project root) and return its exports. */
export function loadTsModule(relativePath) {
  return loadModuleAbsolute(path.join(projectRoot, relativePath));
}

// ── Helpers ────────────────────────────────────────────────────────────────

function unique(values) {
  return [...new Set(values)];
}

function listDuplicates(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function formatDuplicates(duplicates) {
  return duplicates.map(({ value, count }) => `${value} (x${count})`).join(", ");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function ensure(condition, message) {
  if (!condition) {
    addError(message);
  }
}

function warnIf(condition, message) {
  if (condition) {
    addWarning(message);
  }
}

function ensureIdFormat(owner, value, regex, label) {
  ensure(regex.test(String(value || "")), `${owner} has invalid ${label}: ${String(value)}`);
}

function monthsSince(isoDate) {
  const then = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(then.getTime())) return NaN;
  return (TODAY.getTime() - then.getTime()) / (1000 * 60 * 60 * 24 * 30.4375);
}

function ensureIsoDate(owner, value, field = "lastUpdated") {
  if (value == null || value === "") return;
  ensure(
    /^\d{4}-\d{2}-\d{2}$/.test(String(value)),
    `${owner} has invalid ${field} date (expected YYYY-MM-DD): ${value}`,
  );
  if (field === "lastUpdated") {
    const months = monthsSince(String(value));
    warnIf(
      months > LAST_UPDATED_MAX_MONTHS,
      `${owner} lastUpdated ${value} is more than ${LAST_UPDATED_MAX_MONTHS} months old`,
    );
  }
}

function isValidHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isBareDomainUrl(url) {
  try {
    const parsed = new URL(url);
    return (parsed.pathname === "/" || parsed.pathname === "") && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

/**
 * @param {{ upstream?: boolean }} options upstream=true for text copied verbatim
 *   from a standard (AISVS chapter references): style issues become notes.
 */
function collectReference(owner, reference, index, options = {}) {
  if (!reference || typeof reference !== "object") {
    addError(`${owner} reference[${index}] is not an object`);
    return;
  }

  const title = String(reference.title || "").trim();
  const url = String(reference.url || "").trim();

  ensure(title.length > 0, `${owner} reference[${index}] is missing title`);
  ensure(url.length > 0, `${owner} reference[${index}] is missing url`);
  ensure(
    !/\$[A-Z]+\$/.test(title),
    `${owner} reference[${index}] title has a template placeholder: ${title}`,
  );

  if (url.length > 0) {
    ensure(isValidHttpUrl(url), `${owner} reference[${index}] has invalid URL: ${url}`);
    warnIf(
      url.startsWith("http://"),
      `${owner} reference[${index}] uses insecure HTTP URL: ${url}`,
    );
    warnIf(
      /[),.;\]}]$/.test(url),
      `${owner} reference[${index}] URL may include trailing punctuation: ${url}`,
    );
    if (
      isBareDomainUrl(url) &&
      !BARE_DOMAIN_ALLOWLIST.has(new URL(url).hostname.replace(/^www\./, ""))
    ) {
      if (options.upstream) bareDomainUpstream.push(`${owner}: ${url}`);
      else
        addWarning(
          `${owner} reference[${index}] is a bare-domain URL (cite the specific page): ${url}`,
        );
    }
    collectedReferenceUrls.push({ owner, title, url });
  }
}
const bareDomainUpstream = [];

function validateReferences(owner, references, options = {}) {
  if (references == null) return;

  ensure(Array.isArray(references), `${owner} references must be an array`);
  if (!Array.isArray(references)) return;

  if (references.length === 0 && !options.allowEmpty) {
    addWarning(`${owner} has an empty references array`);
  }

  references.forEach((reference, index) => collectReference(owner, reference, index, options));

  const duplicateTitles = listDuplicates(
    references
      .map((ref) => (ref && typeof ref === "object" ? String(ref.title || "").trim() : ""))
      .filter(Boolean),
  );

  if (duplicateTitles.length > 0) {
    addWarning(`${owner} has duplicate reference titles: ${formatDuplicates(duplicateTitles)}`);
  }
}

/** Readable label for an array item in a trail: its id / code when it has one, else its index. */
function itemLabel(item, index) {
  const id = item && typeof item === "object" ? (item.id ?? item.code) : undefined;
  return typeof id === "string" || typeof id === "number" ? String(id) : String(index);
}

/**
 * Error on markdown bold (`**`) in any `description` field under `value` (long-form markdown belongs in
 * `implementationDetail` only). `file` is the data module the value came from, so the message says where to fix it.
 */
function checkNoMarkdownInDescriptions(owner, value, trail = "", file = "") {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      checkNoMarkdownInDescriptions(owner, item, `${trail}[${itemLabel(item, index)}]`, file),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (key === "description" && typeof child === "string") {
      ensure(
        !child.includes("**"),
        `${file ? `${file}: ` : ""}${owner}${trail}.description contains markdown "**"`,
      );
    } else if (child && typeof child === "object") {
      checkNoMarkdownInDescriptions(owner, child, `${trail}.${key}`, file);
    }
  }
}

function collectComponentIds(nodes, ids = [], nodeThreatRefs = []) {
  for (const node of safeArray(nodes)) {
    if (!node || typeof node !== "object") continue;
    const id = String(node.id || "")
      .trim()
      .toLowerCase();
    if (id) ids.push(id);

    const threatIds = safeArray(node.threatIds).map((threatId) => String(threatId));
    if (threatIds.length > 0) {
      nodeThreatRefs.push({ id, threatIds });
    }

    collectComponentIds(node.children, ids, nodeThreatRefs);
  }

  return { ids, nodeThreatRefs };
}

/**
 * Component <-> threat links must agree in both directions. `threatsData[t].componentIds` is the
 * source of truth: a threat linked to a node applies to that node and to every sub-component under
 * it (threats are mapped at KC level, e.g. T1 -> KC4 covers KC4.1-KC4.6), and a node also lists the
 * threats linked to its sub-components. So for every node in frameworkData:
 *
 *   node.threatIds == { t | t.componentIds contains the node, an ancestor of it, or a descendant of it }
 */
function checkComponentThreatLinks(frameworkData, threatsData) {
  const nodes = []; // { id, ancestors: string[], descendants: string[], threatIds: string[] }
  const visit = (list, ancestors) => {
    const ids = [];
    for (const node of safeArray(list)) {
      if (!node || typeof node !== "object") continue;
      const id = String(node.id || "")
        .trim()
        .toLowerCase();
      const entry = {
        id,
        ancestors,
        descendants: [],
        threatIds: safeArray(node.threatIds).map(String),
      };
      nodes.push(entry);
      const below = visit(node.children, [...ancestors, id]);
      entry.descendants = below;
      ids.push(id, ...below);
    }
    return ids;
  };
  visit(frameworkData, []);

  const threatComponents = Object.entries(threatsData).map(([threatId, threat]) => ({
    threatId,
    componentIds: new Set(safeArray(threat?.componentIds).map((id) => String(id).toLowerCase())),
  }));

  for (const node of nodes) {
    if (!node.id) continue;
    const related = [node.id, ...node.ancestors, ...node.descendants];
    const expected = new Set(
      threatComponents
        .filter((t) => related.some((id) => t.componentIds.has(id)))
        .map((t) => t.threatId),
    );
    const actual = new Set(node.threatIds);
    for (const threatId of expected) {
      ensure(
        actual.has(threatId),
        `Component ${node.id} is missing threatId ${threatId} (threat ${threatId} lists ${node.id} or a parent/child of it in componentIds)`,
      );
    }
    for (const threatId of actual) {
      if (!(threatId in threatsData)) continue; // reported as an unknown threatId elsewhere
      ensure(
        expected.has(threatId),
        `Component ${node.id} lists threatId ${threatId} but threat ${threatId} componentIds does not include ${node.id} or a parent/child of it (add it to the threat's componentIds or drop it from the component)`,
      );
    }
  }
}

function parseNistAisvsMappings(nistSource) {
  const results = [];
  const pattern = /aisvsMapping:\s*\[((?:.|\n)*?)\]/g;
  let match;

  while ((match = pattern.exec(nistSource)) !== null) {
    const block = match[1];
    const line = nistSource.slice(0, match.index).split("\n").length;
    const codes = [...block.matchAll(/"(C\d+)"/g)].map((entry) => entry[1]);
    results.push({ line, codes });
  }

  return results;
}

function flattenAisvs(aisvsData) {
  const categories = [];
  const subCategories = [];
  const requirements = [];

  for (const [categoryId, category] of Object.entries(safeObject(aisvsData))) {
    categories.push({ categoryId, category });
    for (const subCategory of safeArray(category.subCategories)) {
      subCategories.push({ categoryId, category, subCategory });
      for (const requirement of safeArray(subCategory.requirements)) {
        requirements.push({ categoryId, category, subCategory, requirement });
      }
    }
  }

  return { categories, subCategories, requirements };
}

function requireObject(name, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${name} is missing or not an object`);
  }
  return value;
}

function requireArray(name, value) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} is missing or not an array`);
  }
  return value;
}

function listSourceFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") listSourceFiles(full, out);
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Hosts whose deep links are client-routed and always answer scripts with HTTP 404 (verified in a browser). */
const SPA_404_HOSTS = new Set(["atlas.mitre.org"]);

/**
 * HEAD (then GET) every reference URL, sequentially. 404/410 are errors (the page is gone: fix or remove the
 * citation); timeouts, 403/429 and 5xx stay warnings because they are often bot blocks or transient.
 * `ownersByUrl` maps a URL to the entries that cite it, so the report says what to fix.
 */
async function checkLinkReachability(urls, ownersByUrl = new Map()) {
  const uniqueUrls = unique(urls);
  let checked = 0;
  let broken = 0;
  let unverified = 0;

  const citedBy = (url) => {
    const owners = unique(ownersByUrl.get(url) ?? []);
    if (owners.length === 0) return "";
    return ` (cited by ${owners.slice(0, 3).join(", ")}${owners.length > 3 ? `, +${owners.length - 3} more` : ""})`;
  };

  const checkSingle = async (url) => {
    const timeoutMs = 10000;

    const fetchWithTimeout = async (targetUrl, init) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        return await fetch(targetUrl, { ...init, signal: controller.signal, redirect: "follow" });
      } finally {
        clearTimeout(timer);
      }
    };

    try {
      let response = await fetchWithTimeout(url, { method: "HEAD" });
      if (!response.ok && [400, 401, 403, 404, 405, 500, 501].includes(response.status)) {
        response = await fetchWithTimeout(url, { method: "GET" });
      }

      if ([404, 410].includes(response.status) && SPA_404_HOSTS.has(new URL(url).hostname)) {
        unverified += 1;
        addWarning(
          `Link check failed (${response.status}) for ${url}${citedBy(url)} (single-page app that answers scripts with 404; open it in a browser)`,
        );
      } else if ([404, 410].includes(response.status)) {
        broken += 1;
        addError(`Broken link (${response.status}) ${url}${citedBy(url)}`);
      } else if (!response.ok) {
        unverified += 1;
        addWarning(`Link check failed (${response.status}) for ${url}${citedBy(url)}`);
      }
    } catch (error) {
      unverified += 1;
      addWarning(`Link check could not verify ${url}: ${error.message}${citedBy(url)}`);
    } finally {
      checked += 1;
      if (checked % 50 === 0) {
        addNote(`Link reachability progress: ${checked}/${uniqueUrls.length}`);
      }
    }
  };

  for (const url of uniqueUrls) {
    // Sequential to avoid accidental rate-limiting and noisy failures.
    await checkSingle(url);
  }
  addNote(
    `Link check: ${uniqueUrls.length} unique URLs, ${broken} broken (404/410), ${unverified} unverified (timeouts, blocks, 5xx)`,
  );
}

// ── Expected values from the primary sources (see src/data/sources.ts) ──────
const EXPECTED = {
  /** OWASP Agentic AI Threats & Mitigations v1.1: T1–T17. */
  threatCodes: Array.from({ length: 17 }, (_, i) => `T${i + 1}`),
  aisvs: { version: "1.01", chapters: 12 },
  cisco: { version: "2.0.0", objectives: 19, techniques: 44, subTechniques: 130 },
  /** AIUC-1 Q4-2026: 55 requirement ids, 5 retired (C011, C012, D002, E007, E014). */
  aiuc1: { ids: 55, active: 50 },
  nistSubcategories: 72,
};

const THREAT_MODULE = "src/components/components/securityData.ts";
const FRAMEWORK_MODULE = "src/components/components/frameworkData.ts";
const ARCHITECTURE_MODULE = "src/components/components/architecturesData.ts";
const COMPONENT_MAP_MODULE = "src/components/components/componentDataMap.ts";
const TOP10_MODULE = "src/components/components/owaspAgenticTop10Data.ts";
const KC_MODULE = "src/data/kc.ts";
const ICON_MODULE = "src/lib/icons.ts";

function checkAisvs(aisvsGenerated, aisvsModule) {
  const generated = requireObject("aisvs (generated)", aisvsGenerated);
  const owner = "AISVS generated data";
  ensure(
    String(generated.version) === EXPECTED.aisvs.version,
    `${owner} version is ${generated.version}; expected ${EXPECTED.aisvs.version}`,
  );
  ensureIsoDate(owner, generated.retrievedAt, "retrievedAt");
  ensure(isValidHttpUrl(String(generated.sourceUrl || "")), `${owner} has invalid sourceUrl`);
  ensure(
    /^[0-9a-f]{40}$/.test(String(generated.sourceCommit || "")),
    `${owner} sourceCommit is not a full git SHA`,
  );
  const chapters = safeArray(generated.chapters);
  ensure(
    chapters.length === EXPECTED.aisvs.chapters,
    `${owner} has ${chapters.length} chapters; expected ${EXPECTED.aisvs.chapters}`,
  );

  const seen = [];
  chapters.forEach((chapter, index) => {
    const chOwner = `AISVS chapter ${chapter.code}`;
    ensure(chapter.code === `C${index + 1}`, `${chOwner} is out of order (position ${index + 1})`);
    ensure(chapter.number === index + 1, `${chOwner} has number ${chapter.number}`);
    ensure(String(chapter.name || "").trim().length > 0, `${chOwner} is missing name`);
    ensure(
      String(chapter.description || "").trim().length > 0,
      `${chOwner} is missing control objective`,
    );
    ensure(safeArray(chapter.sections).length > 0, `${chOwner} has no sections`);
    for (const section of safeArray(chapter.sections)) {
      const sOwner = `AISVS section ${section.code}`;
      ensureIdFormat(sOwner, section.code, new RegExp(`^${chapter.code}\\.\\d+$`), "code");
      ensure(String(section.name || "").trim().length > 0, `${sOwner} is missing name`);
      const reqs = safeArray(section.requirements);
      ensure(
        reqs.length > 0 || safeArray(section.removed).length > 0,
        `${sOwner} has no requirements`,
      );
      for (const req of reqs) {
        const rOwner = `AISVS requirement ${req.id}`;
        ensureIdFormat(
          rOwner,
          req.id,
          new RegExp(`^${section.code.replace(".", "\\.")}\\.\\d+$`),
          "id",
        );
        ensure([1, 2, 3].includes(Number(req.level)), `${rOwner} has invalid level: ${req.level}`);
        ensure(
          /^Verify that\b/.test(String(req.text || "")),
          `${rOwner} text does not start with "Verify that"`,
        );
        seen.push(req.id);
      }
      for (const removed of safeArray(section.removed)) {
        ensure(!reqs.some((r) => r.id === removed), `AISVS ${removed} is both removed and present`);
      }
    }
    validateReferences(chOwner, chapter.references, { upstream: true, allowEmpty: true });
  });
  const dupes = listDuplicates(seen);
  ensure(dupes.length === 0, `Duplicate AISVS requirement ids: ${formatDuplicates(dupes)}`);

  // Adapter (aisvsData shape consumed by the pages).
  const aisvsData = requireObject("aisvsData", aisvsModule.aisvsData);
  const { categories, subCategories, requirements } = flattenAisvs(aisvsData);
  for (const { categoryId, category } of categories) {
    const cOwner = `AISVS category ${categoryId}`;
    ensure(
      category.id === categoryId && category.code === categoryId,
      `${cOwner} has mismatched id/code`,
    );
    ensureIdFormat(cOwner, category.id, /^C\d+$/, "id");
    ensure(String(category.icon || "").length > 0, `${cOwner} is missing icon`);
    ensure(
      category.requirementCount ===
        safeArray(category.subCategories).reduce((n, s) => n + safeArray(s.requirements).length, 0),
      `${cOwner} requirementCount does not match its requirements`,
    );
  }
  for (const { category, subCategory } of subCategories) {
    ensureIdFormat(`AISVS subcategory ${subCategory.id}`, subCategory.id, /^C\d+\.\d+$/, "id");
    ensure(
      String(subCategory.id).startsWith(`${category.code}.`),
      `AISVS subcategory ${subCategory.id} does not belong to ${category.code}`,
    );
  }
  for (const { categoryId, subCategory, requirement } of requirements) {
    const rOwner = `AISVS requirement ${requirement.id}`;
    ensureIdFormat(rOwner, requirement.id, /^C\d+\.\d+\.\d+$/, "id");
    ensure(
      requirement.code === String(requirement.id).slice(1),
      `${rOwner} code mismatch: ${requirement.code}`,
    );
    ensure(requirement.section === subCategory.id, `${rOwner} section mismatch`);
    ensure(requirement.category === categoryId, `${rOwner} category mismatch`);
    ensure(
      requirement.citation === `v${EXPECTED.aisvs.version}-${requirement.id}`,
      `${rOwner} citation mismatch: ${requirement.citation}`,
    );
    ensure(String(requirement.title || "").trim().length > 0, `${rOwner} is missing title`);
    ensure(
      requirement.text === requirement.description,
      `${rOwner} description must equal official text`,
    );
    // Per-requirement references are intentionally empty (AISVS 1.01 lists references per chapter).
  }
  ensure(
    aisvsModule.aisvsStats?.requirements === requirements.length &&
      requirements.length === seen.length,
    `aisvsStats.requirements (${aisvsModule.aisvsStats?.requirements}) does not match data (${requirements.length})`,
  );

  const chapterSet = new Set(categories.map(({ categoryId }) => categoryId));
  const sectionSet = new Set(subCategories.map(({ subCategory }) => subCategory.id));
  const requirementSet = new Set(requirements.map(({ requirement }) => requirement.id));
  const removedSet = new Set(
    chapters.flatMap((c) => safeArray(c.sections).flatMap((s) => safeArray(s.removed))),
  );
  return {
    chapterSet,
    sectionSet,
    requirementSet,
    removedSet,
    categories,
    subCategories,
    requirements,
  };
}

/** Warn on AISVS codes written anywhere in src/ that do not exist in the current version. */
function scanSourceForAisvsCodes(aisvs) {
  const skip = new Set([path.join(projectRoot, "src/data/aisvs.generated.ts")]);
  const isKnown = (code) =>
    aisvs.chapterSet.has(code) || aisvs.sectionSet.has(code) || aisvs.requirementSet.has(code);
  const patterns = [
    // Quoted chapter / section / requirement codes: "C13", 'C9.4', `C10.2.6`
    { re: /["'`](C\d{1,2}(?:\.\d{1,2}){0,2})["'`]/g, map: (m) => m[1] },
    // Unquoted requirement codes in prose or comments: C10.2.6
    { re: /(?<![\w.-])(C\d{1,2}\.\d{1,2}\.\d{1,2})(?![\w.])/g, map: (m) => m[1] },
    // Tags such as "aisvs-c13"
    { re: /aisvs-c(\d{1,2})\b/gi, map: (m) => `C${m[1]}` },
    // Citations such as v1.01-C9.4.3
    { re: /\bv\d+\.\d+-(C\d{1,2}(?:\.\d{1,2}){0,2})\b/g, map: (m) => m[1] },
  ];
  const hitsByFile = new Map();
  for (const file of listSourceFiles(path.join(projectRoot, "src"))) {
    if (skip.has(file)) continue;
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      const found = new Set();
      for (const { re, map } of patterns) {
        for (const m of line.matchAll(re)) found.add(map(m));
      }
      for (const code of found) {
        if (isKnown(code)) continue;
        const why = aisvs.removedSet.has(code) ? "removed upstream" : "not in AISVS 1.01";
        const rel = path.relative(projectRoot, file);
        if (!hitsByFile.has(rel)) hitsByFile.set(rel, []);
        hitsByFile.get(rel).push(`${i + 1}:${code} (${why})`);
      }
    });
  }
  for (const [file, hits] of hitsByFile) {
    addWarning(
      `${file} references AISVS codes that do not exist in ${EXPECTED.aisvs.version}: ${hits.slice(0, 25).join(", ")}${
        hits.length > 25 ? ` … (+${hits.length - 25} more)` : ""
      }`,
    );
  }
  return [...hitsByFile.values()].reduce((n, h) => n + h.length, 0);
}

function checkSources(sources) {
  for (const [key, src] of Object.entries(safeObject(sources))) {
    const owner = `SOURCES.${key}`;
    ensure(String(src?.name || "").trim().length > 0, `${owner} is missing name`);
    ensure(String(src?.version || "").trim().length > 0, `${owner} is missing version`);
    ensure(isValidHttpUrl(String(src?.url || "")), `${owner} has invalid url: ${src?.url}`);
    if (src?.dataUrl) ensure(isValidHttpUrl(String(src.dataUrl)), `${owner} has invalid dataUrl`);
    ensure(
      /^\d{4}-\d{2}-\d{2}$/.test(String(src?.retrievedAt || "")),
      `${owner} has invalid retrievedAt`,
    );
    const months = monthsSince(String(src?.retrievedAt));
    warnIf(
      months > RETRIEVED_MAX_MONTHS,
      `${owner} was retrieved ${src.retrievedAt} (more than ${RETRIEVED_MAX_MONTHS} months ago): re-check ${src.url}`,
    );
  }
}

// ── Icons, KC names and date freshness (IMPROVEMENT_PLAN.md P1-15) ───────────

/** Registry keys parsed from src/lib/icons.ts (the module imports lucide-react, so it is not loaded). */
function loadIconRegistryKeys() {
  const source = readFile(ICON_MODULE);
  const start = source.indexOf("export const ICON_REGISTRY");
  const end = source.indexOf("} as const", start);
  if (start === -1 || end === -1) throw new Error(`ICON_REGISTRY not found in ${ICON_MODULE}`);
  const keys = new Set(
    [...source.slice(start, end).matchAll(/^\s+"?([a-z0-9-]+)"?:\s+[A-Z]\w+,/gm)].map((m) => m[1]),
  );
  if (keys.size < 50) {
    throw new Error(
      `Parsed only ${keys.size} keys from ICON_REGISTRY in ${ICON_MODULE}; the regex in check-data-integrity.js no longer matches its layout`,
    );
  }
  return keys;
}

/** Same normalisation as normalizeIconKey() in src/lib/icons.ts. */
function normalizeIconKey(key) {
  return key
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/**
 * Visit every `field` string under `value` (objects and arrays, cycle-safe). `visit(value, trail)` gets a
 * readable trail such as `threatsData.t7.icon`.
 */
function collectStringFields(value, fields, visit, trail = "", seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectStringFields(item, fields, visit, `${trail}[${itemLabel(item, index)}]`, seen),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childTrail = trail ? `${trail}.${key}` : key;
    if (fields.includes(key) && typeof child === "string") visit(child, childTrail, key);
    else if (child && typeof child === "object") {
      collectStringFields(child, fields, visit, childTrail, seen);
    }
  }
}

/** Every data module whose exports are scanned for `icon` keys and dates: [file, exports]. */
function dataModulesForScan(modules) {
  return Object.entries(modules).map(([file, exports]) => [file, exports]);
}

/** P1-15: every `icon` key in the data modules resolves in ICON_REGISTRY (src/lib/icons.ts). */
function checkIconKeys(modules) {
  const registry = loadIconRegistryKeys();
  let checked = 0;
  const unknown = new Map();
  for (const [file, exports] of dataModulesForScan(modules)) {
    collectStringFields(exports, ["icon"], (key, trail) => {
      checked += 1;
      if (registry.has(key) || registry.has(normalizeIconKey(key))) return;
      if (!unknown.has(key)) unknown.set(key, []);
      unknown.get(key).push(`${file}: ${trail}`);
    });
  }
  for (const [key, where] of unknown) {
    addError(
      `Icon key "${key}" is not in ICON_REGISTRY (${ICON_MODULE}); used at ${where.slice(0, 3).join(", ")}${
        where.length > 3 ? ` (+${where.length - 3} more)` : ""
      }`,
    );
  }
  return { checked, registrySize: registry.size };
}

/** P1-15: KC1–KC6 names in src/data/kc.ts equal the official titles in frameworkData.ts. */
function checkKcNames(kcModule, frameworkData, componentDataMap) {
  const stripSuffix = (name) =>
    String(name ?? "")
      .replace(/\s*\(KC\d\)\s*$/i, "")
      .trim();
  const kc = safeObject(kcModule.KC);
  const kcIds = Object.keys(kc);
  ensure(
    kcIds.length === 6,
    `${KC_MODULE} defines ${kcIds.length} key components; expected KC1-KC6`,
  );

  const topLevel = new Map(safeArray(frameworkData).map((node) => [String(node.id), node]));
  for (const [id, entry] of Object.entries(kc)) {
    const owner = `${KC_MODULE} ${entry.code ?? id}`;
    const node = topLevel.get(String(entry.frameworkDataId ?? id));
    if (!node) {
      addError(`${owner} has no matching top-level node in ${FRAMEWORK_MODULE}`);
      continue;
    }
    const official = stripSuffix(node.title);
    ensure(
      stripSuffix(entry.name) === official,
      `${owner} name "${entry.name}" differs from the official title "${node.title}" in ${FRAMEWORK_MODULE}`,
    );
    const mapped = componentDataMap?.[id];
    if (mapped) {
      ensure(
        stripSuffix(mapped.title) === official,
        `${COMPONENT_MAP_MODULE} ${id} title "${mapped.title}" differs from the official title "${node.title}"`,
      );
    }
  }
  for (const [id, node] of topLevel) {
    if (/^kc\d$/i.test(id)) {
      ensure(
        Boolean(kc[id.toLowerCase()]),
        `${FRAMEWORK_MODULE} ${id} ("${node.title}") has no entry in ${KC_MODULE}`,
      );
    }
  }
}

/**
 * P1-15: `lastUpdated` / `retrievedAt` anywhere in the data modules must be YYYY-MM-DD and younger than
 * LAST_UPDATED_MAX_MONTHS (warnings). Threat / control / architecture `lastUpdated` and SOURCES (12 months)
 * are already checked where they are validated, so those exports are skipped here.
 */
function checkDateFreshness(modules, skip) {
  let checked = 0;
  for (const [file, exports] of dataModulesForScan(modules)) {
    const scanned = Object.fromEntries(Object.entries(exports).filter(([name]) => !skip.has(name)));
    collectStringFields(scanned, ["lastUpdated", "retrievedAt"], (value, trail, field) => {
      checked += 1;
      const where = `${file}: ${trail}`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        addWarning(`${where} is not a YYYY-MM-DD date: ${value}`);
        return;
      }
      warnIf(
        monthsSince(value) > LAST_UPDATED_MAX_MONTHS,
        `${where} (${value}) is more than ${LAST_UPDATED_MAX_MONTHS} months old`,
      );
    });
  }
  return checked;
}

async function run() {
  const securityModule = loadTsModule(THREAT_MODULE);
  const frameworkModule = loadTsModule(FRAMEWORK_MODULE);
  const architectureModule = loadTsModule(ARCHITECTURE_MODULE);
  const componentMapModule = loadTsModule(COMPONENT_MAP_MODULE);
  const top10Module = loadTsModule(TOP10_MODULE);
  const ciscoModule = loadTsModule("src/components/components/ciscoTaxonomyData.ts");
  const aivssModule = loadTsModule("src/components/components/aivssCalcData.ts");
  const aiuc1Module = loadTsModule("src/components/components/aiuc1Data.ts");
  const aisvsGeneratedModule = loadTsModule("src/data/aisvs.generated.ts");
  const aisvsModule = loadTsModule("src/data/aisvs.ts");
  const kcModule = loadTsModule(KC_MODULE);
  const nistRemapModule = loadTsModule("src/data/nistAisvsRemap.ts");
  const atlasModule = loadTsModule("src/data/atlasCrosswalk.ts");
  const sourcesModule = loadTsModule("src/data/sources.ts");
  const ciscoRaw = loadJson("src/components/components/cisco_taxonomy.json");
  const nistSource = readFile("src/pages/NISTMapping.tsx");

  const threatsData = requireObject("threatsData", securityModule.threatsData);
  const mitigationsData = requireObject("mitigationsData", securityModule.mitigationsData);
  const frameworkData = requireArray("frameworkData", frameworkModule.frameworkData);
  const architecturesData = requireObject(
    "architecturesData",
    architectureModule.architecturesData,
  );
  const agenticTop10Data = requireArray("agenticTop10Data", top10Module.agenticTop10Data);

  ensure(
    securityModule.aisvsData === aisvsModule.aisvsData,
    "securityData.aisvsData must be the re-export of src/data/aisvs.ts",
  );

  const threatEntries = Object.entries(threatsData);
  const mitigationEntries = Object.entries(mitigationsData);
  const architectureEntries = Object.entries(architecturesData);

  const threatIds = threatEntries.map(([id]) => id);
  const mitigationIds = mitigationEntries.map(([id]) => id);
  const threatSet = new Set(threatIds);
  const mitigationSet = new Set(mitigationIds);

  const { ids: componentIds, nodeThreatRefs } = collectComponentIds(frameworkData);
  const normalizedComponentIds = componentIds.map((id) => id.toLowerCase());
  const componentSet = new Set(normalizedComponentIds);

  const duplicateComponents = listDuplicates(normalizedComponentIds);
  if (duplicateComponents.length > 0) {
    addError(`Duplicate component IDs in frameworkData: ${formatDuplicates(duplicateComponents)}`);
  }

  // ── AISVS ────────────────────────────────────────────────────────────────
  const aisvs = checkAisvs(aisvsGeneratedModule.aisvs ?? aisvsGeneratedModule.default, aisvsModule);
  const staleAisvsRefs = scanSourceForAisvsCodes(aisvs);

  // ── Threats (OWASP Agentic AI T&M v1.1) ───────────────────────────────────
  const threatCodes = new Set(threatEntries.map(([, t]) => t?.code));
  for (const code of EXPECTED.threatCodes) {
    ensure(
      threatCodes.has(code),
      `threatsData is missing ${code} (OWASP Agentic AI T&M v1.1 defines T1–T17)`,
    );
  }

  for (const [threatKey, threat] of threatEntries) {
    const owner = `Threat ${threatKey}`;
    ensure(threat && typeof threat === "object", `${owner} is not an object`);
    if (!threat || typeof threat !== "object") continue;

    ensure(String(threat.id) === threatKey, `${owner} has mismatched id field: ${threat.id}`);
    ensureIdFormat(owner, threat.id, /^t\d+$/, "id");
    ensureIdFormat(owner, threat.code, /^T\d+$/, "code");
    ensure(
      String(threat.code).toLowerCase() === threatKey,
      `${owner} code ${threat.code} does not match id`,
    );
    ensure(
      typeof threat.name === "string" && threat.name.trim().length > 0,
      `${owner} is missing name`,
    );
    warnIf(!threat.shortName, `${owner} is missing shortName`);
    warnIf(!threat.sourceVersion, `${owner} is missing sourceVersion`);
    ensure(
      typeof threat.description === "string" && threat.description.trim().length > 0,
      `${owner} is missing description`,
    );
    ensure(
      ["high", "medium", "low"].includes(String(threat.impactLevel)),
      `${owner} has invalid impactLevel: ${threat.impactLevel}`,
    );

    ensure(Array.isArray(threat.componentIds), `${owner} componentIds must be an array`);
    const threatComponents = safeArray(threat.componentIds).map((id) => String(id).toLowerCase());
    ensure(threatComponents.length > 0, `${owner} has no componentIds`);
    for (const componentId of threatComponents) {
      ensure(
        componentSet.has(componentId),
        `${owner} references unknown componentId: ${componentId}`,
      );
    }

    ensure(Array.isArray(threat.mitigationIds), `${owner} mitigationIds must be an array`);
    const threatMitigations = safeArray(threat.mitigationIds).map((id) => String(id));
    ensure(threatMitigations.length > 0, `${owner} has no mitigationIds`);
    for (const mitigationId of threatMitigations) {
      ensure(
        mitigationSet.has(mitigationId),
        `${owner} references unknown mitigationId: ${mitigationId}`,
      );
    }

    ensure(
      typeof threat.riskScore === "number" && threat.riskScore >= 1 && threat.riskScore <= 10,
      `${owner} has invalid riskScore (expected 1-10): ${threat.riskScore}`,
    );

    const unofficial = safeArray(threat.asiMappingUnofficial);
    for (const code of unofficial) {
      ensure(
        safeArray(threat.asiMapping).includes(code),
        `${owner} asiMappingUnofficial ${code} is not in asiMapping`,
      );
    }

    ensureIsoDate(owner, threat.lastUpdated);
    validateReferences(owner, threat.references);
    checkNoMarkdownInDescriptions(owner, threat, "", THREAT_MODULE);
  }

  // ── Mitigations / controls ───────────────────────────────────────────────
  for (const [mitigationKey, mitigation] of mitigationEntries) {
    const owner = `Mitigation ${mitigationKey}`;
    ensure(mitigation && typeof mitigation === "object", `${owner} is not an object`);
    if (!mitigation || typeof mitigation !== "object") continue;

    ensure(
      String(mitigation.id) === mitigationKey,
      `${owner} has mismatched id field: ${mitigation.id}`,
    );
    ensureIdFormat(owner, mitigation.id, /^m\d+$/, "id");
    ensure(
      typeof mitigation.name === "string" && mitigation.name.trim().length > 0,
      `${owner} is missing name`,
    );
    ensure(
      typeof mitigation.description === "string" && mitigation.description.trim().length > 0,
      `${owner} is missing description`,
    );

    ensure(Array.isArray(mitigation.threatIds), `${owner} threatIds must be an array`);
    const linkedThreats = safeArray(mitigation.threatIds).map((id) => String(id));
    ensure(linkedThreats.length > 0, `${owner} has no threatIds`);
    for (const threatId of linkedThreats) {
      ensure(threatSet.has(threatId), `${owner} references unknown threatId: ${threatId}`);
    }

    const detail = safeObject(mitigation.implementationDetail);
    for (const field of ["design", "build", "operations", "toolsAndFrameworks"]) {
      ensure(
        typeof detail[field] === "string" && detail[field].trim().length > 0,
        `${owner} implementationDetail.${field} is empty`,
      );
    }

    ensure(
      mitigation.designPhase || mitigation.buildPhase || mitigation.operationPhase,
      `${owner} has no lifecycle phase flags enabled`,
    );

    ensure(
      typeof mitigation.riskScore === "number" &&
        mitigation.riskScore >= 1 &&
        mitigation.riskScore <= 10,
      `${owner} has invalid riskScore (expected 1-10): ${mitigation.riskScore}`,
    );

    // AISVS 1.01 linkage (§6.4)
    const chapters = safeArray(mitigation.aisvsCategories).map(String);
    ensure(chapters.length > 0, `${owner} has no aisvsCategories`);
    for (const code of chapters) {
      ensure(
        aisvs.chapterSet.has(code),
        `${owner} aisvsCategories references unknown AISVS chapter: ${code}`,
      );
    }
    for (const reqId of safeArray(mitigation.aisvsRequirements).map(String)) {
      ensure(
        aisvs.requirementSet.has(reqId),
        `${owner} aisvsRequirements references ${reqId}, which is ${
          aisvs.removedSet.has(reqId) ? "removed upstream" : "not in AISVS 1.01"
        }`,
      );
      const chapter = reqId.split(".")[0];
      warnIf(
        !chapters.includes(chapter),
        `${owner} requirement ${reqId} is outside its aisvsCategories`,
      );
    }
    for (const tag of safeArray(mitigation.tags)) {
      const m = String(tag).match(/^aisvs-(c\d+|v\d+)$/i);
      if (!m) continue;
      ensure(
        /^c\d+$/i.test(m[1]) && aisvs.chapterSet.has(m[1].toUpperCase()),
        `${owner} has stale AISVS tag "${tag}"`,
      );
    }
    // `aisvs-cN` tags must match aisvsCategories exactly, and every listed chapter needs at least one
    // cited requirement (chapter-only mappings say nothing about what the control implements).
    const aisvsTagChapters = safeArray(mitigation.tags)
      .map((tag) => String(tag).match(/^aisvs-(c\d+)$/i))
      .filter(Boolean)
      .map((m) => m[1].toUpperCase());
    for (const code of chapters) {
      ensure(
        aisvsTagChapters.includes(code),
        `${owner} aisvsCategories lists ${code} but tags lack "aisvs-${code.toLowerCase()}"`,
      );
      ensure(
        safeArray(mitigation.aisvsRequirements).some((id) => String(id).split(".")[0] === code),
        `${owner} aisvsCategories lists ${code} but aisvsRequirements cites no ${code} requirement`,
      );
    }
    for (const code of aisvsTagChapters) {
      ensure(
        chapters.includes(code),
        `${owner} has tag "aisvs-${code.toLowerCase()}" but aisvsCategories lacks ${code}`,
      );
    }

    ensureIsoDate(owner, mitigation.lastUpdated);
    validateReferences(owner, mitigation.references);
    checkNoMarkdownInDescriptions(owner, mitigation, "", THREAT_MODULE);
  }

  for (const [mitigationKey, mitigation] of mitigationEntries) {
    for (const threatId of safeArray(mitigation.threatIds)) {
      const threat = threatsData[threatId];
      if (!threat) continue;
      ensure(
        safeArray(threat.mitigationIds).includes(mitigationKey),
        `Mitigation ${mitigationKey} links to ${threatId} but ${threatId} is missing reverse mitigation link`,
      );
    }
  }

  for (const [threatKey, threat] of threatEntries) {
    for (const mitigationId of safeArray(threat.mitigationIds)) {
      const mitigation = mitigationsData[mitigationId];
      if (!mitigation) continue;
      ensure(
        safeArray(mitigation.threatIds).includes(threatKey),
        `Threat ${threatKey} links to ${mitigationId} but ${mitigationId} is missing reverse threat link`,
      );
    }
  }

  const threatToMitigationCoverage = new Map(threatIds.map((threatId) => [threatId, 0]));
  for (const mitigation of Object.values(mitigationsData)) {
    for (const threatId of safeArray(mitigation.threatIds)) {
      threatToMitigationCoverage.set(threatId, (threatToMitigationCoverage.get(threatId) || 0) + 1);
    }
  }
  for (const [threatId, coverageCount] of threatToMitigationCoverage.entries()) {
    ensure(coverageCount > 0, `Threat ${threatId} is not covered by any mitigation`);
  }

  // ── Architectures and KC components ──────────────────────────────────────
  for (const [architectureKey, architecture] of architectureEntries) {
    const owner = `Architecture ${architectureKey}`;
    ensure(architecture && typeof architecture === "object", `${owner} is not an object`);
    if (!architecture || typeof architecture !== "object") continue;

    ensure(String(architecture.id) === architectureKey, `${owner} has mismatched id field`);
    ensure(
      typeof architecture.name === "string" && architecture.name.trim().length > 0,
      `${owner} is missing name`,
    );
    ensure(
      typeof architecture.description === "string" && architecture.description.trim().length > 0,
      `${owner} is missing description`,
    );

    ensure(Array.isArray(architecture.keyComponents), `${owner} keyComponents must be an array`);
    ensure(Array.isArray(architecture.threatIds), `${owner} threatIds must be an array`);
    ensure(Array.isArray(architecture.mitigationIds), `${owner} mitigationIds must be an array`);

    ensure(safeArray(architecture.keyComponents).length > 0, `${owner} has no keyComponents`);
    ensure(safeArray(architecture.threatIds).length > 0, `${owner} has no threatIds`);
    ensure(safeArray(architecture.mitigationIds).length > 0, `${owner} has no mitigationIds`);

    for (const componentId of safeArray(architecture.keyComponents).map((id) =>
      String(id).toLowerCase(),
    )) {
      ensure(
        componentSet.has(componentId),
        `${owner} references unknown keyComponent: ${componentId}`,
      );
    }

    for (const threatId of safeArray(architecture.threatIds)) {
      ensure(threatSet.has(String(threatId)), `${owner} references unknown threatId: ${threatId}`);
    }

    for (const mitigationId of safeArray(architecture.mitigationIds)) {
      ensure(
        mitigationSet.has(String(mitigationId)),
        `${owner} references unknown mitigationId: ${mitigationId}`,
      );
    }

    for (const threatId of safeArray(architecture.threatIds)) {
      const covered = safeArray(architecture.mitigationIds).some((mitigationId) =>
        safeArray(mitigationsData[mitigationId]?.threatIds).includes(threatId),
      );
      warnIf(
        !covered,
        `${owner} lists threat ${threatId} without a directly mapped mitigation in mitigationIds`,
      );
    }

    ensureIsoDate(owner, architecture.lastUpdated);
    validateReferences(owner, architecture.references);
    checkNoMarkdownInDescriptions(owner, architecture, "", ARCHITECTURE_MODULE);
  }

  for (const nodeRef of nodeThreatRefs) {
    for (const threatId of nodeRef.threatIds) {
      ensure(
        threatSet.has(threatId),
        `Component ${nodeRef.id} references unknown threatId: ${threatId}`,
      );
    }
  }
  checkComponentThreatLinks(frameworkData, threatsData);
  checkNoMarkdownInDescriptions("frameworkData", frameworkData, "", FRAMEWORK_MODULE);
  checkNoMarkdownInDescriptions(
    "componentDataMap",
    componentMapModule.componentDataMap,
    "",
    COMPONENT_MAP_MODULE,
  );

  // ── Cisco AI Security and Safety Taxonomy ────────────────────────────────
  const ciscoObjectives = Object.entries(safeObject(ciscoRaw))
    .filter(([key]) => /^OB-\d+$/.test(key))
    .map(([key, value]) => {
      const code = String(value?.code || "");
      ensure(code === key, `Cisco taxonomy entry ${key} has mismatched code field: ${code}`);
      return key;
    });
  const ciscoObjectiveSet = new Set(ciscoObjectives);
  const ciscoStats = ciscoModule.getTaxonomyStats();
  ensure(
    ciscoModule.CISCO_TAXONOMY_VERSION === EXPECTED.cisco.version,
    `Cisco taxonomy version is ${ciscoModule.CISCO_TAXONOMY_VERSION}; expected ${EXPECTED.cisco.version}`,
  );
  ensure(
    ciscoStats.objectiveGroups === EXPECTED.cisco.objectives &&
      ciscoStats.techniques === EXPECTED.cisco.techniques &&
      ciscoStats.subTechniques === EXPECTED.cisco.subTechniques,
    `Cisco taxonomy counts ${ciscoStats.objectiveGroups}/${ciscoStats.techniques}/${ciscoStats.subTechniques} differ from ${EXPECTED.cisco.objectives}/${EXPECTED.cisco.techniques}/${EXPECTED.cisco.subTechniques}`,
  );
  for (const dep of safeArray(ciscoModule.CISCO_V1_DEPRECATIONS)) {
    for (const target of safeArray(dep.v2)) {
      ensure(
        Boolean(ciscoModule.findCiscoNode(target)),
        `CISCO_V1_DEPRECATIONS ${dep.v1} points to unknown v2 code ${target}`,
      );
    }
  }
  const ciscoByAsi = ciscoModule.getCiscoObjectivesByAsi();

  // ── OWASP Top 10 for Agentic Applications ────────────────────────────────
  const aivssNames = new Set(safeArray(aivssModule.AIVSS_CORE_RISK_NAMES));
  const top10Codes = new Set();
  const top10ByCode = new Map();
  for (const entry of agenticTop10Data) {
    const owner = `OWASP Agentic Top10 ${entry?.id}`;
    ensure(entry && typeof entry === "object", `${owner} is not an object`);
    if (!entry || typeof entry !== "object") continue;

    ensureIdFormat(owner, entry.id, /^ASI\d{2}$/, "id");
    ensureIdFormat(owner, entry.code, /^ASI\d{2}$/, "code");
    ensure(entry.id === entry.code, `${owner} must use matching id and code`);
    ensure(
      typeof entry.name === "string" && entry.name.trim().length > 0,
      `${owner} is missing name`,
    );
    ensure(
      typeof entry.description === "string" && entry.description.trim().length > 0,
      `${owner} is missing description`,
    );

    top10Codes.add(entry.code);
    top10ByCode.set(entry.code, entry);

    const relatedThreats = safeArray(entry.relatedThreats).map((threatId) => String(threatId));
    ensure(relatedThreats.length > 0, `${owner} has no relatedThreats`);
    for (const threatId of relatedThreats) {
      ensure(threatSet.has(threatId), `${owner} references unknown threat ID: ${threatId}`);
    }

    const relatedCiscoObjectives = safeArray(entry.relatedCiscoObjectives).map((code) =>
      String(code),
    );
    for (const code of relatedCiscoObjectives) {
      ensure(ciscoObjectiveSet.has(code), `${owner} references unknown Cisco objective: ${code}`);
    }
    const derived = safeArray(ciscoByAsi[entry.code]);
    warnIf(
      derived.join(",") !== [...relatedCiscoObjectives].sort().join(","),
      `${owner} relatedCiscoObjectives [${relatedCiscoObjectives.join(", ")}] differ from the Cisco taxonomy's own ASI mappings [${derived.join(", ")}]`,
    );

    ensure(
      aivssNames.has(entry.relatedAIVSSRisk),
      `${owner} relatedAIVSSRisk is not an AIVSS core risk: ${entry.relatedAIVSSRisk}`,
    );
    const appendixB = aivssModule.AIVSS_ASI_MAPPING?.[entry.code];
    warnIf(
      appendixB && !safeArray(appendixB.primary).includes(entry.relatedAIVSSRisk),
      `${owner} relatedAIVSSRisk is not a primary risk in AIVSS Appendix B`,
    );
    for (const name of safeArray(entry.relatedAIVSSSecondary)) {
      ensure(
        aivssNames.has(name),
        `${owner} relatedAIVSSSecondary is not an AIVSS core risk: ${name}`,
      );
    }

    validateReferences(owner, entry.references);
    checkNoMarkdownInDescriptions(owner, entry, "", TOP10_MODULE);
  }

  const top10CodeDuplicates = listDuplicates(agenticTop10Data.map((entry) => String(entry.code)));
  if (top10CodeDuplicates.length > 0) {
    addError(`Duplicate OWASP Agentic Top 10 codes: ${formatDuplicates(top10CodeDuplicates)}`);
  }

  // Threat ↔ ASI consistency (Top 10 2026, Appendix A is the official mapping).
  for (const [threatKey, threat] of threatEntries) {
    const unofficial = new Set(safeArray(threat.asiMappingUnofficial));
    for (const code of safeArray(threat.asiMapping).map(String)) {
      ensure(top10Codes.has(code), `Threat ${threatKey} references unknown ASI mapping: ${code}`);
      const entry = top10ByCode.get(code);
      if (entry && !unofficial.has(code)) {
        ensure(
          safeArray(entry.relatedThreats).includes(threatKey),
          `Threat ${threatKey} maps to ${code}, but ${code}.relatedThreats (Appendix A) does not list it; mark it asiMappingUnofficial or fix the mapping`,
        );
      }
    }
    for (const code of safeArray(threat.ciscoMapping).map(String)) {
      ensure(
        ciscoObjectiveSet.has(code),
        `Threat ${threatKey} references unknown Cisco mapping: ${code}`,
      );
    }
  }
  for (const entry of agenticTop10Data) {
    for (const threatId of safeArray(entry.relatedThreats)) {
      const threat = threatsData[threatId];
      if (!threat) continue;
      ensure(
        safeArray(threat.asiMapping).includes(entry.code),
        `${entry.code}.relatedThreats lists ${threatId}, but ${threatId}.asiMapping does not include ${entry.code}`,
      );
    }
  }
  for (const code of top10Codes) {
    ensure(
      threatEntries.some(([, threat]) => safeArray(threat.asiMapping).includes(code)),
      `OWASP Agentic Top 10 ${code} is not referenced by any threat's asiMapping`,
    );
  }

  // ── AIVSS v0.8 worked examples recompute ─────────────────────────────────
  const maturityByThm = { 1: "A", 0.97: "P", 0.5: "U" };
  const strengthByMf = { 1: "none", 0.83: "partial", 0.67: "strong" };
  for (const example of safeArray(aivssModule.coreRiskScores)) {
    const owner = `AIVSS example ${example.id}`;
    ensure(aivssNames.has(example.name), `${owner} has non-canonical name: ${example.name}`);
    const result = aivssModule.scoreAIVSS({
      cvssBase: example.cvssBase,
      factorValues: example.factorValues,
      exploitMaturity: maturityByThm[example.threatMultiplier],
      mitigation: strengthByMf[example.mitigationFactor],
    });
    ensure(
      result.factorSum === example.factorSum,
      `${owner} factor sum ${result.factorSum} ≠ ${example.factorSum}`,
    );
    ensure(
      Math.abs(result.aars - example.aars) < 0.0005,
      `${owner} AARS ${result.aars.toFixed(4)} ≠ published ${example.aars}`,
    );
    ensure(
      result.aivssScore === example.aivssScore,
      `${owner} recomputes to ${result.aivssScore}, published ${example.aivssScore}`,
    );
    ensure(
      result.severity === example.severity,
      `${owner} severity ${result.severity} ≠ ${example.severity}`,
    );
    for (const asi of safeArray(example.asiCodes)) {
      ensure(top10Codes.has(asi), `${owner} references unknown ASI ${asi}`);
    }
  }

  // ── AIUC-1 ───────────────────────────────────────────────────────────────
  const aiuc1All = aiuc1Module.getAllAiuc1Requirements();
  const aiuc1Ids = new Set(aiuc1All.map((r) => r.id));
  const aiuc1Stats = aiuc1Module.getAiuc1Stats();
  ensure(
    aiuc1All.length === EXPECTED.aiuc1.ids && aiuc1Stats.active === EXPECTED.aiuc1.active,
    `AIUC-1 has ${aiuc1All.length} ids / ${aiuc1Stats.active} active; ${aiuc1Module.AIUC1_VERSION} has ${EXPECTED.aiuc1.ids} / ${EXPECTED.aiuc1.active}`,
  );
  const aiuc1Dupes = listDuplicates(aiuc1All.map((r) => r.id));
  ensure(
    aiuc1Dupes.length === 0,
    `Duplicate AIUC-1 requirement ids: ${formatDuplicates(aiuc1Dupes)}`,
  );
  for (const req of aiuc1All) {
    const owner = `AIUC-1 ${req.id}`;
    if (!aiuc1Module.isAiuc1RequirementActive(req)) {
      ensure(Boolean(req.retiredIn), `${owner} is retired but has no retiredIn`);
    }
    for (const target of safeArray(req.replacedBy)) {
      ensure(aiuc1Ids.has(target), `${owner} replacedBy unknown requirement ${target}`);
    }
    if (req.asiId)
      ensure(top10Codes.has(req.asiId), `${owner} references unknown ASI ${req.asiId}`);
    if (req.aivss_primary)
      ensure(
        aivssNames.has(req.aivss_primary),
        `${owner} aivss_primary is not canonical: ${req.aivss_primary}`,
      );
    if (req.aivss_secondary)
      ensure(
        aivssNames.has(req.aivss_secondary),
        `${owner} aivss_secondary is not canonical: ${req.aivss_secondary}`,
      );
    if (req.url) ensure(isValidHttpUrl(req.url), `${owner} has invalid url: ${req.url}`);
  }
  for (const [asi, name] of Object.entries(safeObject(aiuc1Module.asiBridge))) {
    ensure(top10Codes.has(asi), `AIUC-1 asiBridge has unknown ASI ${asi}`);
    ensure(aivssNames.has(name), `AIUC-1 asiBridge ${asi} is not an AIVSS core risk: ${name}`);
  }

  // ── NIST AI RMF → AISVS 1.01 ─────────────────────────────────────────────
  const remap = safeObject(nistRemapModule.NIST_AISVS_REMAP);
  const remapEntries = Object.entries(remap);
  ensure(
    remapEntries.length === EXPECTED.nistSubcategories,
    `NIST_AISVS_REMAP has ${remapEntries.length} subcategories; expected ${EXPECTED.nistSubcategories}`,
  );
  for (const [code, entry] of remapEntries) {
    const owner = `NIST_AISVS_REMAP ${code}`;
    ensureIdFormat(owner, code, /^(GOVERN|MAP|MEASURE|MANAGE)\.\d+\.\d+$/, "code");
    ensure(entry.id === code.toLowerCase(), `${owner} id mismatch`);
    ensure(String(entry.rationale || "").trim().length > 0, `${owner} has no rationale`);
    for (const ch of safeArray(entry.aisvs)) {
      ensure(aisvs.chapterSet.has(ch), `${owner} maps to unknown AISVS chapter ${ch}`);
    }
    for (const reqId of safeArray(entry.requirements)) {
      ensure(aisvs.requirementSet.has(reqId), `${owner} cites unknown AISVS requirement ${reqId}`);
      ensure(
        safeArray(entry.aisvs).includes(reqId.split(".")[0]),
        `${owner} cites ${reqId} outside its chapters`,
      );
    }
  }
  const pageSubcategories = unique(
    [...nistSource.matchAll(/code:\s*"((?:GOVERN|MAP|MEASURE|MANAGE)\.\d+\.\d+)"/g)].map(
      (m) => m[1],
    ),
  );
  for (const code of pageSubcategories) {
    warnIf(
      !remap[code],
      `src/pages/NISTMapping.tsx subcategory ${code} has no entry in NIST_AISVS_REMAP`,
    );
  }
  const nistMappings = parseNistAisvsMappings(nistSource);
  warnIf(
    nistMappings.length > 0,
    `src/pages/NISTMapping.tsx still has ${nistMappings.length} hand-written aisvsMapping arrays (pre-1.01 chapter meanings); consume NIST_AISVS_REMAP instead`,
  );

  // ── MITRE ATLAS crosswalk ────────────────────────────────────────────────
  const atlasRows = safeArray(atlasModule.atlasCrosswalk);
  ensure(atlasRows.length > 0, "atlasCrosswalk is empty");
  for (const row of atlasRows) {
    const owner = `ATLAS crosswalk ${row.atlasId}`;
    ensureIdFormat(owner, row.atlasId, /^AML\.TA?\d{4}(\.\d{3})?$/, "atlasId");
    ensure(
      row.atlasName && row.atlasName !== row.atlasId,
      `${owner} has no official ATLAS name in ATLAS_NAMES`,
    );
    ensure(safeArray(row.ciscoTechniqueIds).length > 0, `${owner} has no Cisco techniques`);
    for (const code of safeArray(row.ciscoTechniqueIds)) {
      ensure(
        Boolean(ciscoModule.findCiscoNode(code)),
        `${owner} references unknown Cisco code ${code}`,
      );
    }
    for (const asi of safeArray(row.owaspAsi))
      ensure(top10Codes.has(asi), `${owner} references unknown ASI ${asi}`);
    for (const id of safeArray(row.threatIds))
      ensure(threatSet.has(id), `${owner} references unknown threat ${id}`);
  }

  // ── Provenance ───────────────────────────────────────────────────────────
  const sources = requireObject("SOURCES", sourcesModule.SOURCES);
  for (const key of [
    "aisvs",
    "threats",
    "controls",
    "top10",
    "cisco",
    "aiuc1",
    "aivss",
    "kc",
    "architectures",
    "nist",
  ]) {
    ensure(Boolean(sources[key]), `SOURCES.${key} is missing`);
  }
  checkSources(sources);

  // ── Icons, KC names, date freshness (P1-15) ──────────────────────────────
  const iconStats = checkIconKeys({
    [THREAT_MODULE]: securityModule,
    [FRAMEWORK_MODULE]: frameworkModule,
    [ARCHITECTURE_MODULE]: architectureModule,
    [TOP10_MODULE]: top10Module,
    "src/components/components/aiuc1Data.ts": aiuc1Module,
    "src/data/aisvs.ts": aisvsModule,
    [KC_MODULE]: kcModule,
  });
  checkKcNames(kcModule, frameworkData, componentMapModule.componentDataMap);
  checkNoMarkdownInDescriptions("KC", kcModule.KC, "", KC_MODULE);
  const datedFields = checkDateFreshness(
    {
      [THREAT_MODULE]: securityModule,
      [FRAMEWORK_MODULE]: frameworkModule,
      [ARCHITECTURE_MODULE]: architectureModule,
      [COMPONENT_MAP_MODULE]: componentMapModule,
      [TOP10_MODULE]: top10Module,
      "src/components/components/ciscoTaxonomyData.ts": ciscoModule,
      "src/components/components/aivssCalcData.ts": aivssModule,
      "src/components/components/aiuc1Data.ts": aiuc1Module,
      "src/data/aisvs.generated.ts": aisvsGeneratedModule,
      "src/data/nistAisvsRemap.ts": nistRemapModule,
      "src/data/atlasCrosswalk.ts": atlasModule,
    },
    new Set(["threatsData", "mitigationsData", "architecturesData"]),
  );

  if (bareDomainUpstream.length > 0) {
    addNote(
      `${bareDomainUpstream.length} bare-domain reference URL(s) are copied verbatim from AISVS ${EXPECTED.aisvs.version} chapter references (upstream; not changed here)`,
    );
  }

  const duplicateReferenceUrls = listDuplicates(collectedReferenceUrls.map((entry) => entry.url));
  if (duplicateReferenceUrls.length > 0) {
    addNote(
      `Duplicate reference URLs reused across entries: ${formatDuplicates(duplicateReferenceUrls.slice(0, 20))}`,
    );
  }

  if (shouldCheckLinks) {
    const ownersByUrl = new Map();
    for (const { owner, url } of collectedReferenceUrls) {
      if (!ownersByUrl.has(url)) ownersByUrl.set(url, []);
      ownersByUrl.get(url).push(owner);
    }
    await checkLinkReachability(
      collectedReferenceUrls.map((entry) => entry.url),
      ownersByUrl,
    );
  } else {
    addNote("Live URL reachability was skipped (run with --check-links to enable network checks).");
  }

  console.log("📊 Data Integrity Summary");
  console.log("========================");
  console.log(`Threats: ${threatIds.length}`);
  console.log(`Mitigations: ${mitigationIds.length}`);
  console.log(`Components: ${componentSet.size}`);
  console.log(`Architectures: ${architectureEntries.length}`);
  console.log(`OWASP Agentic Top 10 Entries: ${agenticTop10Data.length}`);
  console.log(
    `Cisco taxonomy ${ciscoModule.CISCO_TAXONOMY_VERSION}: ${ciscoStats.objectiveGroups} objectives / ${ciscoStats.techniques} techniques / ${ciscoStats.subTechniques} sub-techniques`,
  );
  console.log(`MITRE ATLAS crosswalk rows: ${atlasRows.length}`);
  console.log(
    `AISVS ${EXPECTED.aisvs.version}: ${aisvs.categories.length} chapters / ${aisvs.subCategories.length} sections / ${aisvs.requirements.length} requirements`,
  );
  console.log(
    `AIUC-1 ${aiuc1Module.AIUC1_VERSION}: ${aiuc1Stats.active} active of ${aiuc1All.length} ids`,
  );
  console.log(`AIVSS worked examples recomputed: ${safeArray(aivssModule.coreRiskScores).length}`);
  console.log(`NIST AI RMF subcategories mapped: ${remapEntries.length}`);
  console.log(`Stale AISVS code references in src/: ${staleAisvsRefs}`);
  console.log(
    `Icon keys resolved: ${iconStats.checked} against ${iconStats.registrySize} registry keys; dated fields checked: ${datedFields}`,
  );
  console.log(
    `Reference URLs (unique): ${unique(collectedReferenceUrls.map((entry) => entry.url)).length}`,
  );

  if (notes.length > 0) {
    console.log("\nℹ️ Notes:");
    notes.forEach((note) => console.log(`- ${note}`));
  }

  if (warnings.length > 0) {
    console.log("\n⚠️ Warnings:");
    warnings.forEach((warning) => console.log(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach((error) => console.log(`- ${error}`));
    process.exit(1);
  }

  console.log("\n✅ Data integrity checks passed.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run().catch((error) => {
    console.error("❌ Data integrity check failed unexpectedly.");
    console.error(error);
    process.exit(1);
  });
}
