import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, BarChart3, Info } from "lucide-react";
import {
  AIVSS_MODEL,
  agenticRiskFactors,
  coreRiskScores,
  calculateAARS,
  calculateFactorSum,
  calculateThreatMultiplier,
  calculateAIVSS,
  getMitigationFactor,
  getSeverityLabel,
  getSeverityColor,
  type ExploitMaturity,
  type FactorLevel,
  type FactorLevelKey,
  type MitigationStrength,
} from "@/components/components/aivssCalcData";

function ScoreGauge({ score, label }: { score: number; label: string }) {
  const percentage = (score / 10) * 100;
  const severity = getSeverityLabel(score);
  const colorMap: Record<string, string> = {
    Critical: "#ef4444",
    High: "#f97316",
    Medium: "#eab308",
    Low: "#22c55e",
  };
  const color = colorMap[severity] || "#6b7280";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${percentage * 2.64} 264`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score.toFixed(1)}</span>
          <span className="text-xs text-muted-foreground">/10.0</span>
        </div>
      </div>
      <Badge className={`mt-2 ${getSeverityColor(severity)}`}>{severity}</Badge>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

export function AIVSSCalculatorContent() {
  const [cvssBase, setCvssBase] = useState<string>("8.0");
  const [factorValues, setFactorValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {};
    agenticRiskFactors.forEach((f) => {
      defaults[f.id] = "partial";
    });
    return defaults;
  });
  const [exploitMaturity, setExploitMaturity] = useState<ExploitMaturity>("P");
  const [mitigation, setMitigation] = useState<MitigationStrength>("none");

  const handleFactorChange = useCallback((factorId: string, level: string) => {
    setFactorValues((prev) => ({ ...prev, [factorId]: level }));
  }, []);

  const cvssNum = Math.min(10, Math.max(0, parseFloat(cvssBase) || 0));
  const factorSum = useMemo(() => calculateFactorSum(factorValues), [factorValues]);
  const thm = calculateThreatMultiplier(exploitMaturity);
  const mitigationFactor = getMitigationFactor(mitigation);
  const aars = useMemo(
    () => calculateAARS(cvssNum, factorValues, thm),
    [cvssNum, factorValues, thm],
  );
  const aivssScore = useMemo(
    () => calculateAIVSS(cvssNum, aars, mitigationFactor),
    [cvssNum, aars, mitigationFactor],
  );

  const exportJSON = useCallback(() => {
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
      cvssVersion: AIVSS_MODEL.cvssVersion,
      cvssBaseScore: cvssNum,
      agenticRiskFactors: agenticRiskFactors.map((f) => ({
        factorId: f.id,
        factorName: f.name,
        level: factorValues[f.id],
        value: f.levels[factorValues[f.id] as FactorLevelKey]?.value ?? 0,
      })),
      factorSum,
      exploitMaturity,
      threatMultiplier: thm,
      mitigation,
      mitigationFactor,
      aars,
      aivssScore,
      severity: getSeverityLabel(aivssScore),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aivss-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [
    cvssNum,
    factorValues,
    factorSum,
    exploitMaturity,
    thm,
    mitigation,
    mitigationFactor,
    aars,
    aivssScore,
  ]);

  return (
    <>
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">AIVSS Calculator</h1>
          <Badge variant="outline" className="font-mono">
            {AIVSS_MODEL.shortLabel}
          </Badge>
        </div>
        <p className="mt-1 text-muted-foreground">
          Implements {AIVSS_MODEL.name} (published {AIVSS_MODEL.published}): a CVSS v
          {AIVSS_MODEL.cvssVersion} base score plus an agentic uplift (AARS) from{" "}
          {agenticRiskFactors.length} risk amplification factors, each scored 0, 0.5 or 1.{" "}
          <a
            href={AIVSS_MODEL.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Specification (PDF)
          </a>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calculator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: CVSS Base */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Step 1</Badge>
                CVSS v4.0 base score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={cvssBase}
                  onChange={(e) => setCvssBase(e.target.value)}
                  className="w-32"
                  aria-label="CVSS v4.0 base score"
                />
                <span className="text-sm text-muted-foreground">
                  Enter a value from 0.0 to 10.0
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Agentic Risk Factors */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Step 2</Badge>
                Agentic Risk Amplification Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agenticRiskFactors.map((factor) => (
                  <div key={factor.id} className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="sm:w-56 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="font-mono text-xs">
                          {factor.abbreviation}
                        </Badge>
                        <span className="text-sm font-medium">{factor.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {factor.description}
                      </p>
                    </div>
                    <Select
                      value={factorValues[factor.id]}
                      onValueChange={(val) => handleFactorChange(factor.id, val)}
                    >
                      <SelectTrigger className="flex-1 sm:max-w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.entries(factor.levels) as [FactorLevelKey, FactorLevel][]).map(
                          ([key, level]) => (
                            <SelectItem key={key} value={key}>
                              {level.label} ({level.value}) — {level.description}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Threat Multiplier and Mitigation Factor */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Step 3</Badge>
                Exploit maturity &amp; mitigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-sm font-medium" id="aivss-thm-label">
                    Exploit maturity (Threat Multiplier)
                  </span>
                  <Select
                    value={exploitMaturity}
                    onValueChange={(val) => setExploitMaturity(val as ExploitMaturity)}
                  >
                    <SelectTrigger aria-labelledby="aivss-thm-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AIVSS_MODEL.threatMultipliers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label} ({t.id}) — ThM {t.value.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <span className="text-sm font-medium" id="aivss-mf-label">
                    Mitigation strength (Mitigation Factor)
                  </span>
                  <Select
                    value={mitigation}
                    onValueChange={(val) => setMitigation(val as MitigationStrength)}
                  >
                    <SelectTrigger aria-labelledby="aivss-mf-label">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AIVSS_MODEL.mitigationFactors.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.label} — {m.value.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Defaults follow {AIVSS_MODEL.shortLabel}: Proof-of-Concept (0.97) and No/Weak
                Mitigation (1.00).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Result</Badge>
                {AIVSS_MODEL.shortLabel} score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ScoreGauge score={aivssScore} label="AIVSS Score" />

              <div className="w-full mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    CVSS v{AIVSS_MODEL.cvssVersion} base
                  </span>
                  <span className="font-medium">{cvssNum.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Factor_Sum</span>
                  <span className="font-medium">{factorSum.toFixed(1)} / 10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Threat Multiplier (ThM)</span>
                  <span className="font-medium">{thm.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AARS (agentic uplift)</span>
                  <span className="font-medium">{aars.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mitigation Factor</span>
                  <span className="font-medium">{mitigationFactor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t">
                  <span className="font-semibold">AIVSS Score</span>
                  <span className="font-bold text-lg">{aivssScore.toFixed(1)}</span>
                </div>
              </div>

              <div className="w-full mt-4 p-3 bg-muted/30 rounded-md">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    {AIVSS_MODEL.formula.aars}. {AIVSS_MODEL.formula.aivss}.
                  </p>
                </div>
              </div>

              <Button onClick={exportJSON} className="w-full mt-4" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export JSON Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pre-scored Core Risks Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            OWASP Agentic AI Core Risks — {AIVSS_MODEL.shortLabel} worked examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Worked examples from OWASP AIVSS v{AIVSS_MODEL.version} §3.6 (ThM = PoC 0.97, no
            mitigation). ASI codes come from v{AIVSS_MODEL.version} Appendix B; the first code is
            the entry that lists the risk as primary, where one exists.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Rank</th>
                  <th className="text-left py-3 px-2 font-medium">Core Risk</th>
                  <th className="text-left py-3 px-2 font-medium">ASI</th>
                  <th className="text-right py-3 px-2 font-medium">CVSS v4.0</th>
                  <th className="text-right py-3 px-2 font-medium">AARS</th>
                  <th className="text-right py-3 px-2 font-medium">AIVSS</th>
                  <th className="text-center py-3 px-2 font-medium">Severity</th>
                </tr>
              </thead>
              <tbody>
                {coreRiskScores.map((risk) => (
                  <tr key={risk.rank} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-2 font-mono">{risk.rank}</td>
                    <td className="py-3 px-2 font-medium">{risk.name}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {risk.asiCodes.map((code) => (
                          <Badge
                            key={code}
                            variant={risk.asiPrimary.includes(code) ? "default" : "outline"}
                            className="font-mono text-xs"
                            title={
                              risk.asiPrimary.includes(code)
                                ? `${code}: primary AIVSS core risk`
                                : `${code}: secondary AIVSS core risk`
                            }
                          >
                            {code}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{risk.cvssBase.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right font-mono">{risk.aars.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono font-bold">
                      {risk.aivssScore.toFixed(1)}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Badge className={getSeverityColor(risk.severity)}>{risk.severity}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
