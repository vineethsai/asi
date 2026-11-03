/**
 * AIUC-1 tab (`/taxonomy?tab=aiuc-1&entry=A001`), AIUC-1 Q4-2026 (IMPROVEMENT_PLAN A6, §6.8).
 * The AIVSS / ASI mappings and their confidence are this site's editorial crosswalk; AIUC-1's own
 * published AIVSS crosswalk (`aivssCrosswalk`) is shown separately where it exists.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, ExternalLink, Link2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CoverageBars } from "@/components/charts/CoverageBars";
import { EmptyState } from "@/components/content/EmptyState";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import {
  AIUC1_RELEASE_DATE,
  AIUC1_VERSION,
  aiuc1Principles,
  getAiuc1Stats,
  isAiuc1RequirementActive,
  type Aiuc1Requirement,
} from "@/components/components/aiuc1Data";
import { coreRiskScores } from "@/components/components/aivssCalcData";
import { confidenceBand } from "@/lib/severity";
import { getIcon } from "@/lib/icons";
import { FRAMEWORK_PALETTE, withAlpha } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { TaxonomyTabProps } from "@/components/taxonomy/types";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { Chip } from "@/components/taxonomy/tabs/Chip";
import { TabHeading } from "@/components/taxonomy/tabs/TabHeading";
import { taxonomyHref } from "@/components/taxonomy/tabs/links";

const riskIdByName = new Map(coreRiskScores.map((r) => [r.name, r.id]));
const REQ_INDEX = new Map(
  aiuc1Principles.flatMap((p) =>
    p.requirements.map((r) => [r.id.toLowerCase(), { r, p }] as const),
  ),
);

function AivssChip({ name, secondary }: { name: string; secondary?: boolean }) {
  return (
    <Chip
      to={taxonomyHref("aivss", riskIdByName.get(name))}
      tone={secondary ? undefined : FRAMEWORK_PALETTE.aivss}
      title={`OWASP AIVSS core risk${secondary ? " (secondary)" : ""}: ${name}`}
    >
      {secondary ? "2nd: " : ""}
      {name}
    </Chip>
  );
}

function RequirementCard({
  req,
  open,
  onToggle,
  onSelect,
}: {
  req: Aiuc1Requirement;
  open: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const retired = !isAiuc1RequirementActive(req);
  const controlsId = `${entryDomId(req.id)}-controls`;
  return (
    <li
      id={entryDomId(req.id)}
      className={cn(
        "scroll-mt-24 space-y-2 rounded-lg border bg-card p-3",
        retired && "border-dashed opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSelect}
              title={`Link to ${req.id}`}
              className="inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-xs hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ borderColor: withAlpha(FRAMEWORK_PALETTE.aiuc1, 0.5) }}
            >
              {req.id}
              <Link2 aria-hidden className="h-3 w-3 opacity-60" />
            </button>
            {retired ? (
              <span className="rounded-full border px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                Retired{req.retiredIn ? ` in ${req.retiredIn}` : ""}
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                  req.application === "Mandatory"
                    ? "border-transparent bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {req.application}
              </span>
            )}
            {!retired && <span className="text-[11px] text-muted-foreground">{req.frequency}</span>}
            {req.type && <span className="text-[11px] text-muted-foreground">· {req.type}</span>}
          </div>
          <p className="mt-1 text-sm font-medium">{req.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{req.fullText}</p>
          {retired && req.replacedBy && (
            <p className="mt-1 text-xs">
              Replaced by{" "}
              <a
                href={`#${entryDomId(req.replacedBy)}`}
                className="font-mono text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  void focusEntry(entryDomId(req.replacedBy!));
                }}
              >
                {req.replacedBy}
              </a>
            </p>
          )}
        </div>
        {req.confidence && !retired && (
          <SeverityBadge
            band={confidenceBand(req.confidence)}
            label={`${req.confidence} confidence`}
            size="xs"
            title={`Mapping confidence (editorial): ${req.rationale}`}
          />
        )}
      </div>

      <div className="flex flex-wrap gap-1">
        <AivssChip name={req.aivss_primary} />
        {req.aivss_secondary && <AivssChip name={req.aivss_secondary} secondary />}
        {req.asiId && (
          <Chip
            to={taxonomyHref("owasp-agentic", req.asiId)}
            tone={FRAMEWORK_PALETTE.asi}
            title={`${req.asiId}: ${req.asiTitle ?? ""}`}
          >
            <span className="font-mono">{req.asiId}</span> {req.asiTitle}
          </Chip>
        )}
        {req.url && (
          <Chip href={req.url} title="Requirement page on standard.aiuc-1.com">
            Standard
          </Chip>
        )}
      </div>
      {req.aivssCrosswalk && req.aivssCrosswalk.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          AIUC-1’s published AIVSS crosswalk: {req.aivssCrosswalk.join(" · ")}
        </p>
      )}

      {req.controls.length > 0 && (
        <div>
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={open}
            aria-controls={controlsId}
            className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronRight
              aria-hidden
              className={cn("h-3 w-3 transition-transform", open && "rotate-90")}
            />
            {req.controls.length} control{req.controls.length !== 1 ? "s" : ""}
          </button>
          {open && (
            <ul
              id={controlsId}
              className="mt-2 space-y-1.5 border-l-2 pl-4"
              style={{ borderColor: withAlpha(FRAMEWORK_PALETTE.aiuc1, 0.35) }}
            >
              {req.controls.map((ctrl) => (
                <li key={ctrl.id} className="space-y-0.5 text-xs">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-muted-foreground">{ctrl.id}</span>
                    <span className="font-medium">{ctrl.title}</span>
                    <span className="rounded-full border px-1.5 text-[10px]">{ctrl.category}</span>
                    {ctrl.application === "Supplemental" && (
                      <span className="text-[10px] text-muted-foreground">Supplemental</span>
                    )}
                  </div>
                  <p className="text-muted-foreground">{ctrl.fullText}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

/** AIUC-1 requirements by principle, with coverage bars and AIVSS / ASI cross-references. */
export function AIUC1Content({ entry, focusKey, onEntryChange }: TaxonomyTabProps) {
  const stats = getAiuc1Stats();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("all");
  const [applicationFilter, setApplicationFilter] = useState<string>("all");
  const [showRetired, setShowRetired] = useState(false);
  const [openPrinciples, setOpenPrinciples] = useState<string[]>(() =>
    aiuc1Principles.map((p) => p.id),
  );
  const target = entry ? REQ_INDEX.get(entry.trim().toLowerCase()) : undefined;
  const targetId = target?.r.id;
  const [openControls, setOpenControls] = useState<Set<string>>(
    () => new Set(targetId ? [targetId] : []),
  );

  // Keep the requested requirement visible when ?entry= changes.
  useEffect(() => {
    const t = targetId ? REQ_INDEX.get(targetId.toLowerCase()) : undefined;
    if (!t) return;
    setOpenPrinciples((o) => (o.includes(t.p.id) ? o : [...o, t.p.id]));
    if (!isAiuc1RequirementActive(t.r)) setShowRetired(true);
  }, [targetId]);

  const targetRef = useRef(targetId);
  useEffect(() => {
    targetRef.current = targetId;
  });
  useEffect(() => {
    const id = targetRef.current;
    if (!focusKey || !id) return;
    const t = REQ_INDEX.get(id.toLowerCase());
    if (!t) return;
    setSearchQuery("");
    setApplicationFilter("all");
    setSelectedPrinciple((p) => (p === "all" || p === t.p.id ? p : "all"));
    setOpenControls((s) => new Set(s).add(id));
    void focusEntry(entryDomId(id));
  }, [focusKey]);

  const q = searchQuery.trim().toLowerCase();
  const filteredPrinciples = useMemo(
    () =>
      aiuc1Principles
        .filter((p) => selectedPrinciple === "all" || p.id === selectedPrinciple)
        .map((p) => ({
          ...p,
          requirements: p.requirements.filter((r) => {
            if (!showRetired && !isAiuc1RequirementActive(r)) return false;
            if (applicationFilter !== "all" && r.application !== applicationFilter) return false;
            return (
              !q ||
              r.id.toLowerCase().includes(q) ||
              r.title.toLowerCase().includes(q) ||
              r.fullText.toLowerCase().includes(q) ||
              r.aivss_primary.toLowerCase().includes(q) ||
              (r.aivss_secondary?.toLowerCase().includes(q) ?? false) ||
              (r.asiId?.toLowerCase().includes(q) ?? false)
            );
          }),
        }))
        .filter((p) => p.requirements.length > 0),
    [q, selectedPrinciple, applicationFilter, showRetired],
  );

  const shown = filteredPrinciples.reduce((sum, p) => sum + p.requirements.length, 0);
  const shownActive = filteredPrinciples.reduce(
    (sum, p) => sum + p.requirements.filter(isAiuc1RequirementActive).length,
    0,
  );

  const coverageRows = useMemo(
    () =>
      aiuc1Principles.map((p) => {
        const active = p.requirements.filter(isAiuc1RequirementActive);
        const mandatory = active.filter((r) => r.application === "Mandatory").length;
        return {
          id: p.id,
          label: `${p.id}. ${p.name}`,
          sublabel: `${active.filter((r) => r.asiId).length} of ${active.length} mapped to an ASI entry`,
          segments: [
            {
              id: `${p.id}-mandatory`,
              label: "Mandatory",
              value: mandatory,
              color: FRAMEWORK_PALETTE.aiuc1.css,
            },
            {
              id: `${p.id}-optional`,
              label: "Optional",
              value: active.length - mandatory,
              color: withAlpha(FRAMEWORK_PALETTE.aiuc1, 0.4),
            },
          ],
        };
      }),
    [],
  );

  const toggleControls = (id: string) => {
    const opening = !openControls.has(id);
    setOpenControls((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (opening) onEntryChange?.(id);
    else if (id === targetId) onEntryChange?.(null);
  };

  const statItems: [string, number][] = [
    ["active requirements", stats.active],
    ["mandatory", stats.mandatory],
    ["optional", stats.optional],
    ["controls", stats.controls],
    ["principles", stats.principles],
    ["retired ids", stats.retired],
  ];

  return (
    <section aria-labelledby="aiuc1-heading" className="space-y-6">
      <TabHeading
        id="aiuc1-heading"
        title="AIUC-1 requirements"
        version={`AIUC-1 ${AIUC1_VERSION}`}
        description={
          <>
            The AIUC-1 AI agent standard (release of {AIUC1_RELEASE_DATE}) by principle, with this
            site’s OWASP AIVSS and ASI cross-references.{" "}
            <a
              href="https://www.aiuc-1.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-foreground"
            >
              aiuc-1.com <ExternalLink aria-hidden className="h-3 w-3" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </>
        }
        className="mb-0"
      />

      <ul className="flex flex-wrap gap-2" aria-label="AIUC-1 summary">
        {statItems.map(([label, value]) => (
          <li
            key={label}
            className="inline-flex items-baseline gap-1.5 rounded-full border bg-muted/40 px-3 py-1 text-sm"
          >
            <span className="font-semibold tabular-nums">{value}</span>
            <span className="text-muted-foreground">{label}</span>
          </li>
        ))}
      </ul>

      <CoverageBars
        title="Active requirements by principle"
        description="Bar length = active requirements; segments split mandatory and optional."
        ariaLabel={`AIUC-1 ${AIUC1_VERSION}: active requirements per principle, split into mandatory and optional`}
        rows={coverageRows}
        valueFormat={(row, sum) =>
          `${sum} (${row.segments[0].value} mandatory · ${row.segments[1].value} optional)`
        }
        onRowClick={(row) => {
          setSelectedPrinciple(row.id);
          setOpenPrinciples((o) => (o.includes(row.id) ? o : [...o, row.id]));
        }}
        labelWidth={200}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative flex-1">
          <Label htmlFor="aiuc1-search" className="sr-only">
            Search AIUC-1 requirements
          </Label>
          <Search
            aria-hidden
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="aiuc1-search"
            type="search"
            placeholder="Search requirements, AIVSS risks, ASI ids…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <Label htmlFor="aiuc1-principle" className="sr-only">
              Principle
            </Label>
            <Select value={selectedPrinciple} onValueChange={setSelectedPrinciple}>
              <SelectTrigger id="aiuc1-principle" className="w-[200px]" aria-label="Principle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All principles</SelectItem>
                {aiuc1Principles.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.id}. {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="aiuc1-application" className="sr-only">
              Requirement type
            </Label>
            <Select value={applicationFilter} onValueChange={setApplicationFilter}>
              <SelectTrigger
                id="aiuc1-application"
                className="w-[160px]"
                aria-label="Requirement type"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Mandatory">Mandatory</SelectItem>
                <SelectItem value="Optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="aiuc1-retired" checked={showRetired} onCheckedChange={setShowRetired} />
            <Label htmlFor="aiuc1-retired" className="text-sm font-normal">
              Show retired ({stats.retired})
            </Label>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground" aria-live="polite">
        Showing {shownActive} of {stats.active} active requirements
        {showRetired ? ` and ${shown - shownActive} retired` : ""}
      </p>

      {filteredPrinciples.length === 0 ? (
        <EmptyState
          title="No requirements match"
          action={{
            label: "Clear filters",
            onClick: () => {
              setSearchQuery("");
              setSelectedPrinciple("all");
              setApplicationFilter("all");
            },
          }}
        />
      ) : (
        <Accordion type="multiple" value={openPrinciples} onValueChange={setOpenPrinciples}>
          {filteredPrinciples.map((principle) => {
            const PrincipleIcon = getIcon(principle.icon);
            return (
              <AccordionItem key={principle.id} value={principle.id}>
                <AccordionTrigger className="text-left hover:no-underline">
                  <span className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: withAlpha(FRAMEWORK_PALETTE.aiuc1, 0.12),
                        color: FRAMEWORK_PALETTE.aiuc1.css,
                      }}
                    >
                      <PrincipleIcon aria-hidden className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">
                          {principle.id}. {principle.name}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium">
                          {principle.requirements.length} shown
                        </span>
                      </span>
                      <span className="line-clamp-1 text-xs font-normal text-muted-foreground">
                        {principle.description}
                      </span>
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2 pt-2">
                    {principle.requirements.map((req) => (
                      <RequirementCard
                        key={req.id}
                        req={req}
                        open={openControls.has(req.id)}
                        onToggle={() => toggleControls(req.id)}
                        onSelect={() => onEntryChange?.(req.id)}
                      />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </section>
  );
}
