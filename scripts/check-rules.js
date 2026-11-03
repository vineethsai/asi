#!/usr/bin/env node
/**
 * Threat-modeler rule catalog checks (`npm run check:rules`).
 *
 * Bundles the engine catalog with esbuild (already installed with Vite) and
 * verifies every id join the engine relies on:
 *   - rule ids unique and well-formed; title/description/mitigations present;
 *   - every rule maps to AISVS (ASI / Cisco / STRIDE gaps are warnings); codes
 *     exist in the data
 *     modules (ASI ids, Cisco v2 objectives/techniques, AISVS 1.01 ids);
 *   - mitigation ids exist; mitigation controlIds exist in securityData;
 *   - catalogThreat ids exist in securityData threatsData;
 *   - compliance checks reference real mitigations, AISVS chapters and active
 *     AIUC-1 requirements.
 * Errors exit 1; warnings are printed only.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "src");
const generatedAisvs = path.join(src, "data", "aisvs.generated.ts");
const hasGenerated = fs.existsSync(generatedAisvs);

const entry = `
export { RULES, MITIGATIONS } from "@/components/threat-modeler/engine/catalog";
export { AISVS_CODE_RE } from "@/components/threat-modeler/engine/catalog/aisvs";
export { COMPLIANCE_CHECKS } from "@/components/threat-modeler/engine/compliance";
export { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
export { threatsData, mitigationsData } from "@/components/components/securityData";
export { aiuc1Principles } from "@/components/components/aiuc1Data";
export { ciscoTaxonomyData, CISCO_V1_REUSED_CODES } from "@/components/components/ciscoTaxonomyData";
${hasGenerated ? 'export { aisvs } from "@/data/aisvs.generated";' : "export const aisvs = null;"}
`;

const alias = {
  name: "alias-at",
  setup(b) {
    b.onResolve({ filter: /^@\// }, async (args) => {
      const base = path.join(src, args.path.slice(2));
      for (const cand of [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
        if (fs.existsSync(cand) && fs.statSync(cand).isFile()) return { path: cand };
      }
      return { errors: [{ text: `cannot resolve ${args.path}` }] };
    });
  },
};

const out = await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts", sourcefile: "check-rules-entry.ts" },
  bundle: true,
  write: false,
  format: "esm",
  platform: "node",
  target: "node18",
  logLevel: "silent",
  plugins: [alias],
});
const code = out.outputFiles[0].text;
const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
const {
  RULES,
  MITIGATIONS,
  AISVS_CODE_RE,
  COMPLIANCE_CHECKS,
  agenticTop10Data,
  threatsData,
  mitigationsData,
  aiuc1Principles,
  ciscoTaxonomyData,
  aisvs,
} = mod;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

// ─── Reference sets ──────────────────────────────────────────────
const asiIds = new Set(agenticTop10Data.map((e) => e.id));
const ciscoObjectives = new Map(
  ciscoTaxonomyData.map((o) => [o.code, new Set(o.ai_tech.map((t) => t.code))]),
);
const ciscoTechniques = new Set(ciscoTaxonomyData.flatMap((o) => o.ai_tech.map((t) => t.code)));
const aisvsIds = new Set();
if (aisvs) {
  for (const c of aisvs.chapters) {
    aisvsIds.add(c.code);
    for (const s of c.sections) {
      aisvsIds.add(s.code);
      for (const r of s.requirements) aisvsIds.add(r.id);
    }
  }
}
const mitIds = new Set(MITIGATIONS.map((m) => m.id));
const aiucReqs = new Map(aiuc1Principles.flatMap((p) => p.requirements.map((r) => [r.id, r])));

function checkAisvs(where, codes) {
  for (const c of codes ?? []) {
    if (!AISVS_CODE_RE.test(c))
      err(`${where}: AISVS code "${c}" is not a 1.01 id (C1–C12[.n[.n]])`);
    else if (aisvs && !aisvsIds.has(c))
      err(`${where}: AISVS ${c} does not exist in AISVS ${aisvs.version}`);
  }
}

// ─── Rules ───────────────────────────────────────────────────────
const seen = new Set();
const usedMitigations = new Set();
const SCOPES = new Set(["node", "edge", "path", "model"]);
const STRIDE = new Set(["S", "T", "R", "I", "D", "E"]);
for (const r of RULES) {
  const w = `rule ${r.id}`;
  if (!/^TM-[A-Z]+-\d{3}$/.test(r.id)) err(`${w}: id must look like TM-XXXX-000`);
  if (seen.has(r.id)) err(`${w}: duplicate id`);
  seen.add(r.id);
  if (!SCOPES.has(r.scope)) err(`${w}: bad scope ${r.scope}`);
  if (!r.title?.trim()) err(`${w}: missing title`);
  if (!r.description?.trim() || r.description.length < 40)
    err(`${w}: description missing or too short`);
  if (
    typeof r.when !== "function" ||
    typeof r.likelihood !== "function" ||
    typeof r.impact !== "function"
  )
    err(`${w}: when/likelihood/impact must be functions`);
  if (!r.mitigationIds?.length) err(`${w}: no mitigations`);
  for (const m of r.mitigationIds ?? []) {
    usedMitigations.add(m);
    if (!mitIds.has(m)) err(`${w}: unknown mitigation ${m}`);
  }
  const maps = r.maps ?? {};
  if (!maps.owaspAsi?.length && !maps.owaspAsiRelated?.length) warn(`${w}: no OWASP ASI mapping`);
  for (const a of [...(maps.owaspAsi ?? []), ...(maps.owaspAsiRelated ?? [])])
    if (!asiIds.has(a)) err(`${w}: unknown ASI id ${a}`);
  if (!maps.cisco?.length) warn(`${w}: no Cisco objective mapping`);
  for (const c of maps.cisco ?? [])
    if (!ciscoObjectives.has(c)) err(`${w}: unknown Cisco objective ${c}`);
  for (const t of maps.ciscoTechniques ?? []) {
    if (!ciscoTechniques.has(t)) err(`${w}: unknown Cisco technique ${t}`);
    else if (!(maps.cisco ?? []).some((o) => ciscoObjectives.get(o)?.has(t)))
      err(
        `${w}: Cisco technique ${t} is not under any of its objectives (${(maps.cisco ?? []).join(", ")})`,
      );
  }
  if (!maps.aisvs?.length) err(`${w}: no AISVS mapping`);
  checkAisvs(w, maps.aisvs);
  if (!maps.stride?.length) warn(`${w}: no STRIDE category`);
  for (const s of maps.stride ?? []) if (!STRIDE.has(s)) err(`${w}: bad STRIDE letter ${s}`);
  if (maps.catalogThreat && !threatsData[maps.catalogThreat])
    (/^t1[67]$/.test(maps.catalogThreat) ? warn : err)(
      `${w}: catalogThreat ${maps.catalogThreat} is not in securityData threatsData`,
    );
  for (const ref of r.references ?? [])
    if (!/^https:\/\//.test(ref.url)) err(`${w}: reference "${ref.title}" is not an https URL`);
}

// ─── Mitigations ─────────────────────────────────────────────────
const seenM = new Set();
for (const m of MITIGATIONS) {
  const w = `mitigation ${m.id}`;
  if (!/^MIT-[A-Z0-9-]+$/.test(m.id)) err(`${w}: id must look like MIT-XXX`);
  if (seenM.has(m.id)) err(`${w}: duplicate id`);
  seenM.add(m.id);
  if (!m.name?.trim() || !m.description?.trim()) err(`${w}: missing name/description`);
  if (!(m.effectiveness > 0 && m.effectiveness <= 1)) err(`${w}: effectiveness must be in (0, 1]`);
  if (!["design", "build", "operate"].includes(m.phase)) err(`${w}: bad phase ${m.phase}`);
  if (m.controlId && !mitigationsData[m.controlId])
    err(`${w}: controlId ${m.controlId} not in securityData`);
  checkAisvs(w, m.aisvs);
}

// ─── Compliance checks ───────────────────────────────────────────
for (const c of COMPLIANCE_CHECKS) {
  const w = `check ${c.id}`;
  for (const m of c.mitigationIds ?? []) {
    usedMitigations.add(m);
    if (!mitIds.has(m)) err(`${w}: unknown mitigation ${m}`);
  }
  checkAisvs(w, c.aisvs);
  for (const a of c.aiuc1 ?? []) {
    const req = aiucReqs.get(a);
    if (!req) err(`${w}: unknown AIUC-1 requirement ${a}`);
    else if (req.status === "retired")
      warn(`${w}: AIUC-1 ${a} is retired${req.replacedBy ? ` (→ ${req.replacedBy})` : ""}`);
  }
}
for (const m of MITIGATIONS)
  if (!usedMitigations.has(m.id)) warn(`mitigation ${m.id} is not used by any rule or check`);

// ─── Report ──────────────────────────────────────────────────────
const byScope = RULES.reduce((acc, r) => ((acc[r.scope] = (acc[r.scope] ?? 0) + 1), acc), {});
console.log(
  `check:rules — ${RULES.length} rules (${Object.entries(byScope)
    .map(([k, v]) => `${k} ${v}`)
    .join(
      ", ",
    )}), ${MITIGATIONS.length} mitigations, ${COMPLIANCE_CHECKS.length} compliance checks; AISVS ${
    aisvs ? `${aisvs.version} (${aisvsIds.size} ids)` : "built-in chapters"
  }`,
);
for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  ERROR ${e}`);
if (errors.length) {
  console.log(`check:rules failed: ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(1);
}
console.log(`check:rules passed (${warnings.length} warning(s))`);
