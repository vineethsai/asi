/**
 * MITRE ATLAS crosswalk tab (`/taxonomy?tab=atlas&entry=AML.T0051`), IMPROVEMENT_PLAN A9.
 * Rows come from `atlasCrosswalk` (src/data/atlasCrosswalk.ts), which is derived from the ATLAS
 * mappings Cisco publishes in its v2 taxonomy; this site does not map ATLAS itself.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/content/EmptyState";
import {
  ATLAS_RELEASE,
  atlasCrosswalk,
  normaliseAtlasId,
  type AtlasCrosswalkEntry,
} from "@/data/atlasCrosswalk";
import { CISCO_TAXONOMY_VERSION, findCiscoNode } from "@/components/components/ciscoTaxonomyData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { threatsData } from "@/components/components/securityData";
import { FRAMEWORK_PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { TaxonomyTabProps } from "@/components/taxonomy/types";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { Chip } from "./Chip";
import { SegmentedControl, type SegmentedOption } from "./SegmentedControl";
import { TabHeading } from "./TabHeading";
import { taxonomyHref } from "./links";

type KindFilter = "all" | AtlasCrosswalkEntry["kind"];

const KIND_LABEL: Record<AtlasCrosswalkEntry["kind"], string> = {
  technique: "Technique",
  "sub-technique": "Sub-technique",
  tactic: "Tactic",
};

const asiName = new Map(agenticTop10Data.map((e) => [e.code, e.name]));

function findRow(raw: string | null | undefined): AtlasCrosswalkEntry | undefined {
  if (!raw) return undefined;
  const id = normaliseAtlasId(raw.trim().toUpperCase());
  return id ? atlasCrosswalk.find((r) => r.atlasId.toUpperCase() === id.toUpperCase()) : undefined;
}

function rowMatches(r: AtlasCrosswalkEntry, q: string) {
  return (
    r.atlasId.toLowerCase().includes(q) ||
    r.atlasName.toLowerCase().includes(q) ||
    r.ciscoLabels.some((l) => l.toLowerCase().includes(q)) ||
    r.ciscoTechniqueIds.some((c) => c.toLowerCase().includes(q)) ||
    r.ciscoObjectiveIds.some((c) => c.toLowerCase().includes(q)) ||
    r.owaspAsi.some((c) => c.toLowerCase().includes(q)) ||
    r.threatIds.some((t) => (threatsData[t]?.code ?? t).toLowerCase() === q)
  );
}

function CellLabel({ children }: { children: string }) {
  return (
    <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground md:hidden">
      {children}
    </span>
  );
}

function None() {
  return <span className="text-xs text-muted-foreground">—</span>;
}

/** MITRE ATLAS ↔ Cisco ↔ OWASP ASI ↔ T&M threat crosswalk. */
export function AtlasCrosswalkContent({ entry, focusKey, onEntryChange }: TaxonomyTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [kind, setKind] = useState<KindFilter>("all");
  const [selected, setSelected] = useState<string | null>(() => findRow(entry)?.atlasId ?? null);

  const entryId = findRow(entry)?.atlasId;
  useEffect(() => {
    if (entryId) setSelected(entryId);
  }, [entryId]);

  const entryRef = useRef(entryId);
  useEffect(() => {
    entryRef.current = entryId;
  });
  useEffect(() => {
    const id = entryRef.current;
    if (!focusKey || !id) return;
    setSelected(id);
    setSearchQuery("");
    setKind("all");
    void focusEntry(entryDomId(id), { block: "center" });
  }, [focusKey]);

  const counts = useMemo(() => {
    const c = { technique: 0, "sub-technique": 0, tactic: 0 } as Record<
      AtlasCrosswalkEntry["kind"],
      number
    >;
    atlasCrosswalk.forEach((r) => c[r.kind]++);
    return c;
  }, []);
  const ciscoNodeCount = useMemo(
    () => new Set(atlasCrosswalk.flatMap((r) => r.ciscoTechniqueIds)).size,
    [],
  );

  const q = searchQuery.trim().toLowerCase();
  const rows = useMemo(
    () =>
      atlasCrosswalk.filter((r) => (kind === "all" || r.kind === kind) && (!q || rowMatches(r, q))),
    [kind, q],
  );

  const kindOptions = useMemo<SegmentedOption<KindFilter>[]>(
    () => [
      { value: "all" as const, label: `All (${atlasCrosswalk.length})` },
      ...(Object.keys(KIND_LABEL) as AtlasCrosswalkEntry["kind"][])
        .filter((k) => counts[k] > 0)
        .map((k) => ({ value: k, label: `${KIND_LABEL[k]}s (${counts[k]})` })),
    ],
    [counts],
  );

  const select = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    onEntryChange?.(next);
  };

  return (
    <section aria-labelledby="atlas-heading">
      <TabHeading
        id="atlas-heading"
        title="MITRE ATLAS crosswalk"
        version={`ATLAS ${ATLAS_RELEASE}`}
        description={`${atlasCrosswalk.length} ATLAS techniques and tactics that Cisco v${CISCO_TAXONOMY_VERSION} maps to ${ciscoNodeCount} of its techniques, with the OWASP ASI entries and T&M threats they connect to.`}
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <label htmlFor="atlas-search" className="sr-only">
            Search ATLAS techniques, Cisco codes, ASI ids
          </label>
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="atlas-search"
            type="search"
            placeholder="Search ATLAS id or name, Cisco code, ASI id, T-code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <SegmentedControl
          aria-label="Filter by ATLAS object type"
          value={kind}
          onValueChange={(v) => setKind(v)}
          options={kindOptions}
          className="self-start overflow-x-auto"
        />
      </div>

      <p className="mb-2 text-xs text-muted-foreground" aria-live="polite">
        Showing {rows.length} of {atlasCrosswalk.length}
      </p>

      {rows.length === 0 ? (
        <EmptyState
          title="No ATLAS rows match"
          action={{
            label: "Clear filters",
            onClick: () => {
              setSearchQuery("");
              setKind("all");
            },
          }}
        />
      ) : (
        <div className="md:overflow-x-auto md:rounded-lg md:border">
          <table className="w-full text-sm">
            <caption className="sr-only">
              MITRE ATLAS {ATLAS_RELEASE} techniques with the Cisco techniques, OWASP ASI entries
              and threats they map to
            </caption>
            <thead className="hidden bg-muted/40 text-left text-xs md:table-header-group">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  ATLAS technique
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Cisco techniques
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  OWASP ASI
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Threats
                </th>
              </tr>
            </thead>
            <tbody className="block space-y-3 md:table-row-group md:space-y-0">
              {rows.map((r) => {
                const isSelected = selected === r.atlasId;
                return (
                  <tr
                    key={r.atlasId}
                    id={entryDomId(r.atlasId)}
                    data-selected={isSelected || undefined}
                    className={cn(
                      "block scroll-mt-24 rounded-lg border p-3 align-top md:table-row md:rounded-none md:border-0 md:border-t md:p-0",
                      isSelected && "bg-primary/5",
                    )}
                  >
                    <th
                      scope="row"
                      className="block text-left font-normal md:table-cell md:px-3 md:py-2.5"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
                        >
                          {r.atlasId}
                          <ExternalLink aria-hidden className="h-3 w-3" />
                          <span className="sr-only">(opens on atlas.mitre.org)</span>
                        </a>
                        <span className="rounded-full border px-1.5 text-[10px] text-muted-foreground">
                          {KIND_LABEL[r.kind]}
                        </span>
                      </div>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => select(r.atlasId)}
                        className="mt-1 text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {r.atlasName}
                      </button>
                      {r.ciscoLabels.length > 0 && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Cisco label: {r.ciscoLabels.join(" · ")}
                        </span>
                      )}
                      {r.ciscoAtlasIds.length > 0 && (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          Cisco wrote:{" "}
                          <span className="font-mono">{r.ciscoAtlasIds.join(", ")}</span>
                        </span>
                      )}
                    </th>
                    <td className="mt-3 block md:mt-0 md:table-cell md:px-3 md:py-2.5">
                      <CellLabel>Cisco techniques</CellLabel>
                      <div className="flex flex-wrap gap-1">
                        {r.ciscoTechniqueIds.map((code) => {
                          const node = findCiscoNode(code);
                          return (
                            <Chip
                              key={code}
                              to={taxonomyHref("cisco", code)}
                              tone={FRAMEWORK_PALETTE.cisco}
                              title={node ? `${code}: ${node.description}` : code}
                              mono
                            >
                              {code}
                            </Chip>
                          );
                        })}
                      </div>
                    </td>
                    <td className="mt-3 block md:mt-0 md:table-cell md:px-3 md:py-2.5">
                      <CellLabel>OWASP ASI</CellLabel>
                      <div className="flex flex-wrap gap-1">
                        {r.owaspAsi.length === 0 ? (
                          <None />
                        ) : (
                          r.owaspAsi.map((code) => (
                            <Chip
                              key={code}
                              to={taxonomyHref("owasp-agentic", code)}
                              tone={FRAMEWORK_PALETTE.asi}
                              title={asiName.get(code) ? `${code}: ${asiName.get(code)}` : code}
                              mono
                            >
                              {code}
                            </Chip>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="mt-3 block md:mt-0 md:table-cell md:px-3 md:py-2.5">
                      <CellLabel>Threats</CellLabel>
                      <div className="flex flex-wrap gap-1">
                        {r.threatIds.length === 0 ? (
                          <None />
                        ) : (
                          r.threatIds.map((id) => {
                            const t = threatsData[id];
                            return (
                              <Chip
                                key={id}
                                to={`/threats/${id}`}
                                tone={FRAMEWORK_PALETTE.tm}
                                title={t ? `${t.code}: ${t.name}` : id}
                                mono
                              >
                                {t?.code ?? id}
                              </Chip>
                            );
                          })
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 max-w-3xl text-xs text-muted-foreground">
        How this is built: every row comes from a “MITRE ATLAS” mapping that Cisco publishes on a
        technique or sub-technique of its v{CISCO_TAXONOMY_VERSION} taxonomy; this site does not map
        ATLAS itself. Ids are normalised to ATLAS {ATLAS_RELEASE} (renumbered ids redirected), names
        are the official ATLAS names, ASI ids are Cisco’s OWASP mappings on the same node, and a
        threat is listed when its Cisco objective and ASI mapping both match that node.
      </p>
    </section>
  );
}
