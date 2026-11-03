import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Home, Search } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCommandPalette } from "@/components/layout/commandPaletteContext";
import { HEADER_NAV } from "@/config/navigation";
import type { PaletteEntry } from "@/components/layout/paletteIndex";

function slugWords(pathname: string) {
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  try {
    return decodeURIComponent(last).replace(/[-_]+/g, " ").trim();
  } catch {
    return last;
  }
}

const NotFound = () => {
  const { pathname } = useLocation();
  const { openPalette } = useCommandPalette();
  const [query, setQuery] = useState(() => slugWords(pathname));
  const [suggestions, setSuggestions] = useState<PaletteEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    import("@/components/layout/paletteIndex")
      .then(async (mod) => {
        const entries = [...mod.staticEntries(), ...(await mod.loadDataIndex())];
        if (!cancelled) setSuggestions(mod.suggestForPath(entries, pathname));
      })
      .catch(() => {
        // Suggestions are best-effort.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    openPalette(query);
  };

  return (
    <PageLayout
      title="Page not found"
      description="The page you're looking for doesn't exist. Search the Agentic Security Hub or return to the homepage."
      canonicalPath={pathname}
      noindex
    >
      <div className="mx-auto max-w-2xl py-8 md:py-16">
        <PageHeader
          eyebrow="404"
          title="Page not found"
          description={
            <>
              Nothing lives at <code className="break-all text-foreground">{pathname}</code>. It may
              have moved, or the link may be mistyped.
            </>
          }
        />

        <form onSubmit={onSubmit} className="mb-8 flex gap-2" role="search">
          <label htmlFor="not-found-search" className="sr-only">
            Search the site
          </label>
          <Input
            id="not-found-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search threats, controls, AISVS, codes like T7…"
            autoComplete="off"
          />
          <Button type="submit">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
        </form>

        {suggestions.length > 0 && (
          <section aria-labelledby="did-you-mean" className="mb-8">
            <h2 id="did-you-mean" className="mb-3 text-base font-semibold">
              Did you mean
            </h2>
            <ul className="divide-y rounded-lg border">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <Link
                    to={s.path ?? "/"}
                    className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-accent"
                  >
                    {s.code && (
                      <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {s.code}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate font-medium">{s.title}</span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {s.path}
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-labelledby="popular-pages">
          <h2 id="popular-pages" className="mb-3 text-base font-semibold">
            Popular pages
          </h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/">
                <Home className="h-4 w-4" aria-hidden="true" />
                Home
              </Link>
            </Button>
            {HEADER_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.path} asChild variant="outline" size="sm">
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
};

export default NotFound;
