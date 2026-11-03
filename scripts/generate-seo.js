#!/usr/bin/env node
/**
 * Build-time SEO artefacts (IMPROVEMENT_PLAN.md P1-12), run from `postbuild`:
 *
 *   docs/sitemap.xml     every static route + every threat / control / architecture / component page
 *   docs/og/*.png        1200x630 Open Graph cards (satori -> SVG -> @resvg/resvg-js -> PNG)
 *   docs/og/index.json   list of generated slugs
 *   docs/og/.manifest.json  content-hash cache; unchanged cards are skipped on the next run
 *
 *   npm run generate:seo                      # writes into docs/
 *   node scripts/generate-seo.js --out <dir>  # write into <dir> instead (sitemap.xml + <dir>/og/)
 *   node scripts/generate-seo.js --force      # ignore the manifest and the shared cache
 *   node scripts/generate-seo.js --no-og      # sitemap only
 *
 * Slugs match `ogSlug()` in src/components/layout/seo.ts, which PageLayout uses for og:image:
 * "/" -> home, "/threats" -> threats, "/threats/t7" -> threats-t7, "/components/kc1.1" -> components-kc1.1.
 * `default.png` is the fallback card for pages that have no card of their own.
 *
 * Set SOURCE_DATE_EPOCH to pin the sitemap <lastmod> (default: today, UTC).
 *
 * Reads the route list from src/config/navigation.ts (NAV_ITEMS) plus the static, non-redirect routes
 * declared in src/App.tsx, so a page added to either shows up here without touching this script.
 * Fonts come from the `geist` package (static TTFs; satori cannot read WOFF2 or variable fonts).
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { pathToFileURL } from "url";
import ts from "typescript";
import { loadTsModule, projectRoot } from "./check-data-integrity.js";

const SITE_ORIGIN = "https://agenticsecurity.info";
const SITE_NAME = "Agentic Security Hub";
const SITE_HOST = "agenticsecurity.info";
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
/** Bump to force every card to re-render (template source changes are detected automatically). */
const DESIGN_VERSION = 1;

const cacheDir = path.join(projectRoot, "node_modules", ".cache", "asi-og");

// ── CLI ────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const opts = { out: path.join(projectRoot, "docs"), force: false, og: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") opts.out = path.resolve(argv[++i] ?? "");
    else if (arg.startsWith("--out=")) opts.out = path.resolve(arg.slice("--out=".length));
    else if (arg === "--force") opts.force = true;
    else if (arg === "--no-og") opts.og = false;
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/generate-seo.js [--out <dir>] [--force] [--no-og]");
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  if (!opts.out || opts.out === path.resolve("")) {
    console.error("--out needs a directory");
    process.exit(2);
  }
  return opts;
}

// ── Routes ─────────────────────────────────────────────────────────────────

const NAV_GROUP_LABELS = { learn: "Learn", verify: "Verify", tools: "Tools", project: "Project" };

/** NAV_ITEMS from src/config/navigation.ts, read from the AST (the module imports lucide-react). */
function readNavItems() {
  const file = path.join(projectRoot, "src/config/navigation.ts");
  const source = ts.createSourceFile(
    file,
    fs.readFileSync(file, "utf8"),
    ts.ScriptTarget.ES2022,
    true,
  );
  const items = [];
  const stringValue = (node) =>
    node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
      ? node.text
      : undefined;

  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "NAV_ITEMS" &&
      node.initializer &&
      ts.isArrayLiteralExpression(node.initializer)
    ) {
      for (const element of node.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue;
        const item = {};
        for (const prop of element.properties) {
          if (!ts.isPropertyAssignment(prop) || !ts.isIdentifier(prop.name)) continue;
          const value = stringValue(prop.initializer);
          if (value !== undefined) item[prop.name.text] = value;
        }
        if (item.path) items.push(item);
      }
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  if (items.length === 0) throw new Error("Could not read NAV_ITEMS from src/config/navigation.ts");
  return items;
}

/** Static, non-redirect page routes declared in src/App.tsx (no params, no catch-all). */
function readAppRoutes() {
  const text = fs.readFileSync(path.join(projectRoot, "src/App.tsx"), "utf8");
  const paths = [];
  for (const match of text.matchAll(/<Route\s+path="(\/[^"]*)"\s+element=\{\s*<(\w+)/g)) {
    const [, routePath, element] = match;
    if (element === "Navigate" || /[:*]/.test(routePath)) continue;
    paths.push(routePath);
  }
  return paths;
}

function titleFromPath(routePath) {
  return routePath
    .replace(/^\//, "")
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "/" -> "home", "/threats/t7" -> "threats-t7" (same rule as ogSlug in src/components/layout/seo.ts). */
function ogSlug(canonicalPath) {
  const clean = canonicalPath.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  return clean === "" ? "home" : clean.replace(/\//g, "-");
}

function collectStaticRoutes() {
  const routes = new Map();
  for (const item of readNavItems()) {
    const routePath = item.path.split("?")[0];
    if (routes.has(routePath)) continue; // palette-only shortcuts (?tab=…) share their page's route
    routes.set(routePath, {
      path: routePath,
      title: item.label,
      description: item.description,
      group: item.group,
    });
  }
  for (const routePath of readAppRoutes()) {
    if (!routes.has(routePath)) {
      routes.set(routePath, {
        path: routePath,
        title: titleFromPath(routePath),
        description: `${titleFromPath(routePath)} on the ${SITE_NAME}.`,
        group: undefined,
      });
    }
  }
  if (!routes.has("/")) {
    routes.set("/", { path: "/", title: SITE_NAME, description: "", group: "learn" });
  }
  return [...routes.values()];
}

// ── Entities (detail pages) ────────────────────────────────────────────────

/** Same thresholds as riskBand() in src/lib/severity.ts. */
function loadRiskBand() {
  try {
    const { riskBand } = loadTsModule("src/lib/severity.ts");
    if (typeof riskBand === "function") return riskBand;
  } catch {
    // fall through to the local copy
  }
  return (score) => {
    const s = Number(score);
    if (!Number.isFinite(s)) return "low";
    if (s >= 8) return "critical";
    if (s >= 6) return "high";
    if (s >= 4) return "medium";
    return "low";
  };
}

function loadEntities() {
  const security = loadTsModule("src/components/components/securityData.ts");
  const architectures = loadTsModule("src/components/components/architecturesData.ts");
  const componentMap = loadTsModule("src/components/components/componentDataMap.ts");

  const threats = Object.entries(security.threatsData ?? {}).map(([id, t]) => ({
    kind: "threat",
    id,
    path: `/threats/${id}`,
    code: String(t.code ?? id.toUpperCase()),
    name: String(t.name ?? id),
    shortName: t.shortName ? String(t.shortName) : undefined,
    description: String(t.description ?? ""),
    riskScore: typeof t.riskScore === "number" ? t.riskScore : undefined,
  }));
  const controls = Object.entries(security.mitigationsData ?? {}).map(([id, m]) => ({
    kind: "control",
    id,
    path: `/controls/${id}`,
    code: id.toUpperCase(),
    name: String(m.name ?? id),
    description: String(m.description ?? ""),
  }));
  const architectureList = Object.entries(architectures.architecturesData ?? {}).map(([id, a]) => ({
    kind: "architecture",
    id,
    path: `/architectures/${id}`,
    code: "",
    name: String(a.name ?? id),
    description: String(a.description ?? ""),
  }));
  const components = Object.entries(componentMap.componentDataMap ?? {}).map(([id, c]) => ({
    kind: /^kc\d+$/i.test(id) ? "kc" : "component",
    id,
    path: `/components/${id}`,
    code: id.toUpperCase(),
    name: String(c.title ?? id),
    description: String(c.description ?? ""),
  }));
  return { threats, controls, architectures: architectureList, components };
}

// ── Sitemap ────────────────────────────────────────────────────────────────

const PRIMARY_PATHS = new Set([
  "/threats",
  "/controls",
  "/architectures",
  "/components",
  "/aisvs",
  "/nist-mapping",
  "/taxonomy",
  "/threat-modeler",
]);

function lastmodDate() {
  const epoch = Number(process.env.SOURCE_DATE_EPOCH);
  const date = Number.isFinite(epoch) && epoch > 0 ? new Date(epoch * 1000) : new Date();
  return date.toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildSitemap(staticRoutes, entities) {
  const lastmod = lastmodDate();
  const urls = [];
  const seen = new Set();
  const add = (routePath, changefreq, priority) => {
    if (seen.has(routePath)) return;
    seen.add(routePath);
    urls.push({
      loc: `${SITE_ORIGIN}${routePath === "/" ? "/" : routePath}`,
      changefreq,
      priority,
    });
  };

  for (const route of staticRoutes) {
    if (route.path === "/") add("/", "weekly", "1.0");
    else if (PRIMARY_PATHS.has(route.path)) add(route.path, "monthly", "0.9");
    else add(route.path, "monthly", "0.6");
  }
  for (const entity of [...entities.threats, ...entities.controls]) {
    add(entity.path, "monthly", "0.7");
  }
  for (const entity of [...entities.architectures, ...entities.components]) {
    add(entity.path, "monthly", entity.kind === "kc" ? "0.7" : "0.6");
  }

  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
    )
    .join("\n");
  return {
    xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`,
    count: urls.length,
  };
}

// ── OG card specs ──────────────────────────────────────────────────────────

const BAND = {
  critical: { color: "#ef4444", label: "CRITICAL" },
  high: { color: "#f97316", label: "HIGH" },
  medium: { color: "#f59e0b", label: "MEDIUM" },
  low: { color: "#22c55e", label: "LOW" },
};

const BRAND_BLUE = "#3b82f6";
const BRAND_VIOLET = "#a78bfa";

/** Section accent for pages without a risk band. */
const SECTION_ACCENT = {
  threat: "#ef4444",
  control: "#38bdf8",
  architecture: "#a78bfa",
  component: "#34d399",
  kc: "#34d399",
  page: BRAND_BLUE,
};

/** Plain text for a card: no markdown, one line of whitespace, only glyphs Geist ships. */
function cleanText(value) {
  return String(value ?? "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_`#>]+/g, "")
    .replace(/[→↔]/g, "->")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/×/g, "x")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^ -~ -ÿ–—…·]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** First sentence when it is long enough to stand alone, otherwise the whole text. */
function summarise(value) {
  const text = cleanText(value);
  const match = text.match(/^(.{50,}?[.!?])(\s|$)/);
  return match ? match[1] : text;
}

function pageDescription(route, counts) {
  if (route.path === "/") {
    return `${counts.threats} threats, ${counts.controls} controls and ${counts.architectures} architectures for agentic AI, mapped to OWASP AISVS and NIST AI RMF.`;
  }
  return route.description;
}

function buildCardSpecs(staticRoutes, entities, riskBand) {
  const counts = {
    threats: entities.threats.length,
    controls: entities.controls.length,
    architectures: entities.architectures.length,
  };
  const specs = [];

  for (const route of staticRoutes) {
    const isHome = route.path === "/";
    specs.push({
      slug: ogSlug(route.path),
      path: route.path,
      eyebrow: isHome
        ? "AGENTIC AI SECURITY"
        : (NAV_GROUP_LABELS[route.group] ?? "Agentic Security").toUpperCase(),
      title: isHome ? SITE_NAME : route.title,
      description: summarise(pageDescription(route, counts)),
      accent: SECTION_ACCENT.page,
      accent2: BRAND_VIOLET,
    });
  }

  specs.push({
    slug: "default",
    path: "/",
    eyebrow: "AGENTIC AI SECURITY",
    title: SITE_NAME,
    description: summarise(pageDescription({ path: "/" }, counts)),
    accent: SECTION_ACCENT.page,
    accent2: BRAND_VIOLET,
  });

  for (const t of entities.threats) {
    const band = riskBand(t.riskScore);
    const title = t.name.length > 50 && t.shortName ? t.shortName : t.name;
    specs.push({
      slug: ogSlug(t.path),
      path: t.path,
      eyebrow: `THREAT · ${t.code}`,
      title: cleanText(title),
      description: summarise(t.description),
      accent: BAND[band].color,
      accent2: BAND[band].color,
      risk: t.riskScore === undefined ? undefined : { band, score: t.riskScore },
    });
  }
  for (const c of entities.controls) {
    specs.push({
      slug: ogSlug(c.path),
      path: c.path,
      eyebrow: `CONTROL · ${c.code}`,
      title: cleanText(c.name),
      description: summarise(c.description),
      accent: SECTION_ACCENT.control,
      accent2: BRAND_BLUE,
    });
  }
  for (const a of entities.architectures) {
    specs.push({
      slug: ogSlug(a.path),
      path: a.path,
      eyebrow: "ARCHITECTURE",
      title: cleanText(a.name),
      description: summarise(a.description),
      accent: SECTION_ACCENT.architecture,
      accent2: BRAND_BLUE,
    });
  }
  for (const c of entities.components) {
    specs.push({
      slug: ogSlug(c.path),
      path: c.path,
      eyebrow: `${c.kind === "kc" ? "KEY COMPONENT" : "COMPONENT"} · ${c.code}`,
      title: cleanText(c.name),
      description: summarise(c.description),
      accent: SECTION_ACCENT.component,
      accent2: BRAND_BLUE,
    });
  }

  const duplicate = specs.map((s) => s.slug).find((slug, i, all) => all.indexOf(slug) !== i);
  if (duplicate) throw new Error(`Duplicate OG slug: ${duplicate}`);
  return specs;
}

// ── OG card rendering ──────────────────────────────────────────────────────

/** satori element: text-only nodes stay block (needed for lineClamp), everything else is flex. */
function h(type, style, ...children) {
  const kids = children.flat().filter((child) => child !== null && child !== undefined);
  const textOnly = kids.every((child) => typeof child === "string");
  const base = textOnly ? {} : { display: "flex" };
  return {
    type,
    props: {
      style: { ...base, ...style },
      children: kids.length === 1 ? kids[0] : kids,
    },
  };
}

function riskMeter(risk) {
  const color = BAND[risk.band].color;
  const filled = Math.max(0, Math.min(10, Math.round(risk.score)));
  const segments = Array.from({ length: 10 }, (_, i) =>
    h("div", {
      width: 54,
      height: 12,
      marginRight: i === 9 ? 0 : 8,
      borderRadius: 3,
      background: i < filled ? color : "#27272a",
    }),
  );
  return h(
    "div",
    { alignItems: "center", marginBottom: 34 },
    h("div", {}, segments),
    h(
      "div",
      {
        marginLeft: 28,
        fontFamily: "Geist Mono",
        fontSize: 24,
        fontWeight: 500,
        letterSpacing: "0.1em",
        color,
      },
      `RISK ${risk.score}/10 · ${BAND[risk.band].label}`,
    ),
  );
}

function cardTree(spec) {
  const titleSize = spec.title.length <= 22 ? 84 : spec.title.length <= 40 ? 70 : 58;
  return h(
    "div",
    {
      position: "relative",
      width: OG_WIDTH,
      height: OG_HEIGHT,
      flexDirection: "column",
      background: "#09090b",
      color: "#fafafa",
      fontFamily: "Geist",
    },
    // faint grid
    h("div", {
      position: "absolute",
      top: 0,
      left: 0,
      width: OG_WIDTH,
      height: OG_HEIGHT,
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      backgroundSize: "48px 48px",
    }),
    // accent glow, top right
    h("div", {
      position: "absolute",
      top: 0,
      left: 0,
      width: OG_WIDTH,
      height: OG_HEIGHT,
      backgroundImage: `radial-gradient(circle at 100% 0%, ${spec.accent}33 0%, transparent 55%)`,
    }),
    // top strip: risk band colour for threats, section accent elsewhere
    h("div", {
      position: "absolute",
      top: 0,
      left: 0,
      width: OG_WIDTH,
      height: 12,
      backgroundImage: `linear-gradient(90deg, ${spec.accent}, ${spec.accent2})`,
    }),
    h(
      "div",
      {
        position: "relative",
        flexDirection: "column",
        flexGrow: 1,
        padding: "68px 80px 48px 80px",
      },
      // eyebrow
      h(
        "div",
        { alignItems: "center" },
        h("div", {
          width: 14,
          height: 14,
          borderRadius: 7,
          background: spec.accent,
          marginRight: 18,
        }),
        h(
          "div",
          {
            fontFamily: "Geist Mono",
            fontSize: 26,
            fontWeight: 500,
            letterSpacing: "0.16em",
            color: "#a1a1aa",
          },
          spec.eyebrow,
        ),
      ),
      // title
      h(
        "div",
        {
          marginTop: 36,
          fontSize: titleSize,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          color: "#fafafa",
          lineClamp: 2,
          maxWidth: 1040,
        },
        spec.title,
      ),
      // description
      spec.description
        ? h(
            "div",
            {
              marginTop: 28,
              fontSize: 31,
              fontWeight: 400,
              lineHeight: 1.38,
              color: "#a1a1aa",
              lineClamp: 2,
              maxWidth: 1000,
            },
            spec.description,
          )
        : null,
      h("div", { flexGrow: 1, minHeight: 24 }),
      spec.risk ? riskMeter(spec.risk) : null,
      // footer
      h(
        "div",
        {
          alignItems: "center",
          borderTop: "1px solid #27272a",
          paddingTop: 28,
        },
        h(
          "div",
          { alignItems: "center" },
          h(
            "div",
            {
              fontFamily: "Geist Mono",
              fontSize: 38,
              fontWeight: 700,
              color: BRAND_VIOLET,
              marginRight: 18,
            },
            ">_",
          ),
          h(
            "div",
            { fontSize: 29, fontWeight: 600, color: "#e4e4e7", whiteSpace: "nowrap" },
            SITE_NAME,
          ),
          h(
            "div",
            {
              fontSize: 29,
              fontWeight: 400,
              color: "#71717a",
              marginLeft: 12,
              whiteSpace: "nowrap",
            },
            `· ${SITE_HOST}`,
          ),
        ),
      ),
    ),
  );
}

function loadFonts() {
  const dir = path.join(projectRoot, "node_modules/geist/dist/fonts");
  const files = [
    ["Geist", 400, "geist-sans/Geist-Regular.ttf"],
    ["Geist", 600, "geist-sans/Geist-SemiBold.ttf"],
    ["Geist", 700, "geist-sans/Geist-Bold.ttf"],
    ["Geist Mono", 400, "geist-mono/GeistMono-Regular.ttf"],
    ["Geist Mono", 500, "geist-mono/GeistMono-Medium.ttf"],
    ["Geist Mono", 700, "geist-mono/GeistMono-Bold.ttf"],
  ];
  const fonts = [];
  const hash = crypto.createHash("sha256");
  for (const [name, weight, file] of files) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) {
      throw new Error(
        `Font not found: ${path.relative(projectRoot, full)} (run npm ci; the geist package ships static TTFs)`,
      );
    }
    const data = fs.readFileSync(full);
    hash.update(data);
    fonts.push({ name, data, weight, style: "normal" });
  }
  return { fonts, hash: hash.digest("hex").slice(0, 16) };
}

/** The template's own source is part of the hash, so editing the design invalidates cached cards. */
const TEMPLATE_FINGERPRINT = [h, riskMeter, cardTree, optimizePng]
  .map((fn) => fn.toString())
  .join("\n");

function specHash(spec, fontHash) {
  return crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        v: DESIGN_VERSION,
        w: OG_WIDTH,
        h: OG_HEIGHT,
        f: fontHash,
        t: TEMPLATE_FINGERPRINT,
        b: BAND,
        spec,
      }),
    )
    .digest("hex")
    .slice(0, 24);
}

// ── PNG recompression ──────────────────────────────────────────────────────
// resvg writes RGBA with a fast encoder. The cards are opaque, so drop the alpha channel, pick the
// best filter per row and deflate at level 9: ~40% smaller, still a plain 8-bit PNG. Any surprise
// (interlaced, 16-bit, palette) returns the input unchanged.

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function filterPredictor(type, a, b, c) {
  if (type === 0) return 0;
  if (type === 1) return a;
  if (type === 2) return b;
  if (type === 3) return (a + b) >> 1;
  return paeth(a, b, c);
}

function optimizePng(png) {
  let pos = 8;
  let ihdr;
  const idat = [];
  while (pos < png.length) {
    const length = png.readUInt32BE(pos);
    const type = png.toString("ascii", pos + 4, pos + 8);
    const data = png.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") ihdr = data;
    else if (type === "IDAT") idat.push(data);
    pos += 12 + length;
  }
  if (!ihdr) return png;
  const width = ihdr.readUInt32BE(0);
  const height = ihdr.readUInt32BE(4);
  const depth = ihdr[8];
  const colorType = ihdr[9];
  const interlace = ihdr[12];
  if (depth !== 8 || colorType !== 6 || interlace !== 0) return png;

  // Undo the encoder's row filters -> raw RGBA.
  const bpp = 4;
  const stride = width * bpp;
  const filtered = zlib.inflateSync(Buffer.concat(idat));
  const rgba = Buffer.alloc(height * stride);
  for (let y = 0; y < height; y += 1) {
    const type = filtered[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x += 1) {
      const a = x >= bpp ? rgba[y * stride + x - bpp] : 0;
      const b = y > 0 ? rgba[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? rgba[(y - 1) * stride + x - bpp] : 0;
      rgba[y * stride + x] = (filtered[src + x] + filterPredictor(type, a, b, c)) & 255;
    }
  }

  let opaque = true;
  for (let i = 3; i < rgba.length; i += 4) {
    if (rgba[i] !== 255) {
      opaque = false;
      break;
    }
  }
  const channels = opaque ? 3 : 4;
  const rowLength = width * channels;
  const pixels = Buffer.alloc(height * rowLength);
  for (let i = 0, j = 0; i < rgba.length; i += 4) {
    pixels[j++] = rgba[i];
    pixels[j++] = rgba[i + 1];
    pixels[j++] = rgba[i + 2];
    if (!opaque) pixels[j++] = rgba[i + 3];
  }

  // Re-filter each row with the type that minimises the sum of absolute residuals.
  const out = Buffer.alloc(height * (rowLength + 1));
  const candidates = [0, 1, 2, 3, 4].map(() => Buffer.alloc(rowLength));
  for (let y = 0; y < height; y += 1) {
    let best = 0;
    let bestScore = Infinity;
    for (let type = 0; type < 5; type += 1) {
      let score = 0;
      const row = candidates[type];
      for (let x = 0; x < rowLength; x += 1) {
        const a = x >= channels ? pixels[y * rowLength + x - channels] : 0;
        const b = y > 0 ? pixels[(y - 1) * rowLength + x] : 0;
        const c = x >= channels && y > 0 ? pixels[(y - 1) * rowLength + x - channels] : 0;
        const residual = (pixels[y * rowLength + x] - filterPredictor(type, a, b, c)) & 255;
        row[x] = residual;
        score += residual < 128 ? residual : 256 - residual;
      }
      if (score < bestScore) {
        bestScore = score;
        best = type;
      }
    }
    out[y * (rowLength + 1)] = best;
    candidates[best].copy(out, y * (rowLength + 1) + 1);
  }

  const header = Buffer.from(ihdr);
  header[9] = opaque ? 2 : 6;
  const optimized = Buffer.concat([
    png.subarray(0, 8),
    pngChunk("IHDR", header),
    pngChunk("IDAT", zlib.deflateSync(out, { level: 9, memLevel: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
  return optimized.length < png.length ? optimized : png;
}

/** Path for log lines: relative to the cwd when inside it, absolute otherwise. */
function displayPath(target) {
  const relative = path.relative(process.cwd(), target);
  return relative && !relative.startsWith("..") ? relative : target;
}

function readJsonSafe(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return undefined;
  }
}

async function generateOgImages(specs, outDir, { force }) {
  const ogDir = path.join(outDir, "og");
  fs.mkdirSync(ogDir, { recursive: true });
  fs.mkdirSync(cacheDir, { recursive: true });

  const manifestPath = path.join(ogDir, ".manifest.json");
  const previous = force ? undefined : readJsonSafe(manifestPath);
  const previousFiles = previous?.version === DESIGN_VERSION ? (previous.files ?? {}) : {};

  const { fonts, hash: fontHash } = loadFonts();
  let satori;
  let Resvg;
  const files = {};
  const stats = { rendered: 0, cached: 0, skipped: 0 };

  for (const spec of specs) {
    const file = path.join(ogDir, `${spec.slug}.png`);
    const hash = specHash(spec, fontHash);
    files[spec.slug] = hash;

    if (!force && previousFiles[spec.slug] === hash && fs.existsSync(file)) {
      stats.skipped += 1;
      continue;
    }
    const cached = path.join(cacheDir, `${hash}.png`);
    if (!force && fs.existsSync(cached)) {
      fs.copyFileSync(cached, file);
      stats.cached += 1;
      continue;
    }

    if (!satori) {
      satori = (await import("satori")).default;
      Resvg = (await import("@resvg/resvg-js")).Resvg;
    }
    const svg = await satori(cardTree(spec), { width: OG_WIDTH, height: OG_HEIGHT, fonts });
    const rendered = new Resvg(svg, {
      fitTo: { mode: "width", value: OG_WIDTH },
      font: { loadSystemFonts: false },
    })
      .render()
      .asPng();
    let png = rendered;
    try {
      png = optimizePng(rendered);
    } catch {
      // keep resvg's own encoding
    }
    fs.writeFileSync(file, png);
    fs.writeFileSync(cached, png);
    stats.rendered += 1;
  }

  // Remove cards this tool wrote earlier for entities that no longer exist.
  for (const slug of Object.keys(previousFiles)) {
    if (!(slug in files)) fs.rmSync(path.join(ogDir, `${slug}.png`), { force: true });
  }

  // The shared cache only needs the current cards.
  const live = new Set(Object.values(files).map((hash) => `${hash}.png`));
  for (const name of fs.readdirSync(cacheDir)) {
    if (name.endsWith(".png") && !live.has(name))
      fs.rmSync(path.join(cacheDir, name), { force: true });
  }

  const slugs = Object.keys(files).sort();
  fs.writeFileSync(
    manifestPath,
    `${JSON.stringify({ version: DESIGN_VERSION, files }, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(ogDir, "index.json"),
    `${JSON.stringify({ width: OG_WIDTH, height: OG_HEIGHT, count: slugs.length, slugs }, null, 2)}\n`,
  );
  return { ...stats, total: slugs.length, ogDir };
}

// ── Main ───────────────────────────────────────────────────────────────────

export async function main(argv = process.argv.slice(2)) {
  const started = Date.now();
  const opts = parseArgs(argv);

  const staticRoutes = collectStaticRoutes();
  const entities = loadEntities();

  fs.mkdirSync(opts.out, { recursive: true });
  const sitemap = buildSitemap(staticRoutes, entities);
  fs.writeFileSync(path.join(opts.out, "sitemap.xml"), sitemap.xml);
  console.log(
    `sitemap.xml: ${sitemap.count} URLs (${staticRoutes.length} pages, ${entities.threats.length} threats, ${entities.controls.length} controls, ${entities.architectures.length} architectures, ${entities.components.length} components) -> ${displayPath(path.join(opts.out, "sitemap.xml"))}`,
  );

  if (opts.og) {
    const specs = buildCardSpecs(staticRoutes, entities, loadRiskBand());
    const result = await generateOgImages(specs, opts.out, opts);
    console.log(
      `og/: ${result.total} cards (${result.rendered} rendered, ${result.cached} from cache, ${result.skipped} unchanged) -> ${displayPath(result.ogDir)}`,
    );
  }
  console.log(`generate-seo done in ${((Date.now() - started) / 1000).toFixed(1)}s`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("generate-seo failed:", error);
    process.exit(1);
  });
}
