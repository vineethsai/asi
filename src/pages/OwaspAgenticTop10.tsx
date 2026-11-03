import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Link2,
  Search,
  Target,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/content/EmptyState";
import {
  AGENTIC_TOP10_EDITION,
  agenticTop10Data,
  type AgenticTop10Entry,
} from "@/components/components/owaspAgenticTop10Data";
import { mitigationsData, threatsData } from "@/components/components/securityData";
import { coreRiskScores } from "@/components/components/aivssCalcData";
import { findCiscoNode } from "@/components/components/ciscoTaxonomyData";
import { findLlmTop10Entry } from "@/components/components/owaspLlmTop10Data";
import { ATLAS_NAMES, getAtlasForAsi } from "@/data/atlasCrosswalk";
import { scenariosForAsi } from "@/data/scenarios";
import { ScenarioLinks } from "@/components/scenarios/ScenarioLinks";
import { getIcon } from "@/lib/icons";
import { FRAMEWORK_PALETTE, withAlpha } from "@/lib/palette";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import type { TaxonomyTabProps } from "@/components/taxonomy/types";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { Chip, ChipRow } from "@/components/taxonomy/tabs/Chip";
import { TabHeading } from "@/components/taxonomy/tabs/TabHeading";
import { copyText, formatYearMonth, taxonomyHref } from "@/components/taxonomy/tabs/links";

const findCode = (code: string | null | undefined) =>
  code
    ? agenticTop10Data.find((e) => e.code.toLowerCase() === code.trim().toLowerCase())?.code
    : undefined;

const aivssRiskByName = new Map(coreRiskScores.map((r) => [r.name, r]));

function matches(e: AgenticTop10Entry, q: string) {
  return (
    e.code.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.description.toLowerCase().includes(q) ||
    e.attackScenarios.some((s) => s.title.toLowerCase().includes(q))
  );
}

function EntryCrossRefs({ entry }: { entry: AgenticTop10Entry }) {
  const threats = entry.relatedThreats.map((id) => threatsData[id]).filter(Boolean);
  const controlIds = [...new Set(threats.flatMap((t) => t.mitigationIds ?? []))].filter(
    (id) => mitigationsData[id],
  );
  const atlas = getAtlasForAsi(entry.code);
  const aivss = [entry.relatedAIVSSRisk, ...(entry.relatedAIVSSSecondary ?? [])];

  return (
    <div className="space-y-2.5">
      {threats.length > 0 && (
        <ChipRow label="Threats (T&M v1.1)">
          {threats.map((t) => (
            <Chip
              key={t.id}
              to={`/threats/${t.id}`}
              tone={FRAMEWORK_PALETTE.tm}
              title={`${t.code}: ${t.name}`}
            >
              <span className="font-mono">{t.code}</span> {t.shortName ?? t.name}
            </Chip>
          ))}
        </ChipRow>
      )}
      {controlIds.length > 0 && (
        <ChipRow label="Controls">
          {controlIds.map((id) => (
            <Chip key={id} to={`/controls/${id}`} title={mitigationsData[id].name}>
              <span className="font-mono text-muted-foreground">{id.toUpperCase()}</span>{" "}
              {mitigationsData[id].name}
            </Chip>
          ))}
        </ChipRow>
      )}
      <ChipRow label="AIVSS v0.8">
        {aivss.map((name, i) => {
          const risk = aivssRiskByName.get(name);
          return (
            <Chip
              key={name}
              to={taxonomyHref("aivss", risk?.id)}
              tone={FRAMEWORK_PALETTE.aivss}
              title={i === 0 ? `${name} (primary)` : `${name} (secondary)`}
            >
              {i === 0 ? "" : "2nd: "}
              {name}
            </Chip>
          );
        })}
      </ChipRow>
      {entry.relatedCiscoObjectives.length > 0 && (
        <ChipRow label="Cisco v2">
          {entry.relatedCiscoObjectives.map((code) => {
            const node = findCiscoNode(code);
            return (
              <Chip
                key={code}
                to={taxonomyHref("cisco", code)}
                tone={FRAMEWORK_PALETTE.cisco}
                title={node ? `${code}: ${node.description}` : code}
              >
                <span className="font-mono">{code}</span>
                {node ? ` ${node.description}` : ""}
              </Chip>
            );
          })}
        </ChipRow>
      )}
      {atlas.length > 0 && (
        <ChipRow label="MITRE ATLAS">
          {atlas.map((row) => (
            <Chip
              key={row.atlasId}
              to={taxonomyHref("atlas", row.atlasId)}
              tone={FRAMEWORK_PALETTE.nist}
              title={`${row.atlasId}: ${ATLAS_NAMES[row.atlasId] ?? row.atlasName}`}
              mono
            >
              {row.atlasId}
            </Chip>
          ))}
        </ChipRow>
      )}
      {entry.relatedLLMTop10.length > 0 && (
        <ChipRow label="LLM Top 10">
          {entry.relatedLLMTop10.map((ref) => {
            const llm = findLlmTop10Entry(ref);
            return (
              <Chip
                key={ref}
                to={taxonomyHref("llm-top10", llm?.id)}
                tone={FRAMEWORK_PALETTE.llm}
                title={llm ? `${ref} → ${llm.code} ${llm.name}` : ref}
              >
                {ref}
              </Chip>
            );
          })}
        </ChipRow>
      )}
    </div>
  );
}

/** Step-by-step attack walkthroughs (P4-03) that exercise this ASI entry. */
function EntryWalkthroughs({ code }: { code: string }) {
  const scenarios = scenariosForAsi(code);
  if (!scenarios.length) return null;
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Walk through it step by step</p>
      <ScenarioLinks scenarios={scenarios} title={null} />
    </div>
  );
}

function EntryBody({ entry }: { entry: AgenticTop10Entry }) {
  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-muted-foreground">{entry.description}</p>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CircleAlert aria-hidden className="h-4 w-4 text-muted-foreground" />
          Common examples
        </h4>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground marker:text-muted-foreground/60">
          {entry.commonExamples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ol>
      </section>

      <section>
        <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Target aria-hidden className="h-4 w-4 text-muted-foreground" />
          Attack scenarios
          <span className="font-normal text-muted-foreground">
            ({entry.attackScenarios.length})
          </span>
        </h4>
        <Accordion type="multiple" className="rounded-md border px-3">
          {entry.attackScenarios.map((sc, i) => (
            <AccordionItem
              key={sc.title}
              value={`${entry.code}-sc-${i}`}
              className="last:border-b-0"
            >
              <AccordionTrigger
                headingLevel={5}
                className="py-3 text-left text-sm hover:no-underline"
              >
                {sc.title}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {sc.description}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <EntryWalkthroughs code={entry.code} />
      </section>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CircleCheck aria-hidden className="h-4 w-4 text-muted-foreground" />
          Prevention and mitigation guidelines
        </h4>
        <ul className="space-y-2">
          {entry.preventionGuidelines.map((g) => (
            <li key={g} className="flex gap-2 text-muted-foreground">
              <CircleCheck
                aria-hidden
                className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
              />
              {g}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <BookOpen aria-hidden className="h-4 w-4 text-muted-foreground" />
          Cross references
        </h4>
        <EntryCrossRefs entry={entry} />
      </section>

      {entry.references.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ExternalLink aria-hidden className="h-4 w-4 text-muted-foreground" />
            References
          </h4>
          <ul className="space-y-1">
            {entry.references.map((ref) => (
              <li key={ref.url}>
                <a
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink aria-hidden className="h-3 w-3" />
                  {ref.title}
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** OWASP Top 10 for Agentic Applications tab (`/taxonomy?tab=owasp-agentic&entry=ASI01`). */
export function OwaspAgenticTop10Content({ entry, focusKey, onEntryChange }: TaxonomyTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(() => findCode(entry) ?? null);
  const { ref: listRef } = useReveal<HTMLDivElement>();

  // Keep expansion in sync with ?entry= (palette, back/forward).
  const entryCode = findCode(entry);
  useEffect(() => {
    if (entryCode) setExpanded(entryCode);
  }, [entryCode]);

  // Bring the entry into view on deep-link requests only (not on our own URL writes).
  const entryRef = useRef(entryCode);
  useEffect(() => {
    entryRef.current = entryCode;
  });
  useEffect(() => {
    const code = entryRef.current;
    if (!focusKey || !code) return;
    const target = agenticTop10Data.find((e) => e.code === code);
    setExpanded(code);
    // Clear a search that would hide the requested entry.
    setSearchQuery((q) =>
      q.trim() && target && !matches(target, q.trim().toLowerCase()) ? "" : q,
    );
    void focusEntry(entryDomId(code));
  }, [focusKey]);

  const q = searchQuery.trim().toLowerCase();
  const filteredEntries = useMemo(
    () => (q ? agenticTop10Data.filter((e) => matches(e, q)) : agenticTop10Data),
    [q],
  );

  const select = (code: string | null) => {
    setExpanded(code);
    onEntryChange?.(code);
  };

  const jumpTo = (code: string) => {
    if (q && !filteredEntries.some((e) => e.code === code)) setSearchQuery("");
    select(code);
    void focusEntry(entryDomId(code), { highlight: false });
  };

  return (
    <section aria-labelledby="owasp-agentic-heading">
      <TabHeading
        id="owasp-agentic-heading"
        title="OWASP Top 10 for Agentic Applications"
        version={`${AGENTIC_TOP10_EDITION.version} · ${formatYearMonth(AGENTIC_TOP10_EDITION.published)}`}
        description="The most critical security risks for autonomous AI agents, with examples, attack scenarios, prevention guidance and cross-references to threats, controls, AIVSS, Cisco and MITRE ATLAS."
      />

      <nav aria-label="Jump to an entry" className="mb-5">
        <ul className="flex flex-wrap gap-1.5">
          {agenticTop10Data.map((e) => (
            <li key={e.code}>
              <button
                type="button"
                onClick={() => jumpTo(e.code)}
                aria-current={expanded === e.code ? "true" : undefined}
                title={e.name}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  "hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  expanded === e.code
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="font-mono font-semibold text-foreground">{e.code}</span>
                <span className="hidden max-w-[12rem] truncate sm:inline">{e.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative mb-5">
        <label htmlFor="asi-search" className="sr-only">
          Search ASI entries
        </label>
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="asi-search"
          type="search"
          placeholder="Search ASI entries, descriptions, scenarios…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredEntries.length === 0 ? (
        <EmptyState
          title={`No entries match “${searchQuery}”`}
          description="Try a code such as ASI03 or a keyword from the description."
          action={{ label: "Clear search", onClick: () => setSearchQuery("") }}
        />
      ) : (
        <div ref={listRef}>
          <Accordion
            type="single"
            collapsible
            value={expanded ?? ""}
            onValueChange={(v) => select(v || null)}
            className="space-y-3"
          >
            {filteredEntries.map((e, i) => {
              const EntryIcon = getIcon(e.icon);
              const accent = withAlpha(FRAMEWORK_PALETTE.asi, 0.8);
              return (
                <AccordionItem
                  key={e.code}
                  value={e.code}
                  id={entryDomId(e.code)}
                  className="enter scroll-mt-24 rounded-lg border border-l-4 bg-card"
                  style={{ ...stagger(i), borderLeftColor: accent }}
                >
                  <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6">
                    <span className="flex w-full items-center gap-3">
                      <EntryIcon
                        aria-hidden
                        className="h-5 w-5 flex-shrink-0 text-muted-foreground"
                      />
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="rounded border px-1.5 py-0.5 font-mono text-xs">
                            {e.code}
                          </span>
                          <span className="text-base font-semibold sm:text-lg">{e.name}</span>
                        </span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          {e.relatedThreats.length} threats · {e.attackScenarios.length} attack
                          scenarios · {e.preventionGuidelines.length} guidelines
                        </span>
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-6 sm:px-6">
                    <EntryBody entry={e} />
                    <p className="mt-6">
                      <button
                        type="button"
                        onClick={async () => {
                          select(e.code);
                          const url = `${window.location.origin}${taxonomyHref("owasp-agentic", e.code)}`;
                          if (await copyText(url)) toast.success(`Link to ${e.code} copied`);
                          else toast.error("Could not copy the link");
                        }}
                        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Link2 aria-hidden className="h-3.5 w-3.5" />
                        Copy link to {e.code}
                      </button>
                    </p>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </section>
  );
}
