/**
 * "Share my badge" (P4-05): a 1200×630 SVG summarising progress, rasterised to PNG on a canvas
 * entirely in the browser. The badge uses a fixed dark palette (it is an image that leaves the
 * site, so it must not follow the viewer's theme); ring colours come from the severity ramp
 * fallbacks in src/lib/severity.ts. System fonts only — an SVG drawn into <img> cannot load
 * web fonts.
 */
import { SEVERITY_FALLBACKS, type Band } from "@/lib/severity";
import { SITE_NAME, SITE_ORIGIN } from "@/components/layout/seo";
import type { BadgeStats, Fraction } from "./progressStats";

export const BADGE_WIDTH = 1200;
export const BADGE_HEIGHT = 630;

const BG = "#09090b";
const PANEL = "#18181b";
const BORDER = "#27272a";
const TEXT = "#fafafa";
const MUTED = "#a1a1aa";
const PRIMARY = "#818cf8";
const SANS =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const hsl = (band: Band) => `hsl(${SEVERITY_FALLBACKS[band].base.dark.replace(/ /g, ", ")})`;

/** Same walk as the Ring "progress" tone: high → medium → info → low (green at 100 %). */
function progressColor(percent: number): string {
  if (percent >= 100) return hsl("low");
  if (percent >= 60) return hsl("info");
  if (percent >= 30) return hsl("medium");
  return hsl("high");
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function ring(cx: number, cy: number, f: Fraction, label: string, detail: string): string {
  const r = 92;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(100, f.percent));
  return `
  <g>
    <rect x="${cx - 130}" y="${cy - 130}" width="260" height="330" rx="20" fill="${PANEL}" stroke="${BORDER}" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${BORDER}" stroke-width="18" />
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${progressColor(p)}" stroke-width="18"
      stroke-linecap="${p > 0 ? "round" : "butt"}" stroke-dasharray="${c.toFixed(2)}"
      stroke-dashoffset="${(c * (1 - p / 100)).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})" />
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-family="${MONO}" font-size="46" font-weight="700" fill="${TEXT}">${p}%</text>
    <text x="${cx}" y="${cy + 140}" text-anchor="middle" font-family="${SANS}" font-size="26" font-weight="600" fill="${TEXT}">${esc(label)}</text>
    <text x="${cx}" y="${cy + 174}" text-anchor="middle" font-family="${SANS}" font-size="20" fill="${MUTED}">${esc(detail)}</text>
  </g>`;
}

export function buildBadgeSvg(stats: BadgeStats, date: Date = new Date()): string {
  const day = date.toISOString().slice(0, 10);
  const host = SITE_ORIGIN.replace(/^https?:\/\//, "");
  const xs = [165, 455, 745, 1035];
  const rings = [
    ring(
      xs[0],
      300,
      stats.aisvs,
      "AISVS",
      `${stats.aisvs.done} / ${stats.aisvs.total} requirements`,
    ),
    ring(
      xs[1],
      300,
      stats.controls,
      "Controls",
      `${stats.controls.done} / ${stats.controls.total} tasks`,
    ),
    ring(xs[2], 300, stats.path, "Learning path", `${stats.path.done} / ${stats.path.total} steps`),
    ring(
      xs[3],
      300,
      stats.quizzes,
      "Quizzes",
      `${stats.quizzes.done} / ${stats.quizzes.total} passed`,
    ),
  ].join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" viewBox="0 0 ${BADGE_WIDTH} ${BADGE_HEIGHT}">
  <rect width="100%" height="100%" fill="${BG}" />
  <rect x="0" y="0" width="${BADGE_WIDTH}" height="6" fill="${PRIMARY}" />
  <text x="35" y="78" font-family="${MONO}" font-size="28" fill="${PRIMARY}">&gt;_</text>
  <text x="85" y="78" font-family="${SANS}" font-size="28" font-weight="600" fill="${TEXT}">${esc(SITE_NAME)}</text>
  <text x="35" y="128" font-family="${SANS}" font-size="40" font-weight="700" fill="${TEXT}">My agentic security progress</text>
  ${rings}
  <text x="35" y="${BADGE_HEIGHT - 28}" font-family="${MONO}" font-size="20" fill="${MUTED}">${esc(host)}</text>
  <text x="${BADGE_WIDTH - 35}" y="${BADGE_HEIGHT - 28}" text-anchor="end" font-family="${MONO}" font-size="20" fill="${MUTED}">${day}</text>
</svg>`;
}

export function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Rasterise an SVG string to a PNG blob (client-side canvas). */
export function svgToPng(svg: string, width = BADGE_WIDTH, height = BADGE_HEIGHT): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas is not available."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("PNG export failed."))),
        "image/png",
      );
    };
    img.onerror = () => reject(new Error("Could not render the badge."));
    img.src = svgDataUrl(svg);
  });
}

/** Save a blob as a file via a temporary object URL. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
