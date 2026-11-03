#!/usr/bin/env node
/**
 * Import the OWASP AI Security Verification Standard (AISVS) from its GitHub
 * repository and write `src/data/aisvs.generated.ts`.
 *
 * Usage:
 *   npm run import:aisvs                      # 1.01 from OWASP/AISVS@main
 *   npm run import:aisvs -- --version 1.02    # another release folder
 *   npm run import:aisvs -- --ref <sha|tag>   # pin a git ref
 *   npm run import:aisvs -- --from <dir>      # parse local copies of the .md files (offline)
 *   npm run import:aisvs -- --check           # parse + validate only, do not write
 *
 * Source layout (https://github.com/OWASP/AISVS/tree/main/1.01/en):
 *   0x10-C01-<slug>.md … 0x10-C12-<slug>.md, each with
 *     # C1 <Chapter name>
 *     ## Control Objective           (paragraph → chapter description)
 *     ## C1.1 <Section name>         (paragraph → section description)
 *     | # | Description | Level |    (optionally a Role column)
 *     | **1.1.1** | **Verify that** … | 1 |
 *     ## References                  (* [title](url) list → chapter references)
 *
 * Rows whose text is "Requirement removed." keep their number reserved upstream;
 * they are recorded in `section.removed` and are NOT emitted as requirements.
 *
 * Re-run this script to upgrade (e.g. to 1.02); then run `npm run check:data`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");
const OUTPUT = path.join(projectRoot, "src/data/aisvs.generated.ts");

const REPO = "OWASP/AISVS";
const EXPECTED_CHAPTERS = 12;

function parseArgs(argv) {
  const opts = { version: "1.01", ref: "main", from: null, check: false, lang: "en" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = () => {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      i += 1;
      return value;
    };
    if (arg === "--version") opts.version = next();
    else if (arg === "--ref") opts.ref = next();
    else if (arg === "--from") opts.from = next();
    else if (arg === "--lang") opts.lang = next();
    else if (arg === "--check") opts.check = true;
    else if (arg === "--help" || arg === "-h") {
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0]);
      process.exit(0);
    } else throw new Error(`Unknown argument: ${arg}`);
  }
  return opts;
}

async function fetchText(url, accept) {
  const headers = { "User-Agent": "agentic-security-hub-import-aisvs" };
  if (accept) headers.Accept = accept;
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`GET ${url} → HTTP ${response.status}`);
  return response.text();
}

/** List chapter files via the GitHub contents API; fall back to the known 1.01 names. */
async function listChapterFiles(opts) {
  const dir = `${opts.version}/${opts.lang}`;
  try {
    const json = JSON.parse(
      await fetchText(
        `https://api.github.com/repos/${REPO}/contents/${dir}?ref=${encodeURIComponent(opts.ref)}`,
        "application/vnd.github+json",
      ),
    );
    const names = json
      .map((entry) => entry.name)
      .filter((name) => /^0x10-C\d{2}-.+\.md$/.test(name))
      .sort();
    if (names.length > 0) return names;
  } catch (error) {
    console.warn(`⚠️  GitHub API listing failed (${error.message}); using known 1.01 file names.`);
  }
  return [
    "0x10-C01-Training-Data-Integrity-and-Traceability.md",
    "0x10-C02-Input-Validation.md",
    "0x10-C03-Model-Lifecycle-Management.md",
    "0x10-C04-Infrastructure.md",
    "0x10-C05-Access-Control-and-Identity.md",
    "0x10-C06-Supply-Chain.md",
    "0x10-C07-Model-Behavior.md",
    "0x10-C08-Memory-Embeddings-and-Vector-Database.md",
    "0x10-C09-Orchestration-and-Agentic-Action.md",
    "0x10-C10-MCP-Security.md",
    "0x10-C11-Adversarial-Robustness.md",
    "0x10-C12-Monitoring-and-Logging.md",
  ];
}

async function resolveCommit(opts) {
  try {
    const json = JSON.parse(
      await fetchText(
        `https://api.github.com/repos/${REPO}/commits?path=${encodeURIComponent(
          `${opts.version}/${opts.lang}`,
        )}&sha=${encodeURIComponent(opts.ref)}&per_page=1`,
        "application/vnd.github+json",
      ),
    );
    if (Array.isArray(json) && json[0]?.sha) {
      return { sha: json[0].sha, date: json[0].commit?.committer?.date ?? null };
    }
  } catch (error) {
    console.warn(`⚠️  Could not resolve source commit (${error.message}).`);
  }
  return { sha: null, date: null };
}

/** Plain text from a markdown table cell / paragraph (drops emphasis, keeps inline code text). */
function plain(markdown) {
  return markdown
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*(?=[\s).,;:]|$)/g, "$1$2")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\\\|/g, "|")
    .replace(/\s+/g, " ")
    .trim();
}

function splitRow(line) {
  // Split on unescaped pipes; drop the empty first/last cells.
  const cells = [];
  let current = "";
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === "\\" && line[i + 1] === "|") {
      current += "\\|";
      i += 1;
    } else if (ch === "|") {
      cells.push(current);
      current = "";
    } else current += ch;
  }
  cells.push(current);
  return cells.slice(1, -1).map((cell) => cell.trim());
}

function paragraphsUntil(lines, start, stop) {
  const out = [];
  let buf = [];
  for (let i = start; i < lines.length && !stop(lines[i]); i += 1) {
    const line = lines[i].trim();
    if (line === "" || line === "---") {
      if (buf.length) out.push(buf.join(" "));
      buf = [];
    } else if (!line.startsWith("|")) buf.push(line);
  }
  if (buf.length) out.push(buf.join(" "));
  return out.map(plain).filter(Boolean).join("\n\n");
}

export function parseChapter(markdown, fileName) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const h1Index = lines.findIndex((line) => /^#\s+C\d+\s+/.test(line));
  if (h1Index < 0) throw new Error(`${fileName}: no "# C<n> <name>" heading`);
  const [, code, name] = lines[h1Index].match(/^#\s+(C\d+)\s+(.+?)\s*$/);
  const chapterNumber = code.slice(1);

  const isHeading = (line) => /^##\s+/.test(line);
  const objectiveIndex = lines.findIndex((line) => /^##\s+Control Objective/i.test(line));
  const description =
    objectiveIndex >= 0 ? paragraphsUntil(lines, objectiveIndex + 1, isHeading) : "";

  const sections = [];
  const references = [];
  let section = null;
  let columns = null;
  let inReferences = false;

  for (let i = h1Index + 1; i < lines.length; i += 1) {
    const line = lines[i];
    const sectionMatch = line.match(/^##\s+(C\d+\.\d+)\s+(.+?)\s*$/);
    if (sectionMatch) {
      inReferences = false;
      columns = null;
      section = {
        code: sectionMatch[1],
        name: plain(sectionMatch[2]),
        description: paragraphsUntil(lines, i + 1, (l) => isHeading(l) || l.trim().startsWith("|")),
        requirements: [],
        removed: [],
      };
      if (!section.code.startsWith(`${code}.`)) {
        throw new Error(`${fileName}: section ${section.code} outside chapter ${code}`);
      }
      sections.push(section);
      continue;
    }
    if (/^##\s+References/i.test(line)) {
      inReferences = true;
      section = null;
      continue;
    }
    if (isHeading(line)) {
      inReferences = false;
      section = null;
      continue;
    }

    if (inReferences) {
      const ref = line.match(/^\s*[*-]\s+\[([^\]]+)\]\(([^)\s]+)\)/);
      if (ref) references.push({ title: plain(ref[1]), url: ref[2] });
      continue;
    }

    if (!section || !line.trim().startsWith("|")) continue;
    const cells = splitRow(line);
    if (cells.length === 0) continue;
    if (/^#$/.test(plain(cells[0]))) {
      columns = cells.map((cell) => plain(cell).toLowerCase());
      continue;
    }
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue;

    const idText = plain(cells[0]);
    if (!/^\d+\.\d+\.\d+$/.test(idText)) continue;
    const descriptionIndex = columns ? columns.indexOf("description") : 1;
    const levelIndex = columns ? columns.indexOf("level") : 2;
    const roleIndex = columns ? columns.indexOf("role") : -1;
    const text = plain(cells[descriptionIndex] ?? "");
    const levelRaw = plain(cells[levelIndex] ?? "");
    const id = `C${idText}`;

    if (!id.startsWith(`${section.code}.`)) {
      throw new Error(`${fileName}: requirement ${id} listed under ${section.code}`);
    }
    if (/^requirement removed\.?$/i.test(text) || levelRaw === "") {
      section.removed.push(id);
      continue;
    }
    const level = Number(levelRaw);
    if (![1, 2, 3].includes(level)) {
      throw new Error(`${fileName}: requirement ${id} has invalid level "${levelRaw}"`);
    }
    const requirement = { id, text, level };
    if (roleIndex >= 0 && cells[roleIndex]) requirement.role = plain(cells[roleIndex]);
    section.requirements.push(requirement);
  }

  for (const s of sections) {
    if (s.removed.length === 0) delete s.removed;
  }

  return {
    code,
    number: Number(chapterNumber),
    name: plain(name),
    description,
    sections,
    references,
  };
}

export function validate(data) {
  const problems = [];
  const ids = new Set();
  if (data.chapters.length !== EXPECTED_CHAPTERS) {
    problems.push(`expected ${EXPECTED_CHAPTERS} chapters, got ${data.chapters.length}`);
  }
  data.chapters.forEach((chapter, index) => {
    if (chapter.code !== `C${index + 1}`)
      problems.push(`chapter ${index} has code ${chapter.code}`);
    if (!chapter.name) problems.push(`${chapter.code} has no name`);
    if (!chapter.description) problems.push(`${chapter.code} has no control objective`);
    if (chapter.sections.length === 0) problems.push(`${chapter.code} has no sections`);
    for (const section of chapter.sections) {
      if (section.requirements.length === 0) problems.push(`${section.code} has no requirements`);
      for (const req of section.requirements) {
        if (ids.has(req.id)) problems.push(`duplicate requirement ${req.id}`);
        ids.add(req.id);
        if (!/^Verify that\b/.test(req.text))
          problems.push(`${req.id} does not start with "Verify that"`);
      }
    }
  });
  return problems;
}

function render(data) {
  const banner = `/**
 * OWASP AI Security Verification Standard (AISVS) ${data.version}
 *
 * AUTO-GENERATED by scripts/import-aisvs.mjs — do not edit by hand.
 * Re-generate with \`npm run import:aisvs\` (add \`-- --version 1.02\` to upgrade).
 *
 * Source: ${data.sourceUrl}
 * Commit: ${data.sourceCommit ?? "unknown"}
 * License: CC BY-SA 4.0 (OWASP AISVS). Requirement text is reproduced verbatim.
 */
`;
  const types = `
export type AisvsLevel = 1 | 2 | 3;

export interface AisvsGeneratedRequirement {
  /** Chapter-qualified id, e.g. "C1.1.1" (cite as v${data.version}-C1.1.1). */
  id: string;
  /** Official requirement text ("Verify that …"). */
  text: string;
  level: AisvsLevel;
  /** Only present when the source table has a Role column (1.01 has none). */
  role?: string;
}

export interface AisvsGeneratedSection {
  code: string;
  name: string;
  description: string;
  requirements: AisvsGeneratedRequirement[];
  /** Requirement numbers marked "Requirement removed." upstream (reserved, not verifiable). */
  removed?: string[];
}

export interface AisvsGeneratedChapter {
  code: string;
  number: number;
  name: string;
  /** The chapter's "Control Objective". */
  description: string;
  sections: AisvsGeneratedSection[];
  references: { title: string; url: string }[];
  sourceFile: string;
}

export interface AisvsGenerated {
  version: string;
  /** Release date as printed in the standard's front matter. */
  published: string | null;
  /** Date this file was generated (YYYY-MM-DD). */
  retrievedAt: string;
  sourceUrl: string;
  sourceCommit: string | null;
  chapters: AisvsGeneratedChapter[];
}
`;
  const body = `\nexport const aisvs: AisvsGenerated = ${JSON.stringify(data, null, 2)};\n\nexport default aisvs;\n`;
  return banner + types + body;
}

async function formatWithPrettier(source) {
  try {
    const prettier = await import("prettier");
    const config = (await prettier.resolveConfig(OUTPUT)) ?? {};
    return await prettier.format(source, { ...config, filepath: OUTPUT });
  } catch (error) {
    console.warn(`⚠️  prettier unavailable (${error.message}); writing unformatted output.`);
    return source;
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const baseUrl = `https://raw.githubusercontent.com/${REPO}/${opts.ref}/${opts.version}/${opts.lang}`;

  let files;
  let readChapter;
  let published = null;
  let commit = { sha: null, date: null };

  if (opts.from) {
    const dir = path.resolve(opts.from);
    files = fs
      .readdirSync(dir)
      .filter((name) => /^0x10-C\d{2}-.+\.md$/.test(name))
      .sort();
    readChapter = async (name) => fs.readFileSync(path.join(dir, name), "utf8");
    const header = path.join(dir, "0x00-Header.yaml");
    if (fs.existsSync(header)) published = fs.readFileSync(header, "utf8");
  } else {
    files = await listChapterFiles(opts);
    readChapter = (name) => fetchText(`${baseUrl}/${name}`);
    commit = await resolveCommit(opts);
    try {
      published = await fetchText(`${baseUrl}/0x00-Header.yaml`);
    } catch {
      published = null;
    }
  }

  const publishedDate =
    published?.match(/^\s*date:\s*(.+?)\s*$/m)?.[1]?.replace(/^["']|["']$/g, "") ?? null;

  const chapters = [];
  for (const name of files) {
    const markdown = await readChapter(name);
    const chapter = parseChapter(markdown, name);
    chapters.push({ ...chapter, sourceFile: name });
  }
  chapters.sort((a, b) => a.number - b.number);

  const data = {
    version: opts.version,
    published: publishedDate,
    retrievedAt: new Date().toISOString().slice(0, 10),
    sourceUrl: `https://github.com/${REPO}/tree/${commit.sha ?? opts.ref}/${opts.version}/${opts.lang}`,
    sourceCommit: commit.sha,
    chapters,
  };

  const problems = validate(data);
  const requirementCount = chapters.reduce(
    (sum, c) => sum + c.sections.reduce((s, sec) => s + sec.requirements.length, 0),
    0,
  );
  const removedCount = chapters.reduce(
    (sum, c) => sum + c.sections.reduce((s, sec) => s + (sec.removed?.length ?? 0), 0),
    0,
  );
  console.log(
    `AISVS ${data.version}: ${chapters.length} chapters, ${chapters.reduce(
      (s, c) => s + c.sections.length,
      0,
    )} sections, ${requirementCount} requirements (${removedCount} removed ids skipped)`,
  );
  for (const chapter of chapters) {
    const count = chapter.sections.reduce((s, sec) => s + sec.requirements.length, 0);
    console.log(`  ${chapter.code.padEnd(4)} ${String(count).padStart(3)}  ${chapter.name}`);
  }

  if (problems.length > 0) {
    console.error("❌ Validation problems:\n" + problems.map((p) => `  - ${p}`).join("\n"));
    process.exit(1);
  }
  if (opts.check) {
    console.log("✅ Parsed and validated (--check: nothing written).");
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, await formatWithPrettier(render(data)));
  console.log(`✅ Wrote ${path.relative(projectRoot, OUTPUT)}`);
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`❌ import-aisvs failed: ${error.message}`);
    process.exit(1);
  });
}
