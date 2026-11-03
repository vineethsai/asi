import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  MITIGATIONS,
  RULES,
  getMitigation,
  ruleMetadata,
  type ThreatRule,
} from "../engine/catalog";
import { MAX_PROPAGATION_HOPS } from "../engine/propagation";
import { STRIDE_NAMES } from "../export/geometry";
import { MAESTRO_LAYER_NAMES, type RuleScope } from "../types";
import { Chip } from "./GuideSection";

type ScopeFilter = "all" | RuleScope;
const SCOPES: { id: ScopeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "node", label: "Node" },
  { id: "edge", label: "Edge" },
  { id: "path", label: "Path" },
  { id: "model", label: "Model" },
];

const SCOPE_HELP: Record<RuleScope, string> = {
  node: "evaluated per component",
  edge: "evaluated per data flow",
  path: "evaluated per entry-to-target path",
  model: "evaluated once for the whole model",
};

function haystack(r: ThreatRule): string {
  const m = r.maps;
  return [
    r.id,
    r.title,
    r.description,
    r.scope,
    ...(m.owaspAsi ?? []),
    ...(m.owaspAsiRelated ?? []),
    ...(m.cisco ?? []),
    ...(m.ciscoTechniques ?? []),
    ...(m.aisvs ?? []),
    ...(m.stride ?? []),
    m.catalogThreat,
    m.maestroLayer !== undefined ? MAESTRO_LAYER_NAMES[m.maestroLayer] : "",
    ...r.mitigationIds,
    ...r.mitigationIds.map((id) => getMitigation(id)?.name ?? ""),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Honest description of what drives this rule's severity (engine/severity.ts `assess`). */
function severityInputs(r: ThreatRule): string[] {
  if (r.fixedSeverity)
    return [
      "Fixed severity: a model-hygiene finding, no contextual adjustment of likelihood or impact.",
    ];
  const out = [
    "Base likelihood and impact (1–5 each) come from the rule's own match evidence; score = likelihood × impact (1–25).",
    "Likelihood: −2 when the component is unreachable from any entry point, −1 at 3+ hops, +1 for an unauthenticated entry flow, −1 when the entry path is authenticated and encrypted, −1 when the entry point is trusted (net adjustment capped at −3 / +1).",
  ];
  if (r.gates?.length)
    out.push(
      r.gateDirection === "outbound"
        ? `Gates: −2 likelihood when every path from the component back to an entry point passes a ${r.gates.join(" / ")} gate.`
        : `Gates: −2 likelihood when every entry path passes a ${r.gates.join(" / ")} gate (guardrail coverage or human approval).`,
    );
  const skip = new Set(r.skipImpactFactors ?? []);
  const impact = [
    !skip.has("data") && "sensitive data on the component or its flows",
    !skip.has("tool") && "a privileged component on or within 2 hops of it",
    !skip.has("blast") && "3+ downstream components (blast radius)",
  ].filter(Boolean);
  if (impact.length) out.push(`Impact: +1 each for ${impact.join(", ")} (capped at +2).`);
  if (skip.size)
    out.push(`Skipped impact factors: ${[...skip].join(", ")} (already in the rule's impact).`);
  return out;
}

function CodeLinks({ codes, href }: { codes?: string[]; href?: (c: string) => string }) {
  if (!codes?.length) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {codes.map((c) =>
        href ? (
          <Link
            key={c}
            to={href(c)}
            className="rounded border px-1.5 py-0.5 font-mono text-[11px] hover:bg-muted"
          >
            {c}
          </Link>
        ) : (
          <Chip key={c}>{c}</Chip>
        ),
      )}
    </span>
  );
}

function RuleRow({
  rule,
  open,
  onToggle,
}: {
  rule: ThreatRule;
  open: boolean;
  onToggle: (open: boolean) => void;
}) {
  const meta = ruleMetadata(rule);
  const m = meta.maps;
  return (
    <li id={`rule-${rule.id}`} className="scroll-mt-24">
      <details
        open={open}
        onToggle={(e) => onToggle((e.currentTarget as HTMLDetailsElement).open)}
        className="group rounded-md border bg-card"
      >
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-2 p-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="font-mono text-xs font-semibold">{rule.id}</span>
          <span className="min-w-0 flex-1 text-sm">{rule.title}</span>
          <Chip>{rule.scope}</Chip>
          {(m.owaspAsi ?? []).map((a) => (
            <Chip key={a}>{a}</Chip>
          ))}
          <span
            aria-hidden
            className="text-muted-foreground transition-transform group-open:rotate-90"
          >
            ›
          </span>
        </summary>
        <div className="space-y-3 border-t px-3 pb-3 pt-2 text-sm">
          <p className="text-muted-foreground">{rule.description}</p>
          <p className="text-xs text-muted-foreground">
            Scope: <span className="font-medium text-foreground">{rule.scope}</span> —{" "}
            {SCOPE_HELP[rule.scope]}.
            {meta.propagates &&
              ` Propagates up to ${Math.min(rule.maxHops ?? MAX_PROPAGATION_HOPS, MAX_PROPAGATION_HOPS)} hop(s) downstream, one severity level per hop; stops at authenticated + encrypted flows and at guardrail / approval gates.`}
          </p>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Severity inputs
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
              {severityInputs(rule).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Mappings
            </p>
            <dl className="mt-1 grid gap-x-3 gap-y-1 text-xs sm:grid-cols-[9rem_1fr]">
              <dt className="text-muted-foreground">OWASP Agentic (ASI)</dt>
              <dd>
                <CodeLinks
                  codes={m.owaspAsi}
                  href={(c) => `/taxonomy?tab=owasp-agentic&entry=${c}`}
                />
              </dd>
              {m.owaspAsiRelated?.length ? (
                <>
                  <dt className="text-muted-foreground">ASI (related)</dt>
                  <dd>
                    <CodeLinks
                      codes={m.owaspAsiRelated}
                      href={(c) => `/taxonomy?tab=owasp-agentic&entry=${c}`}
                    />
                  </dd>
                </>
              ) : null}
              <dt className="text-muted-foreground">Cisco objectives</dt>
              <dd>
                <CodeLinks codes={m.cisco} href={(c) => `/taxonomy?tab=cisco&entry=${c}`} />
              </dd>
              <dt className="text-muted-foreground">Cisco techniques</dt>
              <dd>
                <CodeLinks codes={m.ciscoTechniques} />
              </dd>
              <dt className="text-muted-foreground">AISVS</dt>
              <dd>
                <CodeLinks codes={m.aisvs} href={(c) => `/aisvs#${c.split(".")[0]}`} />
              </dd>
              <dt className="text-muted-foreground">STRIDE</dt>
              <dd className="text-muted-foreground">
                {m.stride?.length ? m.stride.map((s) => STRIDE_NAMES[s]).join(", ") : "—"}
              </dd>
              <dt className="text-muted-foreground">MAESTRO layer</dt>
              <dd className="text-muted-foreground">
                {m.maestroLayer !== undefined
                  ? `L${m.maestroLayer} ${MAESTRO_LAYER_NAMES[m.maestroLayer]}`
                  : "—"}
              </dd>
              <dt className="text-muted-foreground">OWASP T&amp;M threat</dt>
              <dd>
                <CodeLinks
                  codes={m.catalogThreat ? [m.catalogThreat] : []}
                  href={(c) => `/threats/${c}`}
                />
              </dd>
            </dl>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Mitigations
            </p>
            <ul className="mt-1 space-y-0.5 text-xs">
              {meta.mitigationIds.map((id) => {
                const mit = getMitigation(id);
                return (
                  <li key={id} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-mono text-[11px] text-muted-foreground">{id}</span>
                    <span>{mit?.name ?? id}</span>
                    {mit && (
                      <span className="text-muted-foreground">
                        removes {Math.round(mit.effectiveness * 100)}% of the score when implemented
                      </span>
                    )}
                    {mit?.controlId && (
                      <Link
                        to={`/controls/${mit.controlId}`}
                        className="text-primary hover:underline"
                      >
                        control {mit.controlId.toUpperCase()}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
          {meta.references.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                References
              </p>
              <ul className="mt-1 space-y-0.5 text-xs">
                {meta.references.map((ref) => (
                  <li key={ref.url}>
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      {ref.title} <ExternalLink className="h-3 w-3" aria-hidden />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </li>
  );
}

/**
 * Rules browser generated from the rule catalog (TM/engine/catalog), so the
 * Guide can never drift from the engine. Lazy-loaded by the Guide page.
 */
export default function RulesBrowser() {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const index = useMemo(() => RULES.map((r) => ({ rule: r, text: haystack(r) })), []);

  // Deep links (#rule-TM-…) clear the filters and open the rule.
  useEffect(() => {
    const apply = () => {
      const m = /^#rule-(.+)$/.exec(window.location.hash);
      if (!m || !RULES.some((r) => r.id === m[1])) return;
      setQuery("");
      setScope("all");
      setOpen((prev) => new Set(prev).add(m[1]));
      window.requestAnimationFrame(() =>
        document.getElementById(`rule-${m[1]}`)?.scrollIntoView({ block: "start" }),
      );
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const q = query.trim().toLowerCase();
  const rows = index.filter(
    (x) =>
      (scope === "all" || x.rule.scope === scope) &&
      (!q || q.split(/\s+/).every((t) => x.text.includes(t))),
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {RULES.length} rules · {MITIGATIONS.length} catalog mitigations. Every finding in the
        modeler cites one of these rule ids (also the SARIF{" "}
        <code className="font-mono">ruleId</code>).
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="rules-search" className="sr-only">
          Search rules
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id="rules-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, title, ASI01, OB-009, C2, mitigation…"
            className="h-8 pl-8 text-xs"
          />
        </div>
        <div role="group" aria-label="Filter by rule scope" className="flex flex-wrap gap-1">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={scope === s.id}
              onClick={() => setScope(s.id)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                scope === s.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "hover:bg-muted",
              )}
            >
              {s.label}
              <span className="ml-1 font-mono text-[11px] opacity-80">
                {s.id === "all" ? RULES.length : RULES.filter((r) => r.scope === s.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {rows.length} rules shown
      </p>
      {rows.length ? (
        <ul className="space-y-1.5">
          {rows.map(({ rule }) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              open={open.has(rule.id)}
              onToggle={(isOpen) =>
                setOpen((prev) => {
                  if (prev.has(rule.id) === isOpen) return prev;
                  const next = new Set(prev);
                  if (isOpen) next.add(rule.id);
                  else next.delete(rule.id);
                  return next;
                })
              }
            />
          ))}
        </ul>
      ) : (
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          No rule matches “{query}”.
        </p>
      )}
    </div>
  );
}
