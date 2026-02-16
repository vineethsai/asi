import { useState, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
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
import { Calculator, Download, BarChart3, Info } from "lucide-react";
import {
  agenticRiskFactors,
  coreRiskScores,
  calculateAARS,
  calculateThreatMultiplier,
  calculateAIVSS,
  getSeverityLabel,
  getSeverityColor,
  type AgenticRiskFactor,
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
      defaults[f.id] = "medium";
    });
    return defaults;
  });

  const handleFactorChange = useCallback((factorId: string, level: string) => {
    setFactorValues((prev) => ({ ...prev, [factorId]: level }));
  }, []);

  const aars = useMemo(() => calculateAARS(factorValues), [factorValues]);
  const thm = useMemo(() => calculateThreatMultiplier(aars), [aars]);
  const cvssNum = parseFloat(cvssBase) || 0;
  const aivssScore = useMemo(() => calculateAIVSS(cvssNum, aars), [cvssNum, aars]);

  const exportJSON = useCallback(() => {
    const report = {
      schema: "AIVSS-Agentic-v0.5",
      timestamp: new Date().toISOString(),
      cvssBaseScore: cvssNum,
      agenticRiskFactors: Object.entries(factorValues).map(([id, level]) => ({
        factorId: id,
        factorName: agenticRiskFactors.find((f) => f.id === id)?.name,
        level,
        value:
          agenticRiskFactors.find((f) => f.id === id)?.levels[
            level as keyof AgenticRiskFactor["levels"]
          ]?.value ?? 0,
      })),
      aars,
      threatMultiplier: thm,
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
  }, [cvssNum, factorValues, aars, thm, aivssScore]);

  return (
    <>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Calculator className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">AIVSS Calculator</h1>
        </div>
        <p className="text-muted-foreground max-w-3xl">
          AI Vulnerability Scoring System for Agentic AI. Extends CVSS v4.0 with 10 agentic risk
          amplification factors to quantify the unique risks of autonomous AI systems.
        </p>
        <div className="flex gap-2 mt-3">
          <Badge variant="outline">OWASP AIVSS v0.5</Badge>
          <Badge variant="outline">Based on CVSS v4.0</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Calculator */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: CVSS Base */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Step 1</Badge>
                CVSS v4.0 Base Score
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
                        {(
                          Object.entries(factor.levels) as [
                            string,
                            { value: number; label: string; description: string },
                          ][]
                        ).map(([key, level]) => (
                          <SelectItem key={key} value={key}>
                            {level.label} ({level.value})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Badge variant="outline">Step 3</Badge>
                AIVSS Score
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ScoreGauge score={aivssScore} label="AIVSS Score" />

              <div className="w-full mt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CVSS Base</span>
                  <span className="font-medium">{cvssNum.toFixed(1)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AARS (Agentic AI Risk Score)</span>
                  <span className="font-medium">{aars.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Threat Multiplier</span>
                  <span className="font-medium">{thm.toFixed(2)}x</span>
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
                    AIVSS = min(10.0, CVSS_Base x ThM) where ThM = 1 + (AARS / 25). The AARS is the
                    average of all factor values scaled to 10.
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
            OWASP Agentic AI Core Risks - Pre-Scored Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Rank</th>
                  <th className="text-left py-3 px-2 font-medium">Core Risk</th>
                  <th className="text-left py-3 px-2 font-medium">ASI Code</th>
                  <th className="text-right py-3 px-2 font-medium">CVSS Base</th>
                  <th className="text-right py-3 px-2 font-medium">AARS</th>
                  <th className="text-right py-3 px-2 font-medium">ThM</th>
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
                      <Badge variant="outline" className="font-mono text-xs">
                        {risk.asiCode}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-right font-mono">{risk.cvssBase.toFixed(1)}</td>
                    <td className="py-3 px-2 text-right font-mono">{risk.aars.toFixed(2)}</td>
                    <td className="py-3 px-2 text-right font-mono">
                      {risk.threatMultiplier.toFixed(2)}
                    </td>
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

export default function AIVSSCalculator() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <AIVSSCalculatorContent />
      </main>
      <Footer />
    </div>
  );
}
