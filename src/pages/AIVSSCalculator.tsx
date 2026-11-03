/**
 * AIVSS calculator tab (`/taxonomy?tab=aivss`), OWASP AIVSS v0.8 (IMPROVEMENT_PLAN A3, §6.8, P4-07).
 *
 * Share URL (read on load and whenever these params change; invalid values are ignored):
 *   /taxonomy?tab=aivss&f=<10 chars>&cvss=<0–10, one decimal>&em=<A|P|U>&mf=<none|partial|strong>
 *   f = one character per factor in AIVSS v0.8 vector order (AU TC NL CX ND OP PS ID MA SM):
 *       "0" = 0 (none) · "h" = 0.5 (partial) · "1" = 1 (full)
 *   e.g. ?tab=aivss&f=1111111h1h&cvss=9.4&em=P&mf=none
 * `?entry=<core risk id or rank>` loads that worked example (ignored when `f` is present).
 */
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Download, Info, Share2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gauge } from "@/components/charts/Gauge";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import {
  AIVSS_MODEL,
  agenticRiskFactors,
  coreRiskScores,
  scoreAIVSS,
  getSeverityLabel,
  type CoreRiskScore,
  type ExploitMaturity,
  type FactorLevelKey,
  type MitigationStrength,
} from "@/components/components/aivssCalcData";
import { parseBand } from "@/lib/severity";
import { FRAMEWORK_PALETTE } from "@/lib/palette";
import { cn } from "@/lib/utils";
import type { TaxonomyTabProps } from "@/components/taxonomy/types";
import { entryDomId, focusEntry } from "@/components/taxonomy/deepLink";
import { Chip } from "@/components/taxonomy/tabs/Chip";
import { SegmentedControl } from "@/components/taxonomy/tabs/SegmentedControl";
import { TabHeading } from "@/components/taxonomy/tabs/TabHeading";
import { copyText, formatYearMonth, taxonomyHref } from "@/components/taxonomy/tabs/links";

type Levels = Record<string, FactorLevelKey>;

const LEVEL_KEYS: readonly FactorLevelKey[] = ["none", "partial", "full"];
const LEVEL_CHAR: Record<FactorLevelKey, string> = { none: "0", partial: "h", full: "1" };
const CHAR_LEVEL: Record<string, FactorLevelKey> = { "0": "none", h: "partial", "1": "full" };
const EM_IDS = AIVSS_MODEL.threatMultipliers.map((t) => t.id) as ExploitMaturity[];
const MF_IDS = AIVSS_MODEL.mitigationFactors.map((m) => m.id) as MitigationStrength[];

const defaultLevels = (): Levels =>
  Object.fromEntries(agenticRiskFactors.map((f) => [f.id, "partial" as FactorLevelKey]));

function encodeFactors(levels: Levels): string {
  return agenticRiskFactors.map((f) => LEVEL_CHAR[levels[f.id] ?? "none"]).join("");
}

function decodeFactors(raw: string | null): Levels | null {
  if (!raw || raw.length !== agenticRiskFactors.length || !/^[0h1]+$/.test(raw)) return null;
  return Object.fromEntries(agenticRiskFactors.map((f, i) => [f.id, CHAR_LEVEL[raw[i]]]));
}

function parseCvss(raw: string | null): string | null {
  if (!raw || !/^\d{1,2}(\.\d)?$/.test(raw)) return null;
  const n = Number(raw);
  return n >= 0 && n <= 10 ? n.toFixed(1) : null;
}

const parseEm = (raw: string | null) =>
  raw && (EM_IDS as string[]).includes(raw) ? (raw as ExploitMaturity) : null;
const parseMf = (raw: string | null) =>
  raw && (MF_IDS as string[]).includes(raw) ? (raw as MitigationStrength) : null;

function toLevels(values: Record<string, string>): Levels {
  return Object.fromEntries(
    agenticRiskFactors.map((f) => {
      const v = values[f.id] as FactorLevelKey;
      return [f.id, LEVEL_KEYS.includes(v) ? v : "none"];
    }),
  );
}

function findRisk(raw: string | null | undefined): CoreRiskScore | undefined {
  if (!raw) return undefined;
  const k = raw.trim().toLowerCase();
  return coreRiskScores.find((r) => r.id === k || String(r.rank) === k);
}

const emOf = (thm: number) =>
  AIVSS_MODEL.threatMultipliers.find((t) => t.value === thm)?.id ?? ("P" as ExploitMaturity);
const mfOf = (mf: number) =>
  AIVSS_MODEL.mitigationFactors.find((m) => m.value === mf)?.id ?? ("none" as MitigationStrength);

const v08Band = (score: number) => parseBand(getSeverityLabel(score));

/** Calculator state for a worked example (its CVSS base, factor vector, ThM and MF). */
function riskToState(risk: CoreRiskScore) {
  return {
    cvss: risk.cvssBase.toFixed(1),
    levels: toLevels(risk.factorValues),
    em: emOf(risk.threatMultiplier),
    mf: mfOf(risk.mitigationFactor),
  };
}

/** OWASP AIVSS v0.8 calculator with shareable state and the v0.8 worked examples. */
export function AIVSSCalculatorContent({ entry, focusKey, onEntryChange }: TaxonomyTabProps) {
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const uid = useId();
  const pF = searchParams.get("f");
  const pCvss = searchParams.get("cvss");
  const pEm = searchParams.get("em");
  const pMf = searchParams.get("mf");

  const [cvssBase, setCvssBase] = useState<string>(() => parseCvss(pCvss) ?? "8.0");
  const [factorValues, setFactorValues] = useState<Levels>(
    () => decodeFactors(pF) ?? defaultLevels(),
  );
  const [exploitMaturity, setExploitMaturity] = useState<ExploitMaturity>(
    () => parseEm(pEm) ?? "P",
  );
  const [mitigation, setMitigation] = useState<MitigationStrength>(() => parseMf(pMf) ?? "none");
  const [loadedRisk, setLoadedRisk] = useState<string | null>(null);

  // Apply shared values when the share params change (first load is handled by the initialisers).
  const firstParams = useRef(true);
  useEffect(() => {
    if (firstParams.current) {
      firstParams.current = false;
      return;
    }
    const f = decodeFactors(pF);
    const c = parseCvss(pCvss);
    const em = parseEm(pEm);
    const mf = parseMf(pMf);
    if (f) setFactorValues(f);
    if (c) setCvssBase(c);
    if (em) setExploitMaturity(em);
    if (mf) setMitigation(mf);
    if (f || c) setLoadedRisk(null);
  }, [pF, pCvss, pEm, pMf]);

  const loadRisk = (risk: CoreRiskScore) => {
    const s = riskToState(risk);
    setCvssBase(s.cvss);
    setFactorValues(s.levels);
    setExploitMaturity(s.em);
    setMitigation(s.mf);
    setLoadedRisk(risk.id);
  };

  // ?entry=<risk id | rank> on deep-link requests (a shared `f` vector wins).
  const latest = useRef({ entry, hasShare: !!decodeFactors(pF) });
  useEffect(() => {
    latest.current = { entry, hasShare: !!decodeFactors(pF) };
  });
  useEffect(() => {
    const { entry: e, hasShare } = latest.current;
    const risk = findRisk(e);
    if (!focusKey || !risk) return;
    if (!hasShare) {
      const s = riskToState(risk);
      setCvssBase(s.cvss);
      setFactorValues(s.levels);
      setExploitMaturity(s.em);
      setMitigation(s.mf);
      setLoadedRisk(risk.id);
    }
    void focusEntry(entryDomId(risk.id), { block: "center" });
  }, [focusKey]);

  const cvssNum = Math.min(10, Math.max(0, parseFloat(cvssBase) || 0));
  const result = useMemo(
    () => scoreAIVSS({ cvssBase: cvssNum, factorValues, exploitMaturity, mitigation }),
    [cvssNum, factorValues, exploitMaturity, mitigation],
  );
  const loaded = coreRiskScores.find((r) => r.id === loadedRisk);

  const shareUrl = useMemo(() => {
    const qs = new URLSearchParams({
      tab: "aivss",
      f: encodeFactors(factorValues),
      cvss: cvssNum.toFixed(1),
      em: exploitMaturity,
      mf: mitigation,
    });
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${pathname}?${qs.toString()}`;
  }, [factorValues, cvssNum, exploitMaturity, mitigation, pathname]);

  const share = async () => {
    if (await copyText(shareUrl)) toast.success("Link with these factor values copied");
    else toast.error("Could not copy the link", { description: shareUrl });
  };

  const exportJSON = () => {
    const report = {
      schema: AIVSS_MODEL.id,
      model: {
        id: AIVSS_MODEL.id,
        name: AIVSS_MODEL.name,
        version: AIVSS_MODEL.version,
        published: AIVSS_MODEL.published,
        url: AIVSS_MODEL.url,
      },
      timestamp: new Date().toISOString(),
      share: shareUrl,
      basedOn: loaded ? { coreRisk: loaded.id, name: loaded.name, method: loaded.method } : null,
      cvssVersion: AIVSS_MODEL.cvssVersion,
      cvssBaseScore: result.cvssBase,
      agenticRiskFactors: agenticRiskFactors.map((f) => ({
        factorId: f.id,
        factorName: f.name,
        level: factorValues[f.id],
        value: f.levels[factorValues[f.id]]?.value ?? 0,
      })),
      factorSum: result.factorSum,
      exploitMaturity,
      threatMultiplier: result.threatMultiplier,
      mitigation,
      mitigationFactor: result.mitigationFactor,
      aars: result.aars,
      aivssScore: result.aivssScore,
      severity: result.severity,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aivss-v${AIVSS_MODEL.version}-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setFactor = (id: string, level: FactorLevelKey) => {
    setFactorValues((prev) => ({ ...prev, [id]: level }));
    setLoadedRisk(null);
  };

  const cvssId = `${uid}-cvss`;
  const emLabelId = `${uid}-em`;
  const mfLabelId = `${uid}-mf`;

  return (
    <section aria-labelledby="aivss-heading">
      <TabHeading
        id="aivss-heading"
        title="AIVSS calculator"
        version={`${AIVSS_MODEL.shortLabel} · ${formatYearMonth(AIVSS_MODEL.published)}`}
        description={
          <>
            {AIVSS_MODEL.name}: a CVSS v{AIVSS_MODEL.cvssVersion} base score plus an agentic uplift
            (AARS) from {agenticRiskFactors.length} risk amplification factors scored{" "}
            {AIVSS_MODEL.factorScale.join(" / ")}.{" "}
            <a
              href={AIVSS_MODEL.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              Specification (PDF)<span className="sr-only"> (opens in a new tab)</span>
            </a>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Step 1 */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <span className="rounded-full border px-2 py-0.5 text-xs font-medium">Step 1</span>
              CVSS v{AIVSS_MODEL.cvssVersion} base score
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor={cvssId} className="text-sm text-muted-foreground">
                Base score (0.0–10.0)
              </label>
              <Input
                id={cvssId}
                type="number"
                inputMode="decimal"
                min="0"
                max="10"
                step="0.1"
                value={cvssBase}
                onChange={(e) => {
                  setCvssBase(e.target.value);
                  setLoadedRisk(null);
                }}
                className="w-28"
              />
              <span className="text-xs text-muted-foreground">
                Must be a CVSS v{AIVSS_MODEL.cvssVersion} score (not v3.1).
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h3 className="mb-1 flex items-center gap-2 text-base font-semibold">
              <span className="rounded-full border px-2 py-0.5 text-xs font-medium">Step 2</span>
              Agentic risk amplification factors
            </h3>
            <p className="mb-4 text-xs text-muted-foreground">
              Factor_Sum = {result.factorSum.toFixed(1)} / {agenticRiskFactors.length}
            </p>
            <ul className="divide-y">
              {agenticRiskFactors.map((factor) => {
                const labelId = `${uid}-f-${factor.id}`;
                const level = factorValues[factor.id] ?? "none";
                return (
                  <li
                    key={factor.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 sm:max-w-[55%]">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px]">
                          {factor.abbreviation}
                        </span>
                        <span id={labelId} className="text-sm font-medium">
                          {factor.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{factor.question}</p>
                    </div>
                    <div className="flex flex-col gap-1 sm:items-end">
                      <SegmentedControl
                        aria-labelledby={labelId}
                        value={level}
                        onValueChange={(v) => setFactor(factor.id, v)}
                        options={LEVEL_KEYS.map((k) => ({
                          value: k,
                          label: `${factor.levels[k].label} · ${factor.levels[k].value}`,
                          ariaLabel: `${factor.levels[k].label} (${factor.levels[k].value})`,
                          title: factor.levels[k].description,
                        }))}
                      />
                      <span className="text-[11px] text-muted-foreground sm:text-right">
                        {factor.levels[level].description}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Step 3 */}
          <div className="rounded-lg border bg-card p-4 sm:p-5">
            <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <span className="rounded-full border px-2 py-0.5 text-xs font-medium">Step 3</span>
              Exploit maturity and mitigation
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <span id={emLabelId} className="block text-sm font-medium">
                  Exploit maturity (Threat Multiplier)
                </span>
                <SegmentedControl
                  aria-labelledby={emLabelId}
                  value={exploitMaturity}
                  onValueChange={(v) => {
                    setExploitMaturity(v);
                    setLoadedRisk(null);
                  }}
                  fullWidth
                  options={AIVSS_MODEL.threatMultipliers.map((t) => ({
                    value: t.id,
                    label: `${t.label} ${t.value.toFixed(2)}`,
                    ariaLabel: `${t.label} (ThM ${t.value.toFixed(2)})`,
                    title: t.description,
                  }))}
                />
              </div>
              <div className="space-y-1.5">
                <span id={mfLabelId} className="block text-sm font-medium">
                  Mitigation strength (Mitigation Factor)
                </span>
                <SegmentedControl
                  aria-labelledby={mfLabelId}
                  value={mitigation}
                  onValueChange={(v) => {
                    setMitigation(v);
                    setLoadedRisk(null);
                  }}
                  fullWidth
                  options={AIVSS_MODEL.mitigationFactors.map((m) => ({
                    value: m.id,
                    label: `${m.label.replace(" Mitigation", "")} ${m.value.toFixed(2)}`,
                    ariaLabel: `${m.label} (${m.value.toFixed(2)})`,
                    title: m.description,
                  }))}
                />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Defaults follow {AIVSS_MODEL.shortLabel}: Proof-of-Concept (ThM{" "}
              {AIVSS_MODEL.threatMultipliers.find((t) => "default" in t)?.value.toFixed(2)}) and
              No/Weak Mitigation (
              {AIVSS_MODEL.mitigationFactors.find((m) => "default" in m)?.value.toFixed(2)}).
            </p>
          </div>
        </div>

        {/* Result */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div id="aivss-result" className="scroll-mt-24 rounded-lg border bg-card p-4 sm:p-5">
            <h3 className="mb-3 text-base font-semibold">{AIVSS_MODEL.shortLabel} score</h3>
            <div className="flex flex-col items-center" aria-live="polite">
              <Gauge score={result.aivssScore} label={result.severity} />
              {loaded && (
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  Loaded: {loaded.name} (§{loaded.section})
                </p>
              )}
            </div>
            <dl className="mt-4 space-y-2 text-sm">
              {(
                [
                  [`CVSS v${AIVSS_MODEL.cvssVersion} base`, result.cvssBase.toFixed(1)],
                  ["Factor_Sum", `${result.factorSum.toFixed(1)} / ${agenticRiskFactors.length}`],
                  ["Threat Multiplier (ThM)", result.threatMultiplier.toFixed(2)],
                  ["AARS (agentic uplift)", result.aars.toFixed(2)],
                  ["Mitigation Factor", result.mitigationFactor.toFixed(2)],
                ] as const
              ).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-mono tabular-nums">{v}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-2 border-t pt-2">
                <dt className="font-semibold">AIVSS score</dt>
                <dd className="flex items-center gap-2">
                  <SeverityBadge
                    band={v08Band(result.aivssScore)}
                    label={result.severity}
                    size="xs"
                  />
                  <span className="font-mono text-lg font-bold tabular-nums">
                    {result.aivssScore.toFixed(1)}
                  </span>
                </dd>
              </div>
            </dl>

            <div className="mt-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Info aria-hidden className="h-3.5 w-3.5" /> Formula ({AIVSS_MODEL.shortLabel})
              </p>
              <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-muted/50 p-3 font-mono text-[11px] leading-relaxed">
                {[
                  AIVSS_MODEL.formula.factorSum,
                  AIVSS_MODEL.formula.aars,
                  AIVSS_MODEL.formula.aivss,
                ].join("\n")}
              </pre>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={share} variant="outline" size="sm">
                <Share2 aria-hidden className="mr-1.5 h-4 w-4" />
                Share
              </Button>
              <Button onClick={exportJSON} variant="outline" size="sm">
                <Download aria-hidden className="mr-1.5 h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Worked examples */}
      <div className="mt-8 rounded-lg border bg-card p-4 sm:p-5">
        <h3 className="text-base font-semibold">
          Agentic AI core risks — {AIVSS_MODEL.shortLabel} worked examples
        </h3>
        <p className="mb-3 mt-1 text-xs text-muted-foreground">
          {coreRiskScores[0]?.method}. Select “Load” to put an example into the calculator. ASI
          codes follow v{AIVSS_MODEL.version} Appendix B; filled chips mark the entry that lists the
          risk as primary.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {AIVSS_MODEL.shortLabel} worked examples, sorted by score
            </caption>
            <thead>
              <tr className="border-b text-left text-xs">
                <th scope="col" className="px-2 py-2 font-medium">
                  Rank
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  Core risk
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  ASI
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  CVSS v4.0
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  AARS
                </th>
                <th scope="col" className="px-2 py-2 text-right font-medium">
                  AIVSS
                </th>
                <th scope="col" className="px-2 py-2 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {coreRiskScores.map((risk) => {
                const active = loadedRisk === risk.id;
                return (
                  <tr
                    key={risk.id}
                    id={entryDomId(risk.id)}
                    className={cn("scroll-mt-24 border-b align-top", active && "bg-primary/5")}
                  >
                    <td className="px-2 py-2.5 font-mono">{risk.rank}</td>
                    <th scope="row" className="px-2 py-2.5 text-left font-medium">
                      {risk.name}
                      <span className="block font-mono text-[11px] font-normal text-muted-foreground">
                        §{risk.section}
                      </span>
                    </th>
                    <td className="px-2 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {risk.asiCodes.map((code) => {
                          const primary = risk.asiPrimary.includes(code);
                          return (
                            <Chip
                              key={code}
                              to={taxonomyHref("owasp-agentic", code)}
                              tone={primary ? FRAMEWORK_PALETTE.asi : undefined}
                              title={`${code}: ${primary ? "primary" : "secondary"} AIVSS core risk`}
                              mono
                            >
                              {code}
                            </Chip>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                      {risk.cvssBase.toFixed(1)}
                    </td>
                    <td className="px-2 py-2.5 text-right font-mono tabular-nums">
                      {risk.aars.toFixed(2)}
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <span className="inline-flex items-center gap-1.5">
                        <SeverityBadge
                          band={v08Band(risk.aivssScore)}
                          label={risk.severity}
                          size="xs"
                          showLabel={false}
                        />
                        <span className="font-mono font-bold tabular-nums">
                          {risk.aivssScore.toFixed(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant={active ? "secondary" : "ghost"}
                        aria-pressed={active}
                        aria-label={`Load ${risk.name} into the calculator`}
                        onClick={() => {
                          loadRisk(risk);
                          onEntryChange?.(risk.id);
                          void focusEntry("aivss-result", { block: "center" });
                        }}
                      >
                        <Upload aria-hidden className="mr-1 h-3.5 w-3.5" />
                        Load
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <details className="mt-4 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground">
            Model notes ({AIVSS_MODEL.notes.length})
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {AIVSS_MODEL.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
          <p className="mt-2">
            Related:{" "}
            <Link to={taxonomyHref("aiuc-1")} className="underline">
              AIUC-1 crosswalk
            </Link>{" "}
            ·{" "}
            <Link to={taxonomyHref("owasp-agentic")} className="underline">
              OWASP ASI Top 10
            </Link>
          </p>
        </details>
      </div>
    </section>
  );
}
