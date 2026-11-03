import type { ReportModel, ReportSection, ReportTable } from "./reportModel";
import { downloadBlob, exportFilename } from "./download";

const cell = (s: string) => (s ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim() || " ";

const anchor = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .trim()
    .replace(/\s+/g, "-");

function table(t: ReportTable): string {
  let md = t.title ? `**${t.title}**\n\n` : "";
  if (t.rows.length === 0) return `${md}_None._\n\n`;
  md += `| ${t.columns.map(cell).join(" | ")} |\n|${t.columns.map(() => " --- ").join("|")}|\n`;
  for (const r of t.rows) md += `| ${r.map(cell).join(" | ")} |\n`;
  if (t.note) md += `\n_${t.note}_\n`;
  return `${md}\n`;
}

function section(s: ReportSection, level: number): string {
  let md = `${"#".repeat(level)} ${s.title}\n\n`;
  for (const p of s.paragraphs ?? []) md += `${p}\n\n`;
  for (const t of s.tables ?? []) md += table(t);
  if (s.bullets?.length) md += `${s.bullets.map((b) => `- ${b}`).join("\n")}\n\n`;
  for (const c of s.children ?? []) md += section(c, level + 1);
  return md;
}

/** Render the shared report model as GitHub-flavoured Markdown. */
export function renderMarkdown(model: ReportModel): string {
  const h = model.headline;
  let md = `# ${model.title}: ${model.modelName}\n\n`;
  md += `_${model.indicativeNote} Generated ${model.generatedAt.slice(0, 19).replace("T", " ")} UTC by engine ${model.engineVersion}._\n\n`;
  md += `| Model score | Inherent | Threats | Open | Mitigated | Components | Flows | Boundaries | Attack paths |\n|---|---|---|---|---|---|---|---|---|\n`;
  md += `| **${h.score}/100 (${h.label})** | ${h.inherent}/100 | ${h.threats} | ${h.open} | ${h.mitigated} | ${h.components} | ${h.flows} | ${h.boundaries} | ${h.paths}${h.pathsTruncated ? "+" : ""} |\n\n`;
  md += `## Contents\n\n${model.sections.map((s) => `- [${s.title}](#${anchor(s.title)})`).join("\n")}\n\n`;
  for (const s of model.sections) md += section(s, 2);
  md += `## Approval\n\n| Role | Name | Date | Signature |\n|---|---|---|---|\n`;
  for (const a of model.approval) md += `| ${a.role} | ${a.name || " "} | ${a.date || " "} | |\n`;
  return md;
}

export function downloadMarkdownReport(model: ReportModel, filename?: string): void {
  downloadBlob(
    renderMarkdown(model),
    filename ?? exportFilename(model.modelName, "md"),
    "text/markdown;charset=utf-8",
  );
}
