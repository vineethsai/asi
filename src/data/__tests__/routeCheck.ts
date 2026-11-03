/**
 * Test helper: does a site path resolve to a real route and a real entity?
 * Route patterns are read from src/App.tsx so new routes are picked up automatically.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { threatsData, mitigationsData } from "@/components/components/securityData";
import { architecturesData } from "@/components/components/architecturesData";
import { componentDataMap } from "@/components/components/componentDataMap";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { aisvsData, isAisvsCode } from "@/data/aisvs";
import { NIST_AISVS_REMAP } from "@/data/nistAisvsRemap";

const appSource = readFileSync(resolve(__dirname, "../../App.tsx"), "utf8");

export const ROUTE_PATTERNS: RegExp[] = [...appSource.matchAll(/path="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((p) => p !== "*")
  .map((p) => new RegExp(`^${p.replace(/:[A-Za-z]+/g, "[^/]+")}$`));

/** Returns an error message, or null when the path is valid. */
export function checkSitePath(href: string): string | null {
  if (!href.startsWith("/")) return `not a site path: ${href}`;
  const url = new URL(href, "https://example.test");
  const path = decodeURIComponent(url.pathname);
  if (!ROUTE_PATTERNS.some((re) => re.test(path))) return `no route for ${path}`;
  const [, section, id] = path.split("/");
  if (id) {
    const ok =
      (section === "threats" && id in threatsData) ||
      (section === "controls" && id in mitigationsData) ||
      (section === "architectures" && id in architecturesData) ||
      (section === "components" && (id in componentDataMap || /^kc[1-6]$/.test(id))) ||
      section === "learn" ||
      section === "scenarios";
    if (!ok) return `unknown ${section} id ${id}`;
  }
  if (path === "/aisvs" && url.hash) {
    const code = url.hash.slice(1);
    if (!(code in aisvsData) && !isAisvsCode(code)) return `unknown AISVS anchor ${code}`;
  }
  const entry = url.searchParams.get("entry");
  if (path === "/taxonomy" && entry && url.searchParams.get("tab") === "owasp-agentic") {
    if (!agenticTop10Data.some((e) => e.id === entry)) return `unknown ASI entry ${entry}`;
  }
  const sub = url.searchParams.get("sub");
  if (path === "/nist-mapping" && sub && !(sub in NIST_AISVS_REMAP)) return `unknown NIST ${sub}`;
  return null;
}
