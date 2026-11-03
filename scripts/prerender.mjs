#!/usr/bin/env node
/**
 * Static HTML for every route (run from `postbuild`, after scripts/generate-seo.js).
 *
 * GitHub Pages serves unknown paths from 404.html with HTTP 404, and crawlers / link-preview bots
 * that do not run JavaScript only ever saw the generic SPA shell. This writes one HTML file per
 * route of the site model (scripts/seo-model.mjs), each one the built index.html with
 *
 *   - the route's <title>, description, robots, canonical, Open Graph / Twitter tags and JSON-LD
 *     (marked data-react-helmet so react-helmet takes them over when the app boots), plus
 *     prerender-only JSON-LD (ItemList, DefinedTermSet, …) marked data-prerender-ld;
 *   - a semantic, styled HTML rendering of the page's content inside <div id="root">, generated
 *     from the data modules (not a React SSR). main.tsx uses createRoot().render(), which clears
 *     the container on the first commit, so the app replaces it.
 *
 * Layout (GitHub Pages maps /a/b to a/b.html without a redirect, dotted names included):
 *   docs/index.html                 "/"
 *   docs/threats/t7.html            "/threats/t7"
 *   docs/components/kc4.2.html      "/components/kc4.2"
 *   docs/threats.html + docs/threats/index.html
 *                                   catalogs whose name is also a directory: Pages may answer
 *                                   /threats from threats.html or redirect to /threats/; both work
 *   docs/404.html                   the plain SPA shell, robots noindex
 *   docs/cisco-taxonomy.html, …     redirect stubs for the <Navigate> routes in App.tsx
 *   docs/threats/today.html         SPA shell (client-side redirect), noindex
 *
 *   node scripts/prerender.mjs [--out docs]
 *
 * Every URL in docs/sitemap.xml must be rendered; the run fails otherwise.
 */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { buildDateFromEnv, buildSiteModel, loadSiteModules, projectRoot } from "./seo-model.mjs";

// ── HTML helpers ───────────────────────────────────────────────────────────

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const LINK = "font-medium text-primary underline-offset-2 hover:underline";
const MUTED = "text-muted-foreground";
const H2 = "text-xl font-semibold tracking-tight";
const H3 = "font-semibold";
const CARD = "rounded-lg border bg-card p-4";
const CHIP =
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-muted-foreground";
const LIST = "list-disc space-y-1 pl-5";
const CODE = "font-mono text-xs text-muted-foreground";

const join = (parts) => parts.filter(Boolean).join("");

/** Internal or external link; external links open safely and are marked as such. */
function link(href, label, className = LINK) {
  const external = /^https?:\/\//i.test(href);
  return external
    ? `<a href="${esc(href)}" class="${className}" rel="noopener noreferrer" target="_blank">${label}</a>`
    : `<a href="${esc(href)}" class="${className}">${label}</a>`;
}

function chip(text) {
  return text ? `<span class="${CHIP}">${esc(text)}</span>` : "";
}

function bullets(items, className = `${LIST} text-sm`) {
  const list = items.filter(Boolean);
  return list.length
    ? `<ul class="${className}">${list.map((i) => `<li>${i}</li>`).join("")}</ul>`
    : "";
}

function para(text, className = "max-w-3xl leading-relaxed") {
  return text ? `<p class="${className}">${text}</p>` : "";
}

function section(id, title, body, intro) {
  if (!body) return "";
  return `<section id="${esc(id)}" aria-labelledby="${esc(id)}-title" class="mt-10 space-y-4"><h2 id="${esc(id)}-title" class="${H2}">${esc(title)}</h2>${intro ? para(intro, `max-w-3xl text-sm ${MUTED}`) : ""}${body}</section>`;
}

/** Card grid of linked items: { href, code?, title, text?, meta? } (meta is HTML). */
function cardList(items, { columns = "md:grid-cols-2", heading = "h3" } = {}) {
  if (!items.length) return "";
  return `<ul class="grid gap-3 ${columns}">${items
    .map(
      (item) =>
        `<li class="${CARD}"><${heading} class="${H3}">${link(
          item.href,
          `${item.code ? `<span class="${CODE}">${esc(item.code)}</span> ` : ""}${esc(item.title)}`,
          "hover:text-primary hover:underline",
        )}</${heading}>${item.text ? `<p class="mt-1 text-sm ${MUTED}">${item.text}</p>` : ""}${
          item.meta ? `<p class="mt-2 text-xs ${MUTED}">${item.meta}</p>` : ""
        }</li>`,
    )
    .join("")}</ul>`;
}

function table(headers, rows) {
  if (!rows.length) return "";
  return `<div class="overflow-x-auto rounded-lg border"><table class="w-full text-left text-sm"><thead class="bg-muted/40"><tr>${headers
    .map((h) => `<th scope="col" class="px-3 py-2 font-semibold">${esc(h)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map(
      (row) =>
        `<tr class="border-t align-top">${row.map((cell) => `<td class="px-3 py-2">${cell}</td>`).join("")}</tr>`,
    )
    .join("")}</tbody></table></div>`;
}

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// ── Rich text (the light markdown of the data modules) ─────────────────────

function createFormatter(mods) {
  const threats = mods.security.threatsData;
  const controls = mods.security.mitigationsData;
  const asi = new Set(mods.top10.agenticTop10Data.map((e) => e.code));
  const INLINE =
    /`([^`]+)`|\*\*([^*]+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)|\b(T\d{1,2})\b|\b(M\d{1,2})\b|\b(ASI\d{2})\b|\b((?:AISVS )?C\d{1,2}\.\d{1,2}(?:\.\d{1,2})?)\b/g;

  /** Inline formatting: code, bold, links and threat / control / ASI / AISVS codes. */
  function inline(text, allowBold = true) {
    const source = String(text ?? "");
    let out = "";
    let last = 0;
    for (const m of source.matchAll(INLINE)) {
      out += esc(source.slice(last, m.index));
      last = m.index + m[0].length;
      const [whole, code, bold, label, href, t, c, a, aisvs] = m;
      if (code !== undefined)
        out += `<code class="rounded bg-muted px-1 py-0.5 font-mono text-[0.92em]">${esc(code)}</code>`;
      else if (bold !== undefined)
        out += allowBold ? `<strong>${inline(bold, false)}</strong>` : esc(bold);
      else if (label !== undefined) {
        out += /^(https?:\/\/|\/)/.test(href) ? link(href, esc(label)) : esc(label);
      } else if (t && threats[t.toLowerCase()]) out += link(`/threats/${t.toLowerCase()}`, esc(t));
      else if (c && controls[c.toLowerCase()]) out += link(`/controls/${c.toLowerCase()}`, esc(c));
      else if (a && asi.has(a)) out += link(`/taxonomy?tab=owasp-agentic&entry=${a}`, esc(a));
      else if (aisvs) out += link(`/aisvs#${aisvs.replace(/^AISVS /, "")}`, esc(aisvs));
      else out += esc(whole);
    }
    return out + esc(source.slice(last));
  }

  /** Block formatting via the app's own parser (richTextCore.parseBlocks). */
  function rich(text, { headingLevel = 3 } = {}) {
    if (!text || !String(text).trim()) return "";
    const blocks = mods.richText.parseBlocks(String(text));
    const hTag = (level) => `h${Math.min(6, Math.max(2, level))}`;
    return blocks
      .map((b) => {
        switch (b.type) {
          case "code":
            return `<pre class="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs"><code>${esc(b.code)}</code></pre>`;
          case "heading": {
            const tag = hTag(headingLevel + (b.level === 4 ? 1 : 0));
            return `<${tag} class="mt-4 ${H3}">${inline(b.text)}</${tag}>`;
          }
          case "labelled":
            return `<p class="leading-relaxed"><strong>${inline(b.label, false)}:</strong> ${inline(b.text)}</p>`;
          case "list": {
            const tag = b.ordered ? "ol" : "ul";
            const cls = b.ordered ? "list-decimal space-y-1 pl-5" : LIST;
            let html = `<${tag} class="${cls}">`;
            let open = false;
            b.items.forEach((item, i) => {
              if (item.depth > 0) {
                if (!open) {
                  html += `<ul class="${LIST} mt-1">`;
                  open = true;
                }
                html += `<li>${inline(item.text)}</li>`;
                return;
              }
              if (open) {
                html += "</ul>";
                open = false;
              }
              if (i > 0) html += "</li>";
              html += `<li>${inline(item.text)}`;
            });
            if (open) html += "</ul>";
            return `${html}</li></${tag}>`;
          }
          default:
            return `<p class="leading-relaxed">${inline(b.text)}</p>`;
        }
      })
      .join("");
  }

  return { inline, rich };
}

// ── Head ───────────────────────────────────────────────────────────────────

const HELMET = 'data-react-helmet="true"';

const LINE_SEP = new RegExp(String.fromCharCode(0x2028), "g");
const PARA_SEP = new RegExp(String.fromCharCode(0x2029), "g");

/** JSON for a <script> body: no "</script>" or HTML comment openers can leak out. */
export function scriptJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(LINE_SEP, "\\u2028")
    .replace(PARA_SEP, "\\u2029");
}

/** The tags PageLayout's <PageMeta> renders, in the same order, plus prerender-only JSON-LD. */
export function renderHead(route, seo) {
  const robots = route.noindex ? seo.ROBOTS_NOINDEX : seo.ROBOTS_INDEX;
  const tags = [
    `<title>${esc(route.fullTitle)}</title>`,
    `<meta ${HELMET} name="description" content="${esc(route.metaDescription)}" />`,
    `<meta ${HELMET} name="robots" content="${esc(robots)}" />`,
    `<link ${HELMET} rel="canonical" href="${esc(route.canonicalUrl)}" />`,
    `<meta ${HELMET} property="og:site_name" content="${esc(seo.SITE_NAME)}" />`,
    `<meta ${HELMET} property="og:locale" content="en_US" />`,
    `<meta ${HELMET} property="og:type" content="${esc(route.ogType)}" />`,
    `<meta ${HELMET} property="og:title" content="${esc(route.fullTitle)}" />`,
    `<meta ${HELMET} property="og:description" content="${esc(route.metaDescription)}" />`,
    `<meta ${HELMET} property="og:url" content="${esc(route.canonicalUrl)}" />`,
    `<meta ${HELMET} property="og:image" content="${esc(route.ogImage)}" />`,
    `<meta ${HELMET} property="og:image:width" content="1200" />`,
    `<meta ${HELMET} property="og:image:height" content="630" />`,
    `<meta ${HELMET} property="og:image:alt" content="${esc(route.fullTitle)}" />`,
    route.dateModified
      ? `<meta ${HELMET} property="article:modified_time" content="${esc(route.dateModified)}" />`
      : "",
    `<meta ${HELMET} name="twitter:card" content="summary_large_image" />`,
    `<meta ${HELMET} name="twitter:title" content="${esc(route.fullTitle)}" />`,
    `<meta ${HELMET} name="twitter:description" content="${esc(route.metaDescription)}" />`,
    `<meta ${HELMET} name="twitter:image" content="${esc(route.ogImage)}" />`,
    ...route.headJsonLd.map(
      (item) => `<script ${HELMET} type="application/ld+json">${scriptJson(item)}</script>`,
    ),
    ...route.extraJsonLd.map(
      (item) =>
        `<script ${seo.PRERENDER_LD_ATTR}="${esc(seo.normalizePath(route.path))}" type="application/ld+json">${scriptJson(item)}</script>`,
    ),
  ];
  return tags.filter(Boolean).join("\n    ");
}

/** Every JSON-LD block in an HTML document, parsed (for tests and the post-write check). */
export function extractJsonLd(html) {
  const blocks = [];
  for (const m of html.matchAll(
    /<script\b([^>]*)type="application\/ld\+json"([^>]*)>([\s\S]*?)<\/script>/g,
  )) {
    blocks.push({ attrs: `${m[1]} ${m[2]}`, data: JSON.parse(m[3]) });
  }
  return blocks;
}

// ── Template ───────────────────────────────────────────────────────────────

const ROOT_RE = /<div id="root">[\s\S]*?<\/div>\s*(?=(<script|<\/body>))/;

/**
 * The SPA shell with the per-route head tags removed: <title>, every data-react-helmet tag and
 * any JSON-LD. Returns the stripped HTML with a placeholder where the route head goes.
 */
export function prepareTemplate(html) {
  if (!/<div id="root">/.test(html)) throw new Error('template has no <div id="root">');
  if (!/<script type="module"[^>]+src="\/assets\//.test(html)) {
    throw new Error("template has no built module script (run vite build first)");
  }
  let out = html.replace(/<title>[\s\S]*?<\/title>/, "<!--ROUTE_HEAD-->");
  if (!out.includes("<!--ROUTE_HEAD-->")) throw new Error("template has no <title>");
  out = out.replace(/\n?[ \t]*<(meta|link)\b[^>]*\bdata-react-helmet="true"[^>]*>/g, "");
  out = out.replace(
    /\n?[ \t]*<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,
    "",
  );
  out = out.replace(ROOT_RE, '<div id="root"></div>\n    ');
  return out;
}

export function fillTemplate(template, head, body) {
  return template
    .replace("<!--ROUTE_HEAD-->", head)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

/** docs/404.html: the template's generic head, robots noindex, no canonical / og:url. */
export function notFoundShell(html) {
  return html
    .replace(
      /<meta\s+data-react-helmet="true"\s+name="robots"[^>]*>/,
      `<meta ${HELMET} name="robots" content="noindex" />`,
    )
    .replace(/\n?[ \t]*<link\s+data-react-helmet="true"\s+rel="canonical"[^>]*>/, "")
    .replace(/\n?[ \t]*<meta\s+data-react-helmet="true"\s+property="og:url"[^>]*>/, "")
    .replace(/\n?[ \t]*<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(ROOT_RE, '<div id="root"></div>\n    ');
}

/** Redirect stub for a <Navigate> route: instant refresh + JS replace, noindex. */
export function redirectStub(from, to, seo) {
  const target = esc(to);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Redirecting… · ${esc(seo.SITE_NAME)}</title>
    <meta name="robots" content="noindex" />
    <link rel="canonical" href="${esc(seo.absoluteUrl(to))}" />
    <meta http-equiv="refresh" content="0; url=${target}" />
    <script>location.replace(${scriptJson(to)} + location.hash);</script>
  </head>
  <body>
    <p>${esc(from)} has moved to <a href="${target}">${target}</a>.</p>
  </body>
</html>
`;
}

// ── Page chrome (mirrors AppShell's header, PageLayout's <main> and Footer) ──

function siteHeader(ctx, route) {
  const navLinks = ctx.mods.nav.HEADER_NAV.map((item) => {
    const active = ctx.mods.nav.isNavActive(item.path, route.path);
    return `<a href="${esc(item.path)}"${active ? ' aria-current="page"' : ""} class="whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors hover:text-foreground ${active ? "font-semibold text-foreground" : MUTED}">${esc(item.label)}</a>`;
  }).join("");
  return `<a href="#main-content" class="skip-to-content">Skip to main content</a><header class="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75"><div class="container flex h-14 items-center gap-2 px-4"><a href="/" class="mr-2 flex shrink-0 items-center gap-2 rounded-md transition-opacity hover:opacity-80" aria-label="Agentic Security Hub home"><span class="font-mono text-base font-bold text-foreground" aria-hidden="true">&gt;_</span><span class="text-sm font-semibold tracking-tight">Agentic Security Hub</span></a><nav class="hidden flex-1 items-center gap-0.5 lg:flex" aria-label="Main">${navLinks}</nav></div></header>`;
}

function siteFooter(ctx) {
  const { nav } = ctx.mods;
  const footerLink =
    "link-underline text-sm text-muted-foreground transition-colors hover:text-foreground";
  const groups = nav
    .groupedNav("footer")
    .map(
      (group) =>
        `<div><h2 class="mb-3 text-xs font-normal uppercase tracking-wider text-muted-foreground">${esc(group.label)}</h2><ul class="space-y-1.5">${group.items
          .map(
            (item) =>
              `<li><a href="${esc(item.path)}" class="${footerLink}">${esc(item.label)}</a></li>`,
          )
          .join("")}${
          group.group === "project"
            ? nav.NAV_EXTERNAL.map(
                (l) =>
                  `<li><a href="${esc(l.href)}" class="${footerLink}" rel="noopener noreferrer" target="_blank">${esc(l.label)}</a></li>`,
              ).join("")
            : ""
        }</ul></div>`,
    )
    .join("");
  return `<footer class="border-t bg-background py-8"><div class="container px-4 md:px-6"><div class="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5"><div class="col-span-2 md:col-span-3 lg:col-span-1"><div class="mb-3 font-mono text-sm font-semibold text-foreground">&gt;_ ASH</div><p class="text-sm text-muted-foreground">Securing agentic AI systems through the entire development lifecycle.</p></div>${groups}</div><div class="mt-8 border-t pt-4 text-center text-xs text-muted-foreground"><p class="font-mono text-xs">© ${esc(ctx.year)} OWASP Securing Agentic Applications</p></div></div></footer>`;
}

function breadcrumbs(ctx, route, extra = []) {
  const trail = ctx.mods.seo.breadcrumbTrail(route.path, route.title);
  if (trail.length < 2) return "";
  const items = [...trail.slice(0, -1), ...extra, trail[trail.length - 1]];
  return `<nav aria-label="Breadcrumb" class="mb-4 text-sm ${MUTED}"><ol class="flex flex-wrap items-center gap-1.5">${items
    .map((item, i) =>
      i === items.length - 1
        ? `<li aria-current="page" class="font-medium text-foreground">${esc(item.name)}</li>`
        : `<li><a href="${esc(item.path)}" class="hover:text-foreground hover:underline">${esc(item.name)}</a></li><li aria-hidden="true">›</li>`,
    )
    .join("")}</ol></nav>`;
}

function pageHeader({ eyebrow, title, description, stats = [], actions = [] }) {
  return `<header class="mb-6 space-y-3">${eyebrow ? `<p class="text-xs font-semibold uppercase tracking-wider text-primary">${esc(eyebrow)}</p>` : ""}<div class="min-w-0 space-y-1"><h1 class="text-2xl font-bold tracking-tight md:text-3xl">${esc(title)}</h1>${description ? `<p class="max-w-3xl text-muted-foreground">${description}</p>` : ""}</div>${
    stats.length
      ? `<ul class="flex flex-wrap gap-2" aria-label="Summary">${stats
          .map(
            (s) =>
              `<li class="inline-flex items-baseline gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm"><span class="font-semibold tabular-nums text-foreground">${esc(s.value)}</span> <span class="${MUTED}">${esc(s.label)}</span></li>`,
          )
          .join("")}</ul>`
      : ""
  }${actions.length ? `<p class="flex flex-wrap gap-x-4 gap-y-1 text-sm">${actions.join("")}</p>` : ""}</header>`;
}

function sourceNote(source) {
  if (!source) return "";
  return `<p class="mt-10 text-xs ${MUTED}">Source: ${link(source.url, esc(`${source.name} ${source.version}`), "underline-offset-2 hover:text-foreground hover:underline")} · retrieved ${esc(String(source.retrievedAt).slice(0, 7))}</p>`;
}

function pageShell(ctx, route, content) {
  return `<div data-prerendered="${esc(route.path)}">${siteHeader(ctx, route)}<div class="flex min-h-[calc(100vh-3.5rem)] flex-col"><main id="main-content" tabindex="-1" class="container min-w-0 max-w-7xl flex-1 px-4 py-8 outline-none md:px-6">${content}</main></div>${route.kind === "threat-modeler" ? "" : siteFooter(ctx)}</div>`;
}

// ── Shared lookups ─────────────────────────────────────────────────────────

function createContext(model) {
  const { mods } = model;
  const fmt = createFormatter(mods);
  const threats = mods.security.threatsData;
  const controls = mods.security.mitigationsData;
  const sev = mods.severity;
  const threatLink = (t, withCode = true) =>
    link(`/threats/${t.id}`, esc(withCode ? `${t.code} ${t.name}` : t.name));
  const controlLink = (m) =>
    link(`/controls/${m.id}`, esc(`${mods.threatIndex.controlCode(m.id)} ${m.name}`));
  const componentTitle = (id) => {
    const e = mods.componentIndex.componentEntry(id);
    return e ? `${e.code} ${e.title}` : id.toUpperCase();
  };
  const componentLink = (id) => {
    const e = mods.componentIndex.componentEntry(id);
    return e ? link(`/components/${e.id}`, esc(`${e.code} ${e.title}`)) : esc(id.toUpperCase());
  };
  const chapterName = (code) => mods.aisvs.aisvsData[code]?.name;
  const aisvsLink = (code) =>
    link(`/aisvs#${code}`, esc(chapterName(code) ? `${code} ${chapterName(code)}` : code));
  const bandLabel = (score) =>
    typeof score === "number" ? sev.severityLabel(sev.riskBand(score)) : undefined;
  const firstSentence = (text) => {
    const clean = String(text ?? "")
      .replace(/\s+/g, " ")
      .trim();
    const m = clean.match(/^(.{40,}?[.!?])(\s|$)/);
    return m ? m[1] : clean;
  };
  return {
    model,
    mods,
    ...fmt,
    year: model.buildDate.slice(0, 4),
    threats,
    controls,
    threatLink,
    controlLink,
    componentTitle,
    componentLink,
    aisvsLink,
    chapterName,
    bandLabel,
    firstSentence,
  };
}

// ── Pages: home and catalogs ───────────────────────────────────────────────

function renderHome(ctx, route) {
  const { mods } = ctx;
  const S = mods.siteStats.SITE_STATS;
  const THREATS = mods.threatIndex.THREAT_LIST;
  const CONTROLS = mods.threatIndex.MITIGATION_LIST;
  const kcs = mods.kc.KC_LIST;
  const archs = Object.values(mods.architectures.architecturesData);
  const hero = `<section class="py-6 text-center md:py-16" aria-labelledby="hero-title"><p class="font-mono text-xs tracking-wide ${MUTED}">OWASP Agentic Security Framework</p><h1 id="hero-title" class="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">Agentic Security Hub</h1><p class="mx-auto mt-4 max-w-2xl text-base leading-relaxed ${MUTED} md:text-lg">Threat models, verification standards, and security controls for AI agent architectures. Built on OWASP AISVS and NIST AI RMF.</p><p class="mx-auto mt-3 max-w-2xl text-sm ${MUTED}">${esc(route.description)}</p><ul class="mt-6 flex flex-wrap justify-center gap-2" aria-label="What's inside">${[
    [S.threats, "threats", "/threats"],
    [S.attackVectors, "attack vectors", "/threats"],
    [S.controls, "controls", "/controls"],
    [S.aisvsRequirements, `AISVS ${S.aisvsVersion} requirements`, "/aisvs"],
    [S.nistSubcategories, "NIST AI RMF subcategories", "/nist-mapping"],
    [S.patterns, "architecture patterns", "/architectures"],
    [S.componentNodes, "components", "/components"],
    [S.modelerTemplates, "threat modeler templates", "/threat-modeler"],
  ]
    .map(
      ([n, label, href]) =>
        `<li><a href="${href}" class="inline-flex items-baseline gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm hover:bg-muted"><span class="font-semibold tabular-nums text-foreground">${esc(n)}</span> <span class="${MUTED}">${esc(label)}</span></a></li>`,
    )
    .join("")}</ul></section>`;
  const start = cardList(
    [
      {
        href: "/learn",
        title: "Learning path",
        text: esc(
          `${mods.learning.LEARNING_STEPS.length} steps from the components of an agent to a working threat model, with a quiz per step.`,
        ),
      },
      {
        href: "/threat-modeler",
        title: "Threat Modeler",
        text: esc(
          "Draw an agentic system in the browser and get its OWASP agentic threats, MAESTRO layers, attack paths and mitigations.",
        ),
      },
      {
        href: "/aisvs",
        title: "OWASP AISVS",
        text: esc(
          `All ${S.aisvsRequirements} AI Security Verification Standard requirements by chapter and level.`,
        ),
      },
      {
        href: "/taxonomy",
        title: "Threat taxonomy",
        text: esc(
          "The OWASP Top 10 for Agentic Applications, the Cisco AI security taxonomy, MITRE ATLAS, AIVSS and AIUC-1 side by side.",
        ),
      },
    ],
    { columns: "sm:grid-cols-2 lg:grid-cols-4" },
  );
  const threats = cardList(
    THREATS.map((t) => ({
      href: `/threats/${t.id}`,
      code: t.code,
      title: t.name,
      text: esc(ctx.firstSentence(t.description)),
      meta: esc(`Risk ${t.riskScore ?? "n/a"}/10 · ${t.attackVectors?.length ?? 0} attack vectors`),
    })),
    { columns: "md:grid-cols-2 lg:grid-cols-3" },
  );
  const controls = cardList(
    CONTROLS.map((m) => ({
      href: `/controls/${m.id}`,
      code: mods.threatIndex.controlCode(m.id),
      title: m.name,
      text: esc(ctx.firstSentence(m.description)),
    })),
    { columns: "md:grid-cols-2 lg:grid-cols-3" },
  );
  const components = cardList(
    kcs.map((k) => ({
      href: `/components/${k.id}`,
      code: k.code,
      title: k.name,
      text: esc(ctx.firstSentence(k.description)),
    })),
    { columns: "md:grid-cols-2 lg:grid-cols-3" },
  );
  const architectures = cardList(
    archs.map((a) => ({
      href: `/architectures/${a.id}`,
      title: a.name,
      text: esc(ctx.firstSentence(a.description)),
    })),
    { columns: "md:grid-cols-2 lg:grid-cols-3" },
  );
  return join([
    hero,
    section("start", "Start here", start),
    section(
      "threats",
      "AI agent threats",
      threats,
      `The ${THREATS.length} threats of the OWASP Agentic AI Threats and Mitigations guide, each with attack vectors, affected components and the controls that mitigate it.`,
    ),
    section(
      "controls",
      "Security controls",
      controls,
      `${CONTROLS.length} controls mapped to the threats they mitigate and to OWASP AISVS requirements, with design, build and operations tasks.`,
    ),
    section("components", "Key components of an agentic system", components),
    section("architectures", "Architecture patterns", architectures),
  ]);
}

function renderThreats(ctx, route) {
  const { mods } = ctx;
  const THREATS = mods.threatIndex.THREAT_LIST;
  const st = mods.threatIndex.THREAT_STATS;
  const items = THREATS.map((t) => {
    const comps = mods.componentIndex.componentsForThreat(t.id).filter((e) => e.depth === 0);
    const ctrls = mods.threatIndex.mitigationsForThreat(t.id);
    return {
      href: `/threats/${t.id}`,
      code: t.code,
      title: t.name,
      text: ctx.inline(t.description),
      meta: join([
        esc(
          `Risk ${t.riskScore ?? "n/a"}/10 (${ctx.bandLabel(t.riskScore) ?? "unrated"}) · ${t.attackVectors?.length ?? 0} attack vectors`,
        ),
        comps.length
          ? ` · Components: ${comps.map((e) => link(`/components/${e.id}`, esc(e.code))).join(", ")}`
          : "",
        ctrls.length
          ? ` · Controls: ${ctrls.map((m) => link(`/controls/${m.id}`, esc(mods.threatIndex.controlCode(m.id)))).join(", ")}`
          : "",
      ]),
    };
  });
  return join([
    pageHeader({
      eyebrow: "Threat catalog",
      title: "Threats",
      description: esc(
        "The key threats to agentic AI systems, their attack vectors, the components they hit and the controls that mitigate them.",
      ),
      stats: [
        { value: st.threats, label: "threats" },
        { value: st.attackVectors, label: "attack vectors" },
        { value: st.mitigations, label: "mitigating controls" },
      ],
    }),
    section("catalog", "All agentic AI threats", cardList(items)),
    section(
      "walkthroughs",
      "Attack walkthroughs",
      cardList(
        mods.scenarios.SCENARIOS.map((s) => ({
          href: mods.scenarios.scenarioPath(s.id),
          title: s.title,
          text: esc(ctx.firstSentence(s.summary)),
        })),
        { columns: "md:grid-cols-2 lg:grid-cols-3" },
      ),
      "Step-by-step scenarios that show the threats in a real architecture, and the controls that stop each one.",
    ),
    sourceNote(mods.sources.SOURCES.threats),
  ]);
}

function renderControls(ctx, route) {
  const { mods } = ctx;
  const CONTROLS = mods.threatIndex.MITIGATION_LIST;
  const cs = mods.controlIndex.CONTROL_STATS;
  const items = CONTROLS.map((m) => {
    const threats = m.threatIds.map((id) => ctx.threats[id]).filter(Boolean);
    const chapters = mods.controlIndex.controlChapters(m);
    const phases = mods.phaseTasks.PHASE_ORDER.filter((p) =>
      mods.phaseTasks.phaseApplies(m, p),
    ).map((p) => mods.phaseTasks.PHASE_META[p].label);
    return {
      href: `/controls/${m.id}`,
      code: mods.threatIndex.controlCode(m.id),
      title: m.name,
      text: ctx.inline(m.description),
      meta: join([
        threats.length
          ? `Mitigates ${threats.map((t) => link(`/threats/${t.id}`, esc(t.code))).join(", ")}`
          : "",
        chapters.length
          ? ` · AISVS ${chapters.map((c) => link(`/aisvs#${c}`, esc(c))).join(", ")}`
          : "",
        phases.length ? esc(` · ${phases.join(", ")}`) : "",
      ]),
    };
  });
  return join([
    pageHeader({
      eyebrow: "Control catalog",
      title: "Security controls",
      description: esc(
        "Controls that mitigate the agentic threats, each mapped to OWASP AISVS chapters and requirements and broken into design, build and operations tasks.",
      ),
      stats: [
        { value: cs.controls, label: "controls" },
        { value: cs.threatsCovered, label: "threats covered" },
        { value: cs.citedRequirements, label: "AISVS requirements cited" },
        { value: cs.chaptersCovered, label: "AISVS chapters" },
      ],
    }),
    section("catalog", "All agentic AI security controls", cardList(items)),
    para(
      `See the controls by lifecycle phase in the ${link("/implementation", "lifecycle view")}, or the ${link("/interactive", "security checklist")}.`,
      `mt-8 text-sm ${MUTED}`,
    ),
    sourceNote(mods.sources.SOURCES.controls),
  ]);
}

function renderComponents(ctx, route) {
  const { mods } = ctx;
  const ci = mods.componentIndex;
  const body = mods.kc.KC_ORDER.map((kcId) => {
    const root = ci.componentEntry(kcId);
    if (!root) return "";
    const subs = ci.descendantsOf(root.id);
    const threats = ci
      .threatIdsInKc(kcId)
      .map((id) => ctx.threats[id])
      .filter(Boolean);
    return `<section id="${esc(root.id)}" aria-labelledby="${esc(root.id)}-title" class="mt-10 space-y-3"><h2 id="${esc(root.id)}-title" class="${H2}">${link(`/components/${root.id}`, `<span class="${CODE}">${esc(root.code)}</span> ${esc(root.title)}`, "hover:text-primary hover:underline")}</h2>${para(ctx.inline(root.description), `max-w-3xl ${MUTED}`)}${
      threats.length
        ? para(`Threats: ${threats.map((t) => ctx.threatLink(t)).join(", ")}`, "text-sm")
        : ""
    }${cardList(
      subs.map((e) => ({
        href: `/components/${e.id}`,
        code: e.code,
        title: e.title,
        text: ctx.inline(e.description),
      })),
      { columns: "md:grid-cols-2 lg:grid-cols-3" },
    )}</section>`;
  }).join("");
  return join([
    pageHeader({
      eyebrow: "Architecture",
      title: "Key components",
      description: esc(
        "The six key components (KC1–KC6) of an agentic AI system from the OWASP Agentic Security guide, their sub-components and the threats that affect each.",
      ),
      stats: [
        { value: mods.kc.KC_ORDER.length, label: "key components" },
        { value: ci.COMPONENT_ENTRIES.length, label: "component nodes" },
      ],
    }),
    body,
    sourceNote(mods.sources.SOURCES.kc),
  ]);
}

function renderArchitectures(ctx, route) {
  const { mods } = ctx;
  const archs = Object.values(mods.architectures.architecturesData).sort(
    (a, b) => (a.displayOrder ?? 99) - (b.displayOrder ?? 99),
  );
  const items = archs.map((a) => ({
    href: `/architectures/${a.id}`,
    title: a.name,
    text: ctx.inline(a.description),
    meta: join([
      esc(`Risk ${a.riskScore ?? "n/a"}/10 · `),
      `Threats ${a.threatIds
        .map((id) => ctx.threats[id])
        .filter(Boolean)
        .map((t) => link(`/threats/${t.id}`, esc(t.code)))
        .join(", ")}`,
      ` · Components ${a.keyComponents.map((id) => link(`/components/${id.toLowerCase()}`, esc(id.toUpperCase()))).join(", ")}`,
    ]),
  }));
  return join([
    pageHeader({
      eyebrow: "Learn",
      title: "Agent architectures",
      description: esc(
        "Reference patterns for agentic systems, the components each one uses and the threats it exposes.",
      ),
      stats: [{ value: archs.length, label: "patterns" }],
    }),
    section("patterns", "Agentic AI architecture patterns", cardList(items)),
    sourceNote(mods.sources.SOURCES.architectures),
  ]);
}

// ── Pages: standards and frameworks ────────────────────────────────────────

function renderAisvs(ctx, route) {
  const { mods } = ctx;
  const { aisvsData, aisvsStats, AISVS_VERSION } = mods.aisvs;
  const levels = aisvsStats.byLevel ?? [];
  const toc = `<nav aria-label="Chapters" class="mt-6"><ol class="grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">${Object.values(
    aisvsData,
  )
    .map(
      (c) =>
        `<li>${link(`#${c.code}`, `<span class="${CODE}">${esc(c.code)}</span> ${esc(c.name)}`)}</li>`,
    )
    .join("")}</ol></nav>`;
  const chapters = Object.values(aisvsData)
    .map((c) => {
      const controls = mods.threatIndex.MITIGATION_LIST.filter((m) =>
        mods.controlIndex.controlChapters(m).includes(c.code),
      );
      const sections = (c.subCategories ?? [])
        .map(
          (s) =>
            `<section id="${esc(s.code)}" aria-labelledby="${esc(s.code)}-title" class="space-y-2"><h3 id="${esc(s.code)}-title" class="mt-6 ${H3}"><span class="${CODE}">${esc(s.code)}</span> ${esc(s.name)}</h3>${para(ctx.inline(s.description), `max-w-3xl text-sm ${MUTED}`)}<ol class="space-y-2">${(
              s.requirements ?? []
            )
              .map(
                (r) =>
                  `<li id="${esc(r.id)}" class="rounded-md border p-3 text-sm"><span class="${CODE}">${esc(r.id)}</span> <span class="${CHIP}">Level ${esc(r.level)}</span><p class="mt-1">${ctx.inline(r.text ?? r.description)}</p></li>`,
              )
              .join("")}</ol></section>`,
        )
        .join("");
      return `<section id="${esc(c.code)}" aria-labelledby="${esc(c.code)}-title" class="mt-12 space-y-3"><h2 id="${esc(c.code)}-title" class="${H2}"><span class="${CODE}">${esc(c.code)}</span> ${esc(c.name)}</h2>${para(ctx.inline(c.description), `max-w-3xl ${MUTED}`)}${
        controls.length
          ? para(
              `Controls that cite this chapter: ${controls.map(ctx.controlLink).join(", ")}`,
              "text-sm",
            )
          : ""
      }${sections}</section>`;
    })
    .join("");
  return join([
    pageHeader({
      eyebrow: "Verify",
      title: "OWASP AISVS",
      description: esc(
        `The AI Security Verification Standard (AISVS ${AISVS_VERSION}): testable requirements at three assurance levels, by chapter and section. Levels are cumulative: Level 2 includes every Level 1 requirement.`,
      ),
      stats: [
        { value: aisvsStats.chapters, label: "chapters" },
        { value: aisvsStats.sections, label: "sections" },
        { value: aisvsStats.requirements, label: "requirements" },
        ...levels.map((n, i) => ({ value: n, label: `level ${i + 1}` })),
      ],
    }),
    toc,
    chapters,
    sourceNote(mods.sources.SOURCES.aisvs),
  ]);
}

function renderNist(ctx, route) {
  const { mods } = ctx;
  const { nistAIRMF, NIST_SUBCATEGORIES, getNistGaiRisk } = mods.nist;
  const fns = nistAIRMF
    .map(
      (fn) =>
        `<section id="${esc(fn.code)}" aria-labelledby="${esc(fn.code)}-title" class="mt-12 space-y-3"><h2 id="${esc(fn.code)}-title" class="${H2}">${esc(fn.code)}: ${esc(fn.name)}</h2>${para(esc(fn.description), `max-w-3xl ${MUTED}`)}${fn.categories
          .map(
            (cat) =>
              `<section id="${esc(cat.code)}" aria-labelledby="${esc(cat.code)}-title" class="space-y-2"><h3 id="${esc(cat.code)}-title" class="mt-6 ${H3}"><span class="${CODE}">${esc(cat.code)}</span> ${esc(cat.name)}</h3>${para(esc(cat.description), `max-w-3xl text-sm ${MUTED}`)}${table(
                ["Subcategory", "NIST AI RMF text", "OWASP AISVS chapters", "Rationale"],
                cat.subcategories.map((sub) => [
                  `<span id="${esc(sub.code)}" class="font-mono text-xs font-semibold">${esc(sub.code)}</span><br />${esc(sub.name)}`,
                  esc(sub.description),
                  join([
                    (sub.aisvs ?? []).map((c) => ctx.aisvsLink(c)).join("<br />") ||
                      esc(
                        sub.organizational
                          ? "Organizational (no technical AISVS requirement)"
                          : "—",
                      ),
                    sub.requirements?.length
                      ? `<br /><span class="${CODE}">${sub.requirements.map((r) => link(`/aisvs#${r}`, esc(r))).join(", ")}</span>`
                      : "",
                  ]),
                  join([
                    ctx.inline(sub.rationale ?? ""),
                    sub.gaiRisks?.length
                      ? `<br /><span class="text-xs ${MUTED}">GenAI risks: ${esc(sub.gaiRisks.map((id) => getNistGaiRisk(id)?.name ?? id).join(", "))}</span>`
                      : "",
                  ]),
                ]),
              )}</section>`,
          )
          .join("")}</section>`,
    )
    .join("");
  return join([
    pageHeader({
      eyebrow: "Framework mapping",
      title: "NIST AI RMF Mapping",
      description: esc(
        `How the NIST AI Risk Management Framework 1.0 Core lines up with the OWASP AI Security Verification Standard ${mods.aisvs.AISVS_VERSION}, with the NIST AI 600-1 Generative AI Profile risks each subcategory addresses.`,
      ),
      stats: [
        { value: nistAIRMF.length, label: "functions" },
        { value: mods.nist.NIST_CATEGORIES.length, label: "categories" },
        { value: NIST_SUBCATEGORIES.length, label: "subcategories" },
      ],
    }),
    fns,
    section(
      "gai-risks",
      "NIST AI 600-1 generative AI risks",
      bullets(
        mods.nist.NIST_GAI_RISKS.map(
          (r) => `<strong>${esc(r.name)}</strong>${r.description ? `: ${esc(r.description)}` : ""}`,
        ),
      ),
    ),
    sourceNote(mods.sources.SOURCES.nist),
  ]);
}

function renderTaxonomy(ctx, route) {
  const { mods, model } = ctx;
  const top10 = mods.top10.agenticTop10Data;
  const llm = model.llmTop10 ?? [];
  const cisco = mods.cisco.ciscoTaxonomyData;
  const atlas = mods.atlas.atlasCrosswalk;
  const core = mods.aivss.coreRiskScores;
  const aiuc = mods.aiuc1.aiuc1Principles;
  const S = mods.sources.SOURCES;
  const tabs = [
    ["/taxonomy?tab=owasp-agentic", "OWASP Top 10 for Agentic Applications", "#owasp-agentic"],
    ...(llm.length
      ? [["/taxonomy?tab=llm-top10", "OWASP Top 10 for LLM Applications", "#llm-top10"]]
      : []),
    ["/taxonomy?tab=cisco", "Cisco AI Security Taxonomy", "#cisco"],
    ["/taxonomy?tab=atlas", "MITRE ATLAS crosswalk", "#atlas"],
    ["/taxonomy?tab=aivss", "OWASP AIVSS", "#aivss"],
    ["/taxonomy?tab=aiuc-1", "AIUC-1", "#aiuc-1"],
  ];
  const overview = bullets(
    tabs.map(
      ([href, label, anchor]) => `${link(anchor, esc(label))} (${link(href, "interactive view")})`,
    ),
  );

  // "LLM06:2025 Excessive Agency" → link to the current edition's entry when the dataset is present.
  const llmRef = (text) => {
    const hit = mods.llmTop10?.findLlmTop10Entry?.(String(text).split(" ")[0]);
    return hit
      ? link(`/taxonomy?tab=llm-top10&entry=${encodeURIComponent(hit.id)}`, esc(text))
      : esc(text);
  };
  const asiSection = top10
    .map((e) => {
      const threats = (e.relatedThreats ?? []).map((id) => ctx.threats[id]).filter(Boolean);
      const scenarios = mods.scenarios.scenariosForAsi(e.code);
      return `<article id="${esc(e.code)}" class="${CARD} space-y-2"><h3 class="${H3}">${link(`/taxonomy?tab=owasp-agentic&entry=${e.code}`, `<span class="${CODE}">${esc(e.code)}</span> ${esc(e.name)}`, "hover:text-primary hover:underline")}</h3>${para(ctx.inline(e.description), "text-sm leading-relaxed")}${
        e.commonExamples?.length
          ? `<h4 class="text-sm font-semibold">Common examples</h4>${bullets(e.commonExamples.map((x) => ctx.inline(x)))}`
          : ""
      }${e.preventionGuidelines?.length ? `<h4 class="text-sm font-semibold">Prevention guidelines</h4>${bullets(e.preventionGuidelines.map((x) => ctx.inline(x)))}` : ""}<p class="text-xs ${MUTED}">${join(
        [
          threats.length
            ? `Agentic threats: ${threats.map((t) => link(`/threats/${t.id}`, esc(t.code))).join(", ")}`
            : "",
          e.relatedCiscoObjectives?.length
            ? ` · Cisco: ${esc(e.relatedCiscoObjectives.join(", "))}`
            : "",
          e.relatedAIVSSRisk ? ` · AIVSS: ${esc(e.relatedAIVSSRisk)}` : "",
          e.relatedLLMTop10?.length
            ? ` · LLM Top 10: ${e.relatedLLMTop10.map(llmRef).join(", ")}`
            : "",
        ],
      )}</p>${scenarios.length ? `<p class="text-xs">Walkthroughs: ${scenarios.map((s) => link(mods.scenarios.scenarioPath(s.id), esc(s.title))).join(", ")}</p>` : ""}</article>`;
    })
    .join("");

  const llmMod = mods.llmTop10 ?? {};
  const llmSection = llm
    .map((e) => {
      const threats = (e.relatedThreats ?? []).map((id) => ctx.threats[id]).filter(Boolean);
      const controls = (e.relatedControls ?? []).map((id) => ctx.controls[id]).filter(Boolean);
      const asi = (e.relatedAsi ?? []).map((code) =>
        link(`/taxonomy?tab=owasp-agentic&entry=${code}`, esc(code)),
      );
      const chapters = [...(e.relatedAisvs ?? []), ...(e.supportingAisvs ?? [])].map(ctx.aisvsLink);
      const tactics = (e.atlasTactics ?? []).map((id) => {
        const label = llmMod.LLM_ATLAS_TACTICS?.[id] ? `${id} ${llmMod.LLM_ATLAS_TACTICS[id]}` : id;
        return typeof llmMod.atlasTacticUrl === "function"
          ? link(llmMod.atlasTacticUrl(id), esc(label))
          : esc(label);
      });
      const cwe = (e.cwe ?? []).map((id) =>
        typeof llmMod.cweUrl === "function" ? link(llmMod.cweUrl(id), esc(id)) : esc(id),
      );
      const mappings = [
        e.previous?.code
          ? `<li><strong>2025 edition:</strong> ${esc(`${e.previous.code} ${e.previous.name ?? ""}`.trim())}</li>`
          : "",
        asi.length ? `<li><strong>OWASP Agentic Top 10:</strong> ${asi.join(", ")}</li>` : "",
        chapters.length ? `<li><strong>AISVS chapters:</strong> ${chapters.join(", ")}</li>` : "",
        tactics.length
          ? `<li><strong>MITRE ATLAS tactics:</strong> ${tactics.join(", ")}</li>`
          : "",
        cwe.length ? `<li><strong>CWE:</strong> ${cwe.join(", ")}</li>` : "",
        threats.length
          ? `<li><strong>Agentic threats:</strong> ${threats.map((t) => ctx.threatLink(t)).join(", ")}</li>`
          : "",
        controls.length
          ? `<li><strong>Controls:</strong> ${controls.map(ctx.controlLink).join(", ")}</li>`
          : "",
      ].join("");
      return `<article id="${esc(e.entryId)}" class="${CARD} space-y-2"><h3 class="${H3}">${link(`/taxonomy?tab=llm-top10&entry=${encodeURIComponent(e.entryId)}`, `<span class="${CODE}">${esc(e.code)}</span> ${esc(e.name)}`, "hover:text-primary hover:underline")}</h3>${para(ctx.inline(e.description), "text-sm leading-relaxed")}${
        e.examples?.length
          ? `<h4 class="text-sm font-semibold">Common examples</h4>${bullets(e.examples.map((x) => ctx.inline(String(x))))}`
          : ""
      }${mappings ? `<ul class="${LIST} text-xs ${MUTED}">${mappings}</ul>` : ""}</article>`;
    })
    .join("");

  const ciscoSection = cisco
    .map(
      (g) =>
        `<article id="${esc(g.code)}" class="${CARD} space-y-2"><h3 class="${H3}">${link(`/taxonomy?tab=cisco&entry=${g.code}`, `<span class="${CODE}">${esc(g.code)}</span> ${esc(g.description)}`, "hover:text-primary hover:underline")}</h3>${g.objective_group ? `<p class="text-xs ${MUTED}">${esc(g.objective_group)}</p>` : ""}${para(esc(g.definition), "text-sm leading-relaxed")}${bullets(
          (g.ai_tech ?? []).map(
            (t) =>
              `<span class="${CODE}">${esc(t.code)}</span> <strong>${esc(t.description)}</strong>${t.definition ? `: ${esc(t.definition)}` : ""}${
                t.ai_subtech?.length
                  ? `<br /><span class="text-xs ${MUTED}">Sub-techniques: ${esc(t.ai_subtech.map((s) => `${s.code} ${s.description}`).join("; "))}</span>`
                  : ""
              }`,
          ),
        )}</article>`,
    )
    .join("");

  const atlasRows = atlas.map((a) => [
    `${link(a.url, esc(a.atlasId))}<br />${esc(a.atlasName)}`,
    esc([...(a.ciscoObjectiveIds ?? []), ...(a.ciscoTechniqueIds ?? [])].join(", ")),
    (a.owaspAsi ?? [])
      .map((c) => link(`/taxonomy?tab=owasp-agentic&entry=${c}`, esc(c)))
      .join(", "),
    (a.threatIds ?? [])
      .map((id) => ctx.threats[id])
      .filter(Boolean)
      .map((t) => link(`/threats/${t.id}`, esc(t.code)))
      .join(", "),
  ]);

  const aivssRows = core.map((r) => [
    esc(r.rank),
    esc(r.name),
    esc(`${r.aivssScore} (${r.severity})`),
    (r.asiCodes ?? [])
      .map((c) => link(`/taxonomy?tab=owasp-agentic&entry=${c}`, esc(c)))
      .join(", "),
  ]);

  const aiucSection = aiuc
    .map(
      (p) =>
        `<article id="aiuc-${esc(p.id)}" class="${CARD} space-y-2"><h3 class="${H3}"><span class="${CODE}">${esc(p.id)}</span> ${esc(p.name)}</h3>${para(esc(p.description), `text-sm ${MUTED}`)}${bullets(
          (p.requirements ?? [])
            .filter((r) => r.status !== "retired")
            .map(
              (r) =>
                `${link(`/taxonomy?tab=aiuc-1&entry=${r.id}`, `<span class="${CODE}">${esc(r.id)}</span> ${esc(r.title)}`)}${r.fullText ? `: ${esc(r.fullText)}` : ""}`,
            ),
        )}</article>`,
    )
    .join("");

  return join([
    pageHeader({
      eyebrow: "Learn · Frameworks",
      title: "Threat Taxonomy",
      description: esc(
        "AI security frameworks and standards side by side, with the mappings between them.",
      ),
      stats: [
        { value: top10.length, label: "Agentic Top 10 entries" },
        ...(llm.length ? [{ value: llm.length, label: "LLM Top 10 entries" }] : []),
        { value: cisco.length, label: "Cisco objectives" },
        { value: atlas.length, label: "ATLAS techniques" },
        { value: core.length, label: "AIVSS core risks" },
      ],
    }),
    section("overview", "Overview & mapping", overview, route.description),
    section(
      "owasp-agentic",
      "OWASP Top 10 for Agentic Applications",
      `<div class="space-y-4">${asiSection}</div>`,
      "The ASI01–ASI10 risks with examples, prevention guidelines and the agentic threats, Cisco objectives and AIVSS risks each maps to.",
    ),
    llm.length
      ? section(
          "llm-top10",
          "OWASP Top 10 for LLM Applications",
          `<div class="space-y-4">${llmSection}</div>`,
        )
      : "",
    section(
      "cisco",
      "Cisco AI Security and Safety Taxonomy",
      `<div class="space-y-4">${ciscoSection}</div>`,
      "Objectives, techniques and sub-techniques with their OWASP, MITRE ATLAS and ATT&CK cross-references.",
    ),
    section(
      "atlas",
      "MITRE ATLAS crosswalk",
      table(
        ["ATLAS technique", "Cisco taxonomy", "OWASP Agentic Top 10", "Agentic threats"],
        atlasRows,
      ),
      "MITRE ATLAS techniques mapped to Cisco AI taxonomy techniques, OWASP Agentic Top 10 entries and agentic threats, derived from Cisco's published mappings.",
    ),
    section(
      "aivss",
      "OWASP AIVSS core risks",
      table(["Rank", "Core risk", "AIVSS score", "OWASP Agentic Top 10"], aivssRows),
      "The OWASP AI Vulnerability Scoring System worked examples for the agentic core risks. The interactive tab includes the calculator.",
    ),
    section(
      "aiuc-1",
      "AIUC-1 requirements",
      `<div class="space-y-4">${aiucSection}</div>`,
      "AIUC-1 requirements by principle.",
    ),
    `<p class="mt-10 text-xs ${MUTED}">Sources: ${[S.top10, S.cisco, S.atlas, S.aivss, S.aiuc1].map((s) => link(s.url, esc(`${s.name} ${s.version}`), "underline-offset-2 hover:text-foreground hover:underline")).join(" · ")}</p>`,
  ]);
}

function renderReferences(ctx, route) {
  const { mods } = ctx;
  const refs = mods.references.REFERENCES;
  const types = mods.references.REFERENCE_TYPES;
  const body = types
    .map((type) => {
      const list = refs.filter((r) => r.type === type.id);
      if (!list.length) return "";
      return section(
        `type-${type.id}`,
        type.plural ?? type.label ?? cap(type.id),
        `<ul class="space-y-3">${list
          .map(
            (r) =>
              `<li class="${CARD}"><p class="font-medium">${link(r.url, esc(r.title))}</p><p class="text-xs ${MUTED}">${esc(r.host)}</p>${
                r.citedBy?.length
                  ? `<p class="mt-1 text-xs">Cited by ${r.citedBy.map((c) => link(c.href, esc(`${c.code} ${c.name}`))).join(", ")}</p>`
                  : ""
              }</li>`,
          )
          .join("")}</ul>`,
      );
    })
    .join("");
  return join([
    pageHeader({
      eyebrow: "Resources",
      title: "References",
      description: esc(
        "Every external source cited by the threats, controls, AISVS chapters and the OWASP Top 10 for Agentic Applications. Links that point at the same document are merged, and each one links back to everything that cites it.",
      ),
      stats: [
        { value: refs.length, label: "sources" },
        { value: mods.references.CITATION_COUNT, label: "citations" },
      ],
    }),
    body,
  ]);
}

// ── Pages: detail ──────────────────────────────────────────────────────────

function references(list) {
  const refs = (list ?? []).filter((r) => r?.url);
  return refs.length ? bullets(refs.map((r) => link(r.url, esc(r.title ?? r.url)))) : "";
}

function prevNext(prev, next) {
  if (!prev && !next) return "";
  return `<nav aria-label="Previous and next" class="mt-12 flex flex-wrap justify-between gap-4 border-t pt-6 text-sm">${
    prev
      ? `<a href="${esc(prev.href)}" class="hover:text-primary hover:underline">← ${esc(prev.label)}</a>`
      : "<span></span>"
  }${next ? `<a href="${esc(next.href)}" class="hover:text-primary hover:underline">${esc(next.label)} →</a>` : ""}</nav>`;
}

function renderThreat(ctx, route) {
  const { mods } = ctx;
  const t = route.entity;
  const mitigations = mods.threatIndex.mitigationsForThreat(t.id);
  const components = mods.componentIndex.componentsForThreat(t.id);
  const refs = mods.frameworkLinks.threatFrameworkRefs(t);
  const modeler = mods.modelerLink.threatModelerTarget(t);
  const scenarios = mods.scenarios.scenariosForThreat(t.id);
  const atlas = mods.atlas.getAtlasForThreat(t.id);
  const chapters = [
    ...new Set(mitigations.flatMap((m) => mods.controlIndex.controlChapters(m))),
  ].sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));
  const requirementIds = [...mods.controlIndex.requirementIdsForThreat(t.id)];
  const { prev, next } = mods.threatIndex.threatNeighbours(t.id);
  const band = ctx.bandLabel(t.riskScore);
  const cia = t.impactAnalysis
    ? ["confidentiality", "integrity", "availability"].filter((k) => t.impactAnalysis[k]).map(cap)
    : [];
  const vectors = (t.attackVectors ?? []).map((v) => [
    `<strong>${esc(v.vector)}</strong>`,
    esc(cap(v.severity ?? "")),
    ctx.inline(v.example ?? ""),
  ]);
  const kcGroups = mods.kc.KC_LIST.map((k) => ({
    k,
    entries: components.filter((e) => e.kc === k.id),
  })).filter((g) => g.entries.length);
  const frameworkList = (list) =>
    bullets(
      list.map(
        (r) =>
          `${link(r.href, `<span class="font-mono text-xs font-semibold">${esc(r.code)}</span> ${esc(r.name)}`)}${r.detail ? ` <span class="text-xs ${MUTED}">${esc(r.detail)}</span>` : ""}${r.unofficial ? ` <span class="text-xs ${MUTED}">(editorial mapping)</span>` : ""}`,
      ),
    );
  return join([
    breadcrumbs(ctx, route),
    pageHeader({
      eyebrow: `Threat ${t.code}`,
      title: t.name,
      description: ctx.inline(t.description),
      stats: [
        {
          value: typeof t.riskScore === "number" ? `${t.riskScore}/10` : "n/a",
          label: `risk${band ? ` (${band})` : ""}`,
        },
        { value: t.attackVectors?.length ?? 0, label: "attack vectors" },
        { value: mitigations.length, label: "mitigating controls" },
        { value: refs.asi.length + refs.cisco.length + refs.aivss.length, label: "framework refs" },
      ],
      actions: [link(modeler.href, "Open in Threat Modeler"), link("/threats", "All threats")],
    }),
    section(
      "overview",
      "Overview",
      join([
        bullets([
          `<strong>Impact level:</strong> ${esc(cap(t.impactLevel))}`,
          typeof t.riskScore === "number"
            ? `<strong>Risk score:</strong> ${esc(t.riskScore)}/10 (${esc(band)})`
            : "",
          cia.length ? `<strong>CIA impact:</strong> ${esc(cia.join(", "))}` : "",
          t.affectedComponents?.length
            ? `<strong>Affected components:</strong> ${esc(t.affectedComponents.join("; "))}`
            : "",
          t.alternateNames?.length
            ? `<strong>Also known as:</strong> ${esc(t.alternateNames.join(", "))}`
            : "",
          t.tags?.length ? `<strong>Tags:</strong> ${esc(t.tags.join(", "))}` : "",
          t.sourceVersion ? `<strong>Source:</strong> ${esc(t.sourceVersion)}` : "",
        ]),
      ]),
    ),
    section(
      "attack-vectors",
      "Attack vectors",
      table(["Attack vector", "Severity", "Example"], vectors),
      `How attackers carry out ${t.name.toLowerCase()} against an agentic system.`,
    ),
    section(
      "components",
      "Affected components",
      kcGroups
        .map(
          (g) =>
            `<h3 class="mt-4 ${H3}">${link(`/components/${g.k.id}`, esc(`${g.k.code} ${g.k.name}`))}</h3>${bullets(
              g.entries
                .filter((e) => e.depth > 0)
                .map(
                  (e) =>
                    `${link(`/components/${e.id}`, esc(`${e.code} ${e.title}`))}${e.inherited ? ` <span class="text-xs ${MUTED}">(inherited from ${esc(String(e.inheritedFrom).toUpperCase())})</span>` : ""}`,
                ),
            )}`,
        )
        .join(""),
    ),
    section(
      "mitigations",
      "Mitigating controls",
      cardList(
        mitigations.map((m) => ({
          href: `/controls/${m.id}`,
          code: mods.threatIndex.controlCode(m.id),
          title: m.name,
          text: esc(ctx.firstSentence(m.description)),
        })),
      ),
      `Controls from the catalog that reduce the likelihood or impact of ${t.code}.`,
    ),
    section(
      "frameworks",
      "Framework mappings",
      join([
        refs.asi.length
          ? `<h3 class="${H3}">OWASP Top 10 for Agentic Applications</h3>${frameworkList(refs.asi)}`
          : "",
        refs.cisco.length
          ? `<h3 class="mt-4 ${H3}">Cisco AI Security Taxonomy</h3>${frameworkList(refs.cisco)}`
          : "",
        refs.aivss.length
          ? `<h3 class="mt-4 ${H3}">OWASP AIVSS core risks</h3>${frameworkList(refs.aivss)}`
          : "",
        chapters.length
          ? `<h3 class="mt-4 ${H3}">OWASP AISVS</h3>${para(`Chapters cited by the mitigating controls: ${chapters.map((c) => ctx.aisvsLink(c)).join(", ")}.`, "text-sm")}${
              requirementIds.length
                ? para(
                    `Requirements: ${requirementIds.map((r) => link(`/aisvs#${r}`, esc(r))).join(", ")}.`,
                    `text-xs ${MUTED}`,
                  )
                : ""
            }`
          : "",
        atlas.length
          ? `<h3 class="mt-4 ${H3}">MITRE ATLAS</h3>${bullets(atlas.map((a) => `${link(a.url, esc(a.atlasId))} ${esc(a.atlasName)}`))}`
          : "",
      ]),
    ),
    section(
      "walkthroughs",
      "Attack walkthroughs",
      bullets(
        scenarios.map(
          (s) =>
            `${link(mods.scenarios.scenarioPath(s.id), esc(s.title))}: ${esc(ctx.firstSentence(s.summary))}`,
        ),
      ),
    ),
    section("references", "References", references(t.references)),
    sourceNote(mods.sources.SOURCES.threats),
    prevNext(
      prev && { href: `/threats/${prev.id}`, label: `${prev.code} ${prev.name}` },
      next && { href: `/threats/${next.id}`, label: `${next.code} ${next.name}` },
    ),
  ]);
}

function renderControl(ctx, route) {
  const { mods } = ctx;
  const m = route.entity;
  const pt = mods.phaseTasks;
  const code = mods.threatIndex.controlCode(m.id);
  const threats = m.threatIds
    .map((id) => ctx.threats[id])
    .filter(Boolean)
    .sort(mods.threatIndex.compareThreatCodes);
  const cited = mods.controlIndex.citedRequirements(m);
  const chapters = mods.controlIndex.controlChapters(m);
  const chapterOnly = mods.controlIndex.chapterOnlyMappings(m);
  const related = mods.controlIndex.relatedControls(m, 4);
  const taskTotal = pt.PHASE_ORDER.reduce((n, p) => n + pt.phaseTaskTotal(m, p), 0);
  const phases = pt.PHASE_ORDER.map((phase) => {
    const meta = pt.PHASE_META[phase];
    const text = m.implementationDetail?.[meta.field];
    if (!text?.trim()) return "";
    const applies = pt.phaseApplies(m, phase);
    return section(
      `phase-${phase}`,
      `${meta.label} phase`,
      ctx.rich(text, { headingLevel: 3 }),
      `${meta.blurb}${applies ? "" : " (Secondary for this control.)"} ${pt.phaseTaskTotal(m, phase)} tasks.`,
    );
  }).join("");
  const byChapter = chapters.map((c) => ({
    c,
    reqs: cited.filter((r) => r.category === c || r.id.startsWith(`${c}.`)),
  }));
  return join([
    breadcrumbs(ctx, route),
    pageHeader({
      eyebrow: `Control ${code}`,
      title: m.name,
      description: ctx.inline(m.description),
      stats: [
        { value: threats.length, label: "threats mitigated" },
        { value: cited.length, label: "AISVS requirements" },
        { value: chapters.length, label: "AISVS chapters" },
        { value: taskTotal, label: "tasks" },
      ],
      actions: [link("/controls", "All controls"), link("/implementation", "Lifecycle view")],
    }),
    section(
      "threats",
      "Threats mitigated",
      cardList(
        threats.map((t) => ({
          href: `/threats/${t.id}`,
          code: t.code,
          title: t.name,
          text: esc(ctx.firstSentence(t.description)),
        })),
      ),
    ),
    section(
      "aisvs",
      "OWASP AISVS coverage",
      join([
        byChapter
          .map(
            ({ c, reqs }) =>
              `<h3 class="mt-4 ${H3}">${ctx.aisvsLink(c)}</h3>${
                reqs.length
                  ? `<ul class="space-y-2">${reqs
                      .map(
                        (r) =>
                          `<li class="rounded-md border p-3 text-sm">${link(`/aisvs#${r.id}`, esc(r.id))} <span class="${CHIP}">Level ${esc(r.level)}</span><p class="mt-1">${ctx.inline(r.text ?? r.description)}</p></li>`,
                      )
                      .join("")}</ul>`
                  : para(
                      esc(chapterOnly.includes(c) ? "Mapped at chapter level." : ""),
                      `text-sm ${MUTED}`,
                    )
              }`,
          )
          .join(""),
      ]),
      `The AISVS ${mods.aisvs.AISVS_VERSION} chapters and verification requirements this control helps satisfy.`,
    ),
    phases,
    m.implementationDetail?.toolsAndFrameworks?.trim()
      ? section(
          "tools",
          "Tools and frameworks",
          ctx.rich(m.implementationDetail.toolsAndFrameworks, { headingLevel: 3 }),
        )
      : "",
    section(
      "related",
      "Related controls",
      bullets(
        related.map(
          (r) =>
            `${ctx.controlLink(r.control)} <span class="text-xs ${MUTED}">shares ${esc(r.sharedThreatIds.map((id) => ctx.threats[id]?.code ?? id).join(", "))}</span>`,
        ),
      ),
    ),
    section("references", "References", references(m.references)),
    sourceNote(mods.sources.SOURCES.controls),
  ]);
}

function renderComponent(ctx, route) {
  const { mods } = ctx;
  const e = route.entity;
  const ci = mods.componentIndex;
  const kcEntry = mods.kc.KC[e.kc];
  const node = mods.framework.getComponentById(e.id);
  const root = mods.framework.getComponentById(e.kc);
  const parent = ci.componentEntry(e.parentId);
  const threatIds = e.depth === 0 ? ci.threatIdsInKc(e.kc) : e.threatIds;
  const threats = threatIds
    .map((id) => ctx.threats[id])
    .filter(Boolean)
    .sort(mods.threatIndex.compareThreatCodes);
  const threatSet = new Set(threats.map((t) => t.id));
  const controls = mods.threatIndex.MITIGATION_LIST.filter((m) =>
    m.threatIds.some((t) => threatSet.has(t)),
  );
  const uses = (keys) =>
    keys.filter((k) => {
      const kk = k.toLowerCase();
      return kk === e.id || kk.startsWith(`${e.id}.`) || e.id.startsWith(`${kk}.`);
    });
  const relevance = new Map((root?.relatedArchitectures ?? []).map((a) => [a.id, a.relevance]));
  const archs = Object.values(mods.architectures.architecturesData).filter(
    (a) => uses(a.keyComponents).length || (e.depth === 0 && relevance.get(a.id)),
  );
  const children = e.childIds.map((id) => ci.componentEntry(id)).filter(Boolean);
  const description = e.description || kcEntry.description;
  const extraCrumbs = parent ? [{ name: parent.code, path: `/components/${parent.id}` }] : [];
  return join([
    breadcrumbs(
      ctx,
      route,
      e.depth > 1
        ? [{ name: kcEntry.code, path: `/components/${kcEntry.id}` }, ...extraCrumbs]
        : extraCrumbs,
    ),
    pageHeader({
      eyebrow: e.depth === 0 ? "Key component" : `${kcEntry.code} · ${kcEntry.name}`,
      title: `${e.title} (${e.code})`,
      description: ctx.inline(description),
      stats: [
        { value: threats.length, label: "threats" },
        { value: controls.length, label: "controls" },
        { value: archs.length, label: "architectures" },
      ],
      actions: [
        link("/components", "All components"),
        link(mods.nav.threatModelerPathFor(archs[0]?.id ?? ""), "Open the Threat Modeler"),
      ],
    }),
    node?.securityImplications
      ? section("security", "Security implications", para(ctx.inline(node.securityImplications)))
      : "",
    node?.implementationConsiderations
      ? section(
          "implementation",
          "Implementation considerations",
          para(ctx.inline(node.implementationConsiderations)),
        )
      : "",
    children.length
      ? section(
          "subcomponents",
          "Sub-components",
          cardList(
            children.map((c) => ({
              href: `/components/${c.id}`,
              code: c.code,
              title: c.title,
              text: ctx.inline(c.description),
            })),
          ),
        )
      : "",
    section(
      "threats",
      "Threats",
      cardList(
        threats.map((t) => ({
          href: `/threats/${t.id}`,
          code: t.code,
          title: t.name,
          text: esc(ctx.firstSentence(t.description)),
        })),
      ),
      e.inherited
        ? `This sub-component inherits the threat mapping of ${String(e.inheritedFrom).toUpperCase()}.`
        : undefined,
    ),
    section(
      "controls",
      "Controls",
      bullets(
        controls.map((m) => `${ctx.controlLink(m)}: ${esc(ctx.firstSentence(m.description))}`),
      ),
    ),
    section(
      "architectures",
      "Architecture patterns",
      bullets(
        archs.map(
          (a) =>
            `${link(`/architectures/${a.id}`, esc(a.name))}: ${esc(ctx.firstSentence(a.description))}`,
        ),
      ),
    ),
    sourceNote(e.depth > 0 ? mods.sources.SOURCES.components : mods.sources.SOURCES.kc),
  ]);
}

function renderArchitecture(ctx, route) {
  const { mods } = ctx;
  const a = route.entity;
  const threats = a.threatIds.map((id) => ctx.threats[id]).filter(Boolean);
  const controls = a.mitigationIds.map((id) => ctx.controls[id]).filter(Boolean);
  const scenarios = mods.scenarios.scenariosForArchitecture(a.id);
  const archs = Object.values(mods.architectures.architecturesData).sort(
    (x, y) => (x.displayOrder ?? 99) - (y.displayOrder ?? 99),
  );
  const idx = archs.findIndex((x) => x.id === a.id);
  return join([
    breadcrumbs(ctx, route),
    pageHeader({
      eyebrow: "Architecture pattern",
      title: route.title,
      description: ctx.inline(a.description),
      stats: [
        { value: a.keyComponents.length, label: "key components" },
        { value: threats.length, label: "threats" },
        { value: controls.length, label: "controls" },
        { value: typeof a.riskScore === "number" ? `${a.riskScore}/10` : "n/a", label: "risk" },
      ],
      actions: [
        link(mods.nav.threatModelerPathFor(a.id), "Model it in the Threat Modeler"),
        link("/architectures", "All architectures"),
      ],
    }),
    section("overview", "Overview", ctx.rich(a.detailedDescription ?? a.description)),
    section(
      "components",
      "Key components",
      bullets(a.keyComponents.map((id) => ctx.componentLink(id.toLowerCase()))),
    ),
    section(
      "threats",
      "Threats this pattern exposes",
      join([
        (a.relevantThreats ?? [])
          .map(
            (r) =>
              `<h3 class="mt-4 ${H3}">${ctx.inline(r.title)}</h3>${para(ctx.inline(r.description), "text-sm leading-relaxed")}`,
          )
          .join(""),
        threats.length
          ? para(
              `Mapped threats: ${threats.map((t) => ctx.threatLink(t)).join(", ")}.`,
              "mt-4 text-sm",
            )
          : "",
      ]),
    ),
    section(
      "controls",
      "Recommended controls",
      cardList(
        controls.map((m) => ({
          href: `/controls/${m.id}`,
          code: mods.threatIndex.controlCode(m.id),
          title: m.name,
          text: esc(ctx.firstSentence(m.description)),
        })),
      ),
    ),
    section(
      "walkthroughs",
      "Attack walkthroughs",
      bullets(
        scenarios.map(
          (s) =>
            `${link(mods.scenarios.scenarioPath(s.id), esc(s.title))}: ${esc(ctx.firstSentence(s.summary))}`,
        ),
      ),
    ),
    section("references", "References", references(a.references)),
    sourceNote(mods.sources.SOURCES.architectures),
    prevNext(
      idx > 0 && { href: `/architectures/${archs[idx - 1].id}`, label: archs[idx - 1].name },
      idx >= 0 &&
        idx < archs.length - 1 && {
          href: `/architectures/${archs[idx + 1].id}`,
          label: archs[idx + 1].name,
        },
    ),
  ]);
}

function renderScenario(ctx, route) {
  const { mods } = ctx;
  const s = route.entity;
  const arch = mods.architectures.architecturesData[s.archId];
  const asi = s.asiId ? mods.top10.agenticTop10Data.find((e) => e.id === s.asiId) : undefined;
  const threats = s.threatIds.map((id) => ctx.threats[id]).filter(Boolean);
  const controls = s.controlsThatStop.map((id) => ctx.controls[id]).filter(Boolean);
  const adj = mods.scenarios.adjacentScenarios(s.id);
  const steps = `<ol class="space-y-4">${s.steps
    .map(
      (step, i) =>
        `<li class="${CARD}"><h3 class="${H3}"><span class="${CODE}">${i + 1}.</span> ${esc(step.title)}</h3>${para(ctx.inline(step.narrative), "mt-1 text-sm leading-relaxed")}${
          step.threatId || step.kc
            ? `<p class="mt-2 text-xs ${MUTED}">${join([
                step.threatId && ctx.threats[step.threatId]
                  ? `Threat ${link(`/threats/${step.threatId}`, esc(ctx.threats[step.threatId].code))}`
                  : "",
                step.kc
                  ? ` · Component ${link(`/components/${step.kc}`, esc(step.kc.toUpperCase()))}`
                  : "",
                step.severity && step.severity !== "info" ? esc(` · ${cap(step.severity)}`) : "",
              ])}</p>`
            : ""
        }</li>`,
    )
    .join("")}</ol>`;
  return join([
    breadcrumbs(ctx, route),
    pageHeader({
      eyebrow:
        asi && s.source === "asi"
          ? `Attack walkthrough · ${asi.code} ${asi.name}`
          : `Attack walkthrough · ${arch?.name ?? ""}`,
      title: s.title,
      description: ctx.inline(s.summary),
      stats: [
        { value: s.steps.length, label: "steps" },
        { value: threats.length, label: "threats" },
        { value: controls.length, label: "controls that stop it" },
        { value: cap(s.severity), label: "severity" },
      ],
      actions: [
        arch ? link(`/architectures/${arch.id}`, esc(arch.name)) : "",
        asi
          ? link(`/taxonomy?tab=owasp-agentic&entry=${asi.code}`, esc(`${asi.code} ${asi.name}`))
          : "",
      ].filter(Boolean),
    }),
    section("steps", "How the attack unfolds", steps),
    section(
      "threats",
      "Threats involved",
      bullets(threats.map((t) => `${ctx.threatLink(t)}: ${esc(ctx.firstSentence(t.description))}`)),
    ),
    section(
      "controls",
      "Controls that stop it",
      cardList(
        controls.map((m) => ({
          href: `/controls/${m.id}`,
          code: mods.threatIndex.controlCode(m.id),
          title: m.name,
          text: esc(ctx.firstSentence(m.description)),
        })),
      ),
    ),
    adj
      ? prevNext(
          { href: mods.scenarios.scenarioPath(adj.prev.id), label: adj.prev.title },
          { href: mods.scenarios.scenarioPath(adj.next.id), label: adj.next.title },
        )
      : "",
  ]);
}

function renderLearnStep(ctx, route) {
  const { mods } = ctx;
  const step = route.entity;
  const steps = mods.learning.LEARNING_STEPS;
  const prev = mods.learning.previousLearningStep(step.id);
  const next = mods.learning.nextLearningStep(step.id);
  return join([
    breadcrumbs(ctx, route),
    pageHeader({
      eyebrow: `Step ${step.number} of ${steps.length}`,
      title: step.title,
      description: esc(step.summary),
    }),
    section(
      "readings",
      "Read",
      cardList(
        step.readings.map((r) => ({
          href: r.path,
          title: r.label,
          text: esc(r.description ?? ""),
        })),
      ),
      "Work through these pages, then take the short quiz for this step. Your progress stays in this browser.",
    ),
    section(
      "quiz",
      "Quiz",
      para(
        esc(
          `A short generated quiz checks this step. Pass ${Math.round((mods.learning.PASS_RATIO ?? 0.8) * 100)} % to complete it.`,
        ),
        `text-sm ${MUTED}`,
      ),
    ),
    prevNext(
      prev && {
        href: mods.learning.learningStepPath(prev.id),
        label: `Step ${prev.number}: ${prev.title}`,
      },
      next && {
        href: mods.learning.learningStepPath(next.id),
        label: `Step ${next.number}: ${next.title}`,
      },
    ),
  ]);
}

// ── Pages: tools and project ───────────────────────────────────────────────

function renderLearn(ctx, route) {
  const { mods } = ctx;
  const steps = mods.learning.LEARNING_STEPS;
  return join([
    pageHeader({
      eyebrow: "Learn",
      title: "Learning path",
      description: esc(
        `${steps.length} steps from the building blocks of an agent to a working threat model. Read a few pages, then pass a short quiz to complete each step.`,
      ),
      stats: [
        { value: steps.length, label: "steps" },
        { value: steps.reduce((n, s) => n + s.readings.length, 0), label: "readings" },
      ],
    }),
    `<ol class="mt-8 space-y-4">${steps
      .map(
        (s) =>
          `<li class="${CARD}"><h2 class="text-lg font-semibold">${link(mods.learning.learningStepPath(s.id), esc(`Step ${s.number}: ${s.title}`), "hover:text-primary hover:underline")}</h2>${para(esc(s.summary), `mt-1 text-sm ${MUTED}`)}${bullets(
            s.readings.map(
              (r) =>
                `${link(r.path, esc(r.label))}${r.description ? `: ${esc(r.description)}` : ""}`,
            ),
            `${LIST} mt-2 text-sm`,
          )}</li>`,
      )
      .join("")}</ol>`,
  ]);
}

function renderAbout(ctx, route) {
  const { mods } = ctx;
  const S = mods.siteStats.SITE_STATS;
  const SOURCES = mods.sources.SOURCES;
  return join([
    pageHeader({
      eyebrow: "About",
      title: "About the Agentic Security Hub",
      description: esc(
        "An interactive companion to the OWASP Securing Agentic Applications guide, providing security practitioners with actionable tools, frameworks, and verification standards for building secure AI agent systems.",
      ),
      stats: [
        { value: S.threats, label: "threats" },
        { value: S.controls, label: "controls" },
        { value: S.aisvsRequirements, label: "AISVS requirements" },
        { value: S.nistSubcategories, label: "NIST subcategories" },
        { value: S.patterns, label: "architectures" },
      ],
    }),
    section(
      "what",
      "What this site covers",
      bullets([
        `${link("/threats", "Threat catalog")}: the ${S.threats} OWASP agentic AI threats with ${S.attackVectors} attack vectors.`,
        `${link("/controls", "Security controls")}: ${S.controls} controls with design, build and operations tasks, mapped to ${link("/aisvs", "OWASP AISVS")} ${esc(S.aisvsVersion)}.`,
        `${link("/components", "Key components")} and ${link("/architectures", "architecture patterns")} of agentic systems.`,
        `${link("/nist-mapping", "NIST AI RMF mapping")} and the ${link("/taxonomy", "framework taxonomy")} (OWASP Agentic Top 10, Cisco, MITRE ATLAS, AIVSS, AIUC-1).`,
        `The ${link("/threat-modeler", "Threat Modeler")}, a free in-browser tool, and its ${link("/threat-modeler-guide", "guide")}.`,
      ]),
    ),
    section(
      "methodology",
      "Methodology",
      `<ol class="list-decimal space-y-2 pl-5">${mods.learning.LEARNING_STEPS.map((s) => `<li>${link(mods.learning.learningStepPath(s.id), esc(s.title))}: ${esc(s.summary)}</li>`).join("")}</ol>`,
      "A structured path from system analysis through implementation to governance; each step has its own reference page and a short quiz on the learning path.",
    ),
    section(
      "sources",
      "Data sources",
      table(
        ["Dataset", "Version", "Retrieved"],
        Object.values(SOURCES).map((s) => [
          link(s.url, esc(s.name)),
          esc(s.version),
          esc(s.retrievedAt),
        ]),
      ),
      `The ${Object.keys(SOURCES).length} datasets behind every page, with the version used and when it was last retrieved.`,
    ),
    section(
      "contribute",
      "Contribute",
      join([
        bullets(
          [
            "Report vulnerabilities via GitHub issue templates",
            "Submit pull requests for new controls or threats",
            "Improve documentation and implementation guides",
            "Share feedback on the interactive assessment tools",
            "Help expand AISVS verification requirements",
          ].map(esc),
        ),
        para(
          `${link(mods.seo.REPO_URL, "Source code on GitHub")} · ${link(mods.seo.OWASP_PROJECT_URL, "OWASP Securing Agentic Applications project")}`,
          "text-sm",
        ),
      ]),
    ),
  ]);
}

function renderThreatModeler(ctx, route) {
  const { mods } = ctx;
  const templates = mods.templates.ARCHITECTURE_TEMPLATES;
  const types = Object.values(mods.semanticTypes.SEMANTIC_TYPES);
  const rules = mods.ruleCatalog.RULES;
  return join([
    pageHeader({
      eyebrow: "Tools",
      title: "Threat Modeler",
      description: esc(route.description),
      stats: [
        { value: rules.length, label: "analysis rules" },
        { value: templates.length, label: "templates" },
        { value: types.length, label: "component types" },
      ],
      actions: [link("/threat-modeler-guide", "Read the guide")],
    }),
    para(
      esc(
        "The Threat Modeler runs entirely in your browser and needs JavaScript. Draw the agents, models, memory, tools and data flows of your system, then run the analysis to get OWASP agentic threats, MAESTRO layers, attack paths, OWASP AISVS coverage and mitigations. Models are saved in this browser and can be exported as JSON, Markdown, PDF or SARIF.",
      ),
    ),
    section(
      "templates",
      "Start from a template",
      cardList(
        templates.map((t) => ({
          href: `/threat-modeler?template=${encodeURIComponent(t.id)}`,
          title: t.name,
          text: esc(t.description),
        })),
        { columns: "md:grid-cols-2 lg:grid-cols-3" },
      ),
    ),
    section(
      "components",
      "Component types",
      bullets(types.map((t) => `<strong>${esc(t.label)}</strong>: ${esc(t.why)}`)),
    ),
  ]);
}

function renderGuide(ctx, route) {
  const { mods } = ctx;
  const rules = mods.ruleCatalog.RULES;
  const types = Object.values(mods.semanticTypes.SEMANTIC_TYPES);
  const layers = mods.modelerTypes.MAESTRO_LAYER_NAMES ?? {};
  const shortcuts = mods.shortcuts.SHORTCUTS ?? [];
  const key = (k) => (k === "Mod" ? "Ctrl/⌘" : k);
  return join([
    pageHeader({
      eyebrow: "Tools",
      title: "Threat Modeler Guide",
      description: esc(
        "How to model an agentic system, what the analysis engine checks and how to read its results. The reference tables are generated from the modeler's own palette, rule catalog, templates and shortcuts, so they always match the tool.",
      ),
      stats: [
        { value: rules.length, label: "rules" },
        { value: types.length, label: "component types" },
        { value: mods.templates.ARCHITECTURE_TEMPLATES.length, label: "templates" },
      ],
      actions: [link("/threat-modeler", "Open the Threat Modeler")],
    }),
    section(
      "workflow",
      "How to model a system",
      `<ol class="list-decimal space-y-1 pl-5 text-sm">${[
        "Start from a template or an empty canvas.",
        "Drag components from the palette: agents, models, memory, tools, data stores and external services.",
        "Connect them with data flows and group them into trust boundaries.",
        "Set each component's properties (trust level, authentication, data sensitivity).",
        "Run Analyze to get threats, attack paths, AISVS coverage and the mitigations to apply.",
        "Save, share or export the model.",
      ]
        .map((s) => `<li>${esc(s)}</li>`)
        .join("")}</ol>`,
    ),
    section(
      "components",
      "Component types",
      bullets(types.map((t) => `<strong>${esc(t.label)}</strong>: ${esc(t.why)}`)),
    ),
    section(
      "maestro",
      "MAESTRO layers",
      `<ol class="list-decimal space-y-1 pl-5 text-sm">${Object.values(layers)
        .map((n) => `<li>${esc(n)}</li>`)
        .join("")}</ol>`,
      "Every finding is placed on a layer of the CSA MAESTRO threat-modeling framework for agentic AI.",
    ),
    section(
      "rules",
      "Analysis rules",
      table(
        ["Rule", "What it detects", "Maps to"],
        rules.map((r) => [
          `<span class="font-mono text-xs font-semibold">${esc(r.id)}</span><br />${esc(r.title)}`,
          esc(r.description),
          join([
            (r.maps?.owaspAsi ?? [])
              .map((c) => link(`/taxonomy?tab=owasp-agentic&entry=${c}`, esc(c)))
              .join(", "),
            r.maps?.catalogThreat && ctx.threats[r.maps.catalogThreat]
              ? ` ${link(`/threats/${r.maps.catalogThreat}`, esc(ctx.threats[r.maps.catalogThreat].code))}`
              : "",
            r.maps?.aisvs?.length
              ? ` ${r.maps.aisvs.map((c) => link(`/aisvs#${c}`, esc(c))).join(", ")}`
              : "",
          ]),
        ]),
      ),
    ),
    section(
      "templates",
      "Templates",
      bullets(
        mods.templates.ARCHITECTURE_TEMPLATES.map(
          (t) =>
            `${link(`/threat-modeler?template=${encodeURIComponent(t.id)}`, esc(t.name))}: ${esc(t.description)}`,
        ),
      ),
    ),
    section(
      "shortcuts",
      "Keyboard shortcuts",
      table(
        ["Keys", "Action"],
        shortcuts.map((s) => [
          esc(s.keys.map((combo) => combo.map(key).join("+")).join(" or ")),
          esc(s.description),
        ]),
      ),
    ),
  ]);
}

function renderImplementation(ctx, route) {
  const { mods } = ctx;
  const pt = mods.phaseTasks;
  const CONTROLS = mods.threatIndex.MITIGATION_LIST;
  return join([
    pageHeader({
      eyebrow: "Implementation",
      title: "Lifecycle view",
      description: esc(
        "The controls in the order you apply them: decide in design, implement in build, sustain in operations. Pick a control in a phase to work through its tasks.",
      ),
      stats: pt.PHASE_ORDER.map((p) => ({
        value: CONTROLS.filter((m) => pt.phaseApplies(m, p)).length,
        label: `${pt.PHASE_META[p].label.toLowerCase()} controls`,
      })),
    }),
    pt.PHASE_ORDER.map((phase) => {
      const meta = pt.PHASE_META[phase];
      const list = CONTROLS.filter((m) => pt.phaseApplies(m, phase));
      return section(
        phase,
        `${meta.label} phase`,
        cardList(
          list.map((m) => ({
            href: `/controls/${m.id}`,
            code: mods.threatIndex.controlCode(m.id),
            title: m.name,
            text: esc(
              pt
                .phaseSections(m, phase)
                .map((s) => s.title)
                .filter(Boolean)
                .join(" · "),
            ),
            meta: esc(`${pt.phaseTaskTotal(m, phase)} tasks`),
          })),
        ),
        meta.blurb,
      );
    }).join(""),
  ]);
}

function renderInteractive(ctx, route) {
  const { mods } = ctx;
  const cats = mods.checklist ?? [];
  const items = cats.flatMap((c) => c.items ?? []);
  const aisvsRef = (ref) => (ref ? link(`/aisvs#${ref}`, esc(`AISVS ${ref}`)) : "");
  return join([
    pageHeader({
      eyebrow: "Tools",
      title: "Security Checklist",
      description: esc(
        "A step-by-step implementation guide with code examples and OWASP AISVS references. Tick items off as you go; progress stays in this browser.",
      ),
      stats: [
        { value: cats.length, label: "categories" },
        { value: items.length, label: "items" },
      ],
    }),
    cats
      .map((c) =>
        section(
          c.id,
          c.name,
          (c.items ?? [])
            .map(
              (item) =>
                `<article class="${CARD} space-y-2"><h3 class="${H3}">${esc(item.title)}</h3><p class="text-xs ${MUTED}">${esc(cap(item.priority))} priority · ${aisvsRef(item.aisvsReference)}${item.estimatedTime ? esc(` · ${item.estimatedTime}`) : ""}</p>${para(esc(item.description), "text-sm")}${para(ctx.inline(item.implementationGuide), "text-sm leading-relaxed")}${
                  item.verificationSteps?.length
                    ? `<h4 class="text-sm font-semibold">Verification</h4>${bullets(item.verificationSteps.map(esc))}`
                    : ""
                }</article>`,
            )
            .join(""),
          c.description,
        ),
      )
      .join(""),
  ]);
}

function renderProgress(ctx, route) {
  return join([
    pageHeader({
      eyebrow: "Project",
      title: "Your progress",
      description: esc(
        "Everything here is stored only in this browser. Export it to keep a backup or move to another device.",
      ),
    }),
    para(
      `Track ${link("/aisvs", "AISVS verification")}, ${link("/implementation", "control tasks")}, the ${link("/interactive", "security checklist")} and the ${link("/learn", "learning path")}.`,
      "text-sm",
    ),
  ]);
}

const RENDERERS = {
  home: renderHome,
  threats: renderThreats,
  controls: renderControls,
  components: renderComponents,
  architectures: renderArchitectures,
  aisvs: renderAisvs,
  nist: renderNist,
  taxonomy: renderTaxonomy,
  references: renderReferences,
  learn: renderLearn,
  about: renderAbout,
  "threat-modeler": renderThreatModeler,
  guide: renderGuide,
  implementation: renderImplementation,
  interactive: renderInteractive,
  progress: renderProgress,
  threat: renderThreat,
  control: renderControl,
  component: renderComponent,
  architecture: renderArchitecture,
  scenario: renderScenario,
  "learn-step": renderLearnStep,
};

/** Body markup for one route (the content of <div id="root">). */
export function renderBody(route, ctx) {
  const render = RENDERERS[route.kind];
  if (!render)
    throw new Error(`prerender: no renderer for route kind "${route.kind}" (${route.path})`);
  const content =
    route.kind === "home" ? `<div class="-mt-2">${render(ctx, route)}</div>` : render(ctx, route);
  return pageShell(ctx, route, content);
}

/** The full HTML document of one route. */
export function renderRoute(route, ctx, template) {
  return fillTemplate(template, renderHead(route, ctx.mods.seo), renderBody(route, ctx));
}

export { createContext };

// ── Output ─────────────────────────────────────────────────────────────────

/** Files written for a route path: "a/b.html", plus "a/b/index.html" when "a/b/" is a directory. */
export function outputFiles(routePath, directories) {
  if (routePath === "/") return ["index.html"];
  const rel = routePath.replace(/^\/+|\/+$/g, "");
  return directories.has(rel) ? [`${rel}.html`, `${rel}/index.html`] : [`${rel}.html`];
}

function parentDirs(rel) {
  const parts = rel.split("/");
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
}

function readSitemapPaths(file, origin) {
  if (!fs.existsSync(file)) return null;
  const xml = fs.readFileSync(file, "utf8");
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const loc = m[1].replace(/&amp;/g, "&");
    if (!loc.startsWith(origin)) throw new Error(`sitemap URL outside ${origin}: ${loc}`);
    return loc.slice(origin.length) || "/";
  });
}

/** Tailwind classes used by the static markup that the built CSS does not define. */
function missingClasses(bodies, css) {
  const IGNORE = new Set(["group", "skip-to-content", "link-underline"]);
  const used = new Set();
  for (const body of bodies) {
    for (const m of body.matchAll(/class="([^"]+)"/g))
      for (const c of m[1].split(/\s+/)) if (c) used.add(c);
  }
  const escape = (c) => c.replace(/[^a-zA-Z0-9_-]/g, (ch) => `\\${ch}`);
  return [...used].filter((c) => !IGNORE.has(c) && !css.includes(`.${escape(c)}`)).sort();
}

function parseArgs(argv) {
  const opts = { out: path.join(projectRoot, "docs") };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") opts.out = path.resolve(argv[++i] ?? "");
    else if (arg.startsWith("--out=")) opts.out = path.resolve(arg.slice(6));
    else if (arg === "--help" || arg === "-h") {
      console.log("Usage: node scripts/prerender.mjs [--out <dir>]");
      process.exit(0);
    } else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(2);
    }
  }
  return opts;
}

export async function main(argv = process.argv.slice(2)) {
  const started = Date.now();
  const { out } = parseArgs(argv);
  const shellFile = fs.existsSync(path.join(out, "404.html"))
    ? path.join(out, "404.html")
    : path.join(out, "index.html");
  if (!fs.existsSync(shellFile))
    throw new Error(`No built SPA shell in ${out} (run vite build first)`);
  const shell = fs.readFileSync(shellFile, "utf8");
  const template = prepareTemplate(shell);

  const mods = await loadSiteModules();
  const model = buildSiteModel(mods, { buildDate: buildDateFromEnv() });
  const { seo } = mods;
  const ctx = createContext(model);

  // Every sitemap URL must have a page.
  const sitemapPaths = readSitemapPaths(path.join(out, "sitemap.xml"), seo.SITE_ORIGIN);
  if (sitemapPaths) {
    const missing = sitemapPaths.filter((p) => !model.byPath.has(p));
    if (missing.length)
      throw new Error(`prerender: sitemap URLs without a route: ${missing.join(", ")}`);
  } else {
    console.warn("prerender: no sitemap.xml next to the build; rendering every modelled route");
  }

  const extraFiles = [
    ...model.redirects.map((r) => `${r.from.replace(/^\//, "")}.html`),
    ...model.notPrerendered.map((p) => `${p.replace(/^\//, "")}.html`),
  ];
  const directories = new Set();
  for (const route of model.routes) {
    if (route.path !== "/")
      parentDirs(route.path.replace(/^\//, "")).forEach((d) => directories.add(d));
  }
  extraFiles.forEach((f) => parentDirs(f).forEach((d) => directories.add(d)));

  const written = [];
  const bodies = [];
  let jsonLdBlocks = 0;
  for (const route of model.routes) {
    const body = renderBody(route, ctx);
    const html = fillTemplate(template, renderHead(route, seo), body);
    jsonLdBlocks += extractJsonLd(html).length; // throws on invalid JSON
    bodies.push(body);
    for (const rel of outputFiles(route.path, directories)) {
      const file = path.join(out, rel);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, html);
      written.push(rel);
    }
  }

  // 404.html stays the SPA shell, noindex; client-only routes get the same shell with a 200.
  const notFound = notFoundShell(shell);
  fs.writeFileSync(path.join(out, "404.html"), notFound);
  for (const p of model.notPrerendered) {
    const file = path.join(out, `${p.replace(/^\//, "")}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, notFound);
  }
  for (const r of model.redirects) {
    const file = path.join(out, `${r.from.replace(/^\//, "")}.html`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, redirectStub(r.from, r.to, seo));
  }

  // Styling sanity check: the static markup only uses classes the built CSS defines.
  const cssHref = shell.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"/)?.[1];
  if (cssHref && fs.existsSync(path.join(out, cssHref))) {
    const missing = missingClasses(bodies, fs.readFileSync(path.join(out, cssHref), "utf8"));
    if (missing.length) {
      console.warn(
        `prerender: ${missing.length} class(es) not in ${cssHref}: ${missing.join(" ")}`,
      );
    }
  }

  const indexable = model.routes.filter((r) => r.indexable).length;
  console.log(
    `prerender: ${model.routes.length} routes (${indexable} indexable) -> ${written.length} files, ${jsonLdBlocks} JSON-LD blocks, ${model.redirects.length} redirect stubs, 404.html noindex (${((Date.now() - started) / 1000).toFixed(1)}s)`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error("prerender failed:", error);
    process.exit(1);
  });
}
