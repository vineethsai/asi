/** AISVS progress export (CSV / JSON) — IMPROVEMENT_PLAN §6.6. Pure builders + a download helper. */
import { AISVS_VERSION, aisvsData, aisvsRequirements, source } from "@/data/aisvs";

const csvCell = (v: string | number) => {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per requirement: id, citation, chapter, section, level, verified, text. */
export function buildAisvsCsv(checked: ReadonlySet<string>): string {
  const header = ["id", "citation", "chapter", "section", "level", "verified", "text"];
  const rows = aisvsRequirements.map((r) => [
    r.id,
    r.citation,
    `${r.category} ${aisvsData[r.category]?.name ?? ""}`.trim(),
    r.section,
    r.level,
    checked.has(r.id) ? "yes" : "no",
    r.text,
  ]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function buildAisvsJson(checked: ReadonlySet<string>, exportedAt = new Date()): string {
  const verified = aisvsRequirements.filter((r) => checked.has(r.id)).map((r) => r.id);
  const byLevel = ([1, 2, 3] as const).map((level) => {
    const ids = aisvsRequirements.filter((r) => r.level === level);
    return {
      level,
      total: ids.length,
      verified: ids.filter((r) => checked.has(r.id)).length,
    };
  });
  return JSON.stringify(
    {
      schema: "ash-aisvs-progress/1",
      standard: { name: source.name, version: AISVS_VERSION, url: source.url },
      exportedAt: exportedAt.toISOString(),
      total: aisvsRequirements.length,
      verifiedCount: verified.length,
      byLevel,
      verified,
    },
    null,
    2,
  );
}

export function downloadText(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Copy text to the clipboard (async API with a textarea fallback). */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
