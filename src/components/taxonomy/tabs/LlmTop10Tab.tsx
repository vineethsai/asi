/**
 * OWASP Top 10 for LLM Applications tab (`/taxonomy?tab=llm-top10&entry=LLM01`).
 *
 * Data: src/components/components/owaspLlmTop10Data.ts (2026 edition). `?entry=` also accepts
 * 2025 ids ("LLM06:2025" opens LLM03:2026 Excessive Agency) through `findLlmTop10Entry`.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, CircleAlert, ExternalLink, History, Link2, Search } from "lucide-react";
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
  LLM_ATLAS_TACTICS,
  LLM_CWE_NAMES,
  OWASP_LLM_TOP10_EDITION,
  atlasTacticUrl,
  cweUrl,
  findLlmTop10Entry,
  llmTop10Data,
  type LlmTop10Entry,
} from "@/components/components/owaspLlmTop10Data";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { mitigationsData, threatsData } from "@/components/components/securityData";
import { findCiscoNode } from "@/components/components/ciscoTaxonomyData";
import { aisvsData, AISVS_VERSION } from "@/data/aisvs";
import { FRAMEWORK_PALETTE } from "@/lib/palette";
import { stagger } from "@/lib/motion";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import type { TaxonomyTabProps } from "@/components/taxonomy/types";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { Chip, ChipRow } from "@/components/taxonomy/tabs/Chip";
import { TabHeading } from "@/components/taxonomy/tabs/TabHeading";
import { copyText, formatYearMonth, taxonomyHref } from "@/components/taxonomy/tabs/links";

const TAB = "llm-top10";
const asiByCode = new Map(agenticTop10Data.map((e) => [e.code, e]));

/** The entry id for a `?entry=` value (2026 id, edition-qualified code or 2025 citation). */
const findId = (code: string | null | undefined) => findLlmTop10Entry(code)?.id;

/** True when the entry's 2025 id or name differs from 2026 (renumbered or renamed). */
const changedSince2025 = (e: LlmTop10Entry) => e.previous.id !== e.id || e.previous.name !== e.name;

function matches(e: LlmTop10Entry, q: string) {
  return (
    e.id.toLowerCase().includes(q) ||
    e.previous.code.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.previous.name.toLowerCase().includes(q) ||
    e.summary.toLowerCase().includes(q) ||
    e.examples.some((x) => x.toLowerCase().includes(q))
  );
}

function EntryCrossRefs({ entry }: { entry: LlmTop10Entry }) {
  const threats = entry.relatedThreats.map((id) => threatsData[id]).filter(Boolean);
  const controls = entry.relatedControls.map((id) => mitigationsData[id]).filter(Boolean);
  const aisvsChips = [
    ...entry.relatedAisvs.map((code) => ({ code, primary: true })),
    ...entry.supportingAisvs.map((code) => ({ code, primary: false })),
  ];

  return (
    <div className="space-y-2.5">
      <ChipRow label="Agentic Top 10">
        {entry.relatedAsi.map((code) => {
          const asi = asiByCode.get(code);
          return (
            <Chip
              key={code}
              to={taxonomyHref("owasp-agentic", code)}
              tone={FRAMEWORK_PALETTE.asi}
              title={asi ? `${code}: ${asi.name}` : code}
            >
              <span className="font-mono">{code}</span>
              {asi ? ` ${asi.name}` : ""}
            </Chip>
          );
        })}
      </ChipRow>
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
      {controls.length > 0 && (
        <ChipRow label="Controls">
          {controls.map((m) => (
            <Chip key={m.id} to={`/controls/${m.id}`} title={m.name}>
              <span className="font-mono text-muted-foreground">{m.id.toUpperCase()}</span> {m.name}
            </Chip>
          ))}
        </ChipRow>
      )}
      <ChipRow label={`AISVS ${AISVS_VERSION}`}>
        {aisvsChips.map(({ code, primary }) => {
          const chapter = aisvsData[code];
          const role = primary ? "primary defence" : "supporting defence";
          return (
            <Chip
              key={code}
              to={`/aisvs#${code}`}
              title={chapter ? `${code} ${chapter.name} (${role})` : `${code} (${role})`}
              className={primary ? undefined : "border-dashed"}
            >
              <span className="font-mono">{code}</span>
              {chapter ? ` ${chapter.name}` : ""}
              {primary ? "" : " (supporting)"}
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
      <ChipRow label="MITRE ATLAS tactics">
        {entry.atlasTactics.map((id) => (
          <Chip
            key={id}
            href={atlasTacticUrl(id)}
            tone={FRAMEWORK_PALETTE.nist}
            title={`${id}: ${LLM_ATLAS_TACTICS[id] ?? id}`}
          >
            <span className="font-mono">{id}</span> {LLM_ATLAS_TACTICS[id]}
          </Chip>
        ))}
      </ChipRow>
      <ChipRow label="CWE">
        {entry.cwe.map((id) => (
          <Chip key={id} href={cweUrl(id)} title={`${id}: ${LLM_CWE_NAMES[id] ?? id}`}>
            <span className="font-mono">{id}</span>
          </Chip>
        ))}
      </ChipRow>
    </div>
  );
}

function EntryBody({ entry }: { entry: LlmTop10Entry }) {
  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-muted-foreground">{entry.summary}</p>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <CircleAlert aria-hidden className="h-4 w-4 text-muted-foreground" />
          Common examples
        </h4>
        <ol className="list-decimal space-y-2 pl-5 text-muted-foreground marker:text-muted-foreground/60">
          {entry.examples.map((ex) => (
            <li key={ex}>{ex}</li>
          ))}
        </ol>
      </section>

      <section>
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <BookOpen aria-hidden className="h-4 w-4 text-muted-foreground" />
          Cross references
        </h4>
        <EntryCrossRefs entry={entry} />
        <p className="mt-3 text-xs text-muted-foreground">
          Agentic Top 10, ATLAS and CWE links are the edition&apos;s own Appendix A mappings and the
          AISVS chapters come from its AISVS appendix; Cisco links come from Cisco&apos;s taxonomy
          data. Threat and control links are this site&apos;s: {entry.mappingNote}
        </p>
      </section>

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
    </div>
  );
}

/** OWASP Top 10 for LLM Applications tab content. */
export function LlmTop10Content({ entry, focusKey, onEntryChange }: TaxonomyTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(() => findId(entry) ?? null);
  const { ref: listRef } = useReveal<HTMLDivElement>();

  // Keep expansion in sync with ?entry= (palette, back/forward).
  const entryId = findId(entry);
  useEffect(() => {
    if (entryId) setExpanded(entryId);
  }, [entryId]);

  // Bring the entry into view on deep-link requests only (not on our own URL writes).
  const entryRef = useRef(entryId);
  useEffect(() => {
    entryRef.current = entryId;
  });
  useEffect(() => {
    const id = entryRef.current;
    if (!focusKey || !id) return;
    const target = llmTop10Data.find((e) => e.id === id);
    setExpanded(id);
    setSearchQuery((q) =>
      q.trim() && target && !matches(target, q.trim().toLowerCase()) ? "" : q,
    );
    void focusEntry(entryDomId(id));
  }, [focusKey]);

  const q = searchQuery.trim().toLowerCase();
  const filtered = useMemo(
    () => (q ? llmTop10Data.filter((e) => matches(e, q)) : llmTop10Data),
    [q],
  );

  const select = (id: string | null) => {
    setExpanded(id);
    onEntryChange?.(id);
  };

  const jumpTo = (id: string) => {
    if (q && !filtered.some((e) => e.id === id)) setSearchQuery("");
    select(id);
    void focusEntry(entryDomId(id), { highlight: false });
  };

  return (
    <section aria-labelledby="llm-top10-heading">
      <TabHeading
        id="llm-top10-heading"
        title="OWASP Top 10 for LLM Applications"
        version={`${OWASP_LLM_TOP10_EDITION.version} · ${formatYearMonth(OWASP_LLM_TOP10_EDITION.published)}`}
        description="The ten most critical risks when an LLM is a component of your application, with examples and links to the agentic threats, controls, AISVS chapters, Cisco objectives, MITRE ATLAS tactics and CWEs that address them."
      />

      <p className="mb-5 max-w-3xl text-sm text-muted-foreground">
        The {OWASP_LLM_TOP10_EDITION.version} edition renumbered the list: Excessive Agency rose to
        third, Unbounded Consumption to sixth, Improper Output Handling fell to tenth, and System
        Prompt Leakage became Hidden Context Exposure. Each entry shows its{" "}
        {OWASP_LLM_TOP10_EDITION.previousVersion} id. Once the model acts as an agent, pair an entry
        with the OWASP Agentic Top 10.
      </p>

      <nav aria-label="Jump to an entry" className="mb-5">
        <ul className="flex flex-wrap gap-1.5">
          {llmTop10Data.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => jumpTo(e.id)}
                aria-current={expanded === e.id ? "true" : undefined}
                title={e.name}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  "hover:border-primary/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  expanded === e.id
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "text-muted-foreground",
                )}
              >
                <span className="font-mono font-semibold text-foreground">{e.id}</span>
                <span className="hidden max-w-[12rem] truncate sm:inline">{e.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative mb-5">
        <label htmlFor="llm-search" className="sr-only">
          Search LLM Top 10 entries
        </label>
        <Search
          aria-hidden
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="llm-search"
          type="search"
          placeholder="Search LLM entries, 2025 ids, examples…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={`No entries match “${searchQuery}”`}
          description="Try a code such as LLM03, a 2025 id such as LLM07:2025, or a keyword."
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
            {filtered.map((e, i) => (
              <AccordionItem
                key={e.id}
                value={e.id}
                id={entryDomId(e.id)}
                className="enter scroll-mt-24 rounded-lg border border-l-4 border-l-primary/60 bg-card"
                style={stagger(i)}
              >
                <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6">
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="rounded border px-1.5 py-0.5 font-mono text-xs">
                        {e.code}
                      </span>
                      <span className="text-base font-semibold sm:text-lg">{e.name}</span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs font-normal text-muted-foreground">
                      <History aria-hidden className="h-3.5 w-3.5" />
                      {changedSince2025(e) ? (
                        <span>
                          was {e.previous.code}
                          {e.previous.name !== e.name ? ` ${e.previous.name}` : ""}
                        </span>
                      ) : (
                        <span>unchanged from {e.previous.code}</span>
                      )}
                      <span aria-hidden>·</span>
                      <span>
                        {e.relatedAsi.length} Agentic Top 10 · {e.relatedThreats.length} threats ·{" "}
                        {e.relatedControls.length} controls
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
                        select(e.id);
                        const url = `${window.location.origin}${taxonomyHref(TAB, e.id)}`;
                        if (await copyText(url)) toast.success(`Link to ${e.id} copied`);
                        else toast.error("Could not copy the link");
                      }}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Link2 aria-hidden className="h-3.5 w-3.5" />
                      Copy link to {e.id}
                    </button>
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </section>
  );
}
