export const SITE_NAME = "Agentic Security Hub";
export const SITE_ORIGIN = "https://agenticsecurity.info";

/** "/" → "home", "/threats/t1" → "threats-t1". Default OG image is `/og/${ogSlug(path)}.png`. */
export function ogSlug(canonicalPath: string): string {
  const clean = canonicalPath.split(/[?#]/)[0].replace(/^\/+|\/+$/g, "");
  return clean === "" ? "home" : clean.replace(/\//g, "-");
}

/** Site path → absolute URL on the canonical origin (absolute URLs pass through). */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_ORIGIN}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** "{title} · Agentic Security Hub" (unless the title already names the site). */
export function formatTitle(title: string): string {
  return title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;
}
