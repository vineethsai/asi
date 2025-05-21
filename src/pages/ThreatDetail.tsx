import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { threatsData, mitigationsData, Threat, Mitigation } from "../components/components/securityData";
import Header from "@/components/layout/Header";
import SidebarNav from "../components/layout/SidebarNav";

export const ThreatDetail = () => {
  const { threatId } = useParams<{ threatId: string }>();
  const threat: Threat | undefined = threatId ? threatsData[threatId] : undefined;
  const mitigations: Mitigation[] = threat
    ? Object.values(mitigationsData).filter(m => m.threatIds.includes(threat.id))
    : [];

  // Example data for new sections (in real app, this would come from threat data or a new file)
  const realWorldExamples: Record<string, string[]> = {
    t1: [
      "A malicious user injects crafted data into an agent's memory, causing it to make incorrect decisions in a customer support chatbot.",
      "Attackers persist poisoned context in a multi-session agent, leading to data leakage across users."
    ],
    // ... add for other threats as needed
  };

  const detectionMethods: Record<string, string[]> = {
    t1: [
      "Monitor memory for unexpected or out-of-schema data.",
      "Detect anomalous agent behavior after memory updates.",
      "Use audit logs to trace memory changes to suspicious sources."
    ],
    // ... add for other threats as needed
  };

  const impactAnalysis: Record<string, { business: string; technical: string }> = {
    t1: {
      business: "Loss of customer trust due to incorrect or manipulated agent responses; potential regulatory violations if sensitive data is leaked.",
      technical: "Corrupted memory can lead to privilege escalation, data leakage, or persistent agent malfunction."
    },
    // ... add for other threats as needed
  };

  const attackScenarios: Record<string, string[]> = {
    t1: [
      "1. Attacker sends a specially crafted input to the agent.",
      "2. The agent stores this input in its session or persistent memory.",
      "3. On subsequent requests, the agent uses the poisoned memory, making decisions that benefit the attacker."
    ],
    // ... add for other threats as needed
  };

  const architectureImpact: Record<string, string> = {
    t1: "In sequential architectures, memory poisoning can persist across steps. In collaborative or hierarchical systems, poisoned memory may propagate between agents, amplifying impact.",
    // ... add for other threats as needed
  };

  const references: Record<string, string[]> = {
    t1: [
      "https://owasp.org/www-community/attacks/Memory_corruption",
      "https://arxiv.org/abs/2302.08500"
    ],
    // ... add for other threats as needed
  };

  if (!threat) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Threat Not Found</h1>
        <Link to="/threats">
          <Button>Back to Threats</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <Header />
      <section className="py-12 bg-secondary/50 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <SidebarNav type="threats" activeId={threat.id} />
            <div className="flex-1">
              <Link to="/threats" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
                &larr; Back to Threats
              </Link>
              {/* Overview (full width) */}
              <Card className="mb-4 border border-threat/20">
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <span className="font-mono text-xs bg-threat/10 text-threat px-2 py-0.5 rounded mr-2">
                      {threat.code}
                    </span>
                    <h1 className="text-2xl font-bold">{threat.name}</h1>
                  </div>
                  <p className="text-muted-foreground mb-2">{threat.description}</p>
                </CardContent>
              </Card>
              {/* Grid for the rest of the cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Technical Details */}
                <Card className="border border-blue-200">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Technical Details</h2>
                    <div className="mb-2">
                      <span className="font-medium">Affected Components: </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {threat.componentIds.map(id => (
                          <Link to={`/components/${id}`} key={id}>
                            <span className="inline-block bg-secondary px-2 py-1 rounded text-xs">
                              {id.toUpperCase()}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">Impact Level: </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        threat.impactLevel === "high"
                          ? "bg-red-100 text-red-700"
                          : threat.impactLevel === "medium"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {threat.impactLevel.charAt(0).toUpperCase() + threat.impactLevel.slice(1)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
                {/* Attack Vectors */}
                <Card className="border border-yellow-200">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Attack Vectors</h2>
                    <ul className="list-disc pl-6 text-muted-foreground">
                      {(attackScenarios[threat.id] || ["No example scenarios documented."]).map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                {/* Impact Analysis */}
                <Card className="border border-red-200">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Impact Analysis</h2>
                    <div className="mb-2">
                      <span className="font-medium">Business Impact: </span>
                      <span>{impactAnalysis[threat.id]?.business || "N/A"}</span>
                    </div>
                    <div>
                      <span className="font-medium">Technical Impact: </span>
                      <span>{impactAnalysis[threat.id]?.technical || "N/A"}</span>
                    </div>
                  </CardContent>
                </Card>
                {/* Architecture-Specific Impact */}
                <Card className="border border-purple-200">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Architecture-Specific Impact</h2>
                    <p className="text-muted-foreground">
                      {architectureImpact[threat.id] || "No architecture-specific impact documented."}
                    </p>
                  </CardContent>
                </Card>
                {/* Real-world Examples/Case Studies */}
                <Card className="border border-green-200">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Real-world Examples / Case Studies</h2>
                    <ul className="list-disc pl-6 text-muted-foreground">
                      {(realWorldExamples[threat.id] || ["No real-world examples documented."]).map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                {/* Detection Methods */}
                <Card className="border border-blue-300">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Detection Methods</h2>
                    <ul className="list-disc pl-6 text-muted-foreground">
                      {(detectionMethods[threat.id] || ["No detection methods documented."]).map((method, i) => (
                        <li key={i}>{method}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                {/* Mitigation */}
                <Card className="border border-control/20">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">Mitigations</h2>
                    {mitigations.length > 0 ? (
                      <ul className="mt-2 space-y-2">
                        {mitigations.map(mitigation => (
                          <li key={mitigation.id}>
                            <Link to={`/controls/${mitigation.id}`} className="text-control underline">
                              {mitigation.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="ml-2 text-muted-foreground">No mitigations documented.</span>
                    )}
                  </CardContent>
                </Card>
                {/* References */}
                <Card className="border border-gray-300">
                  <CardContent className="p-4">
                    <h2 className="text-base font-semibold mb-2">References</h2>
                    <ul className="list-disc pl-6 text-muted-foreground">
                      {(references[threat.id] || []).map((ref, i) => (
                        <li key={i}>
                          <a href={ref} target="_blank" rel="noopener noreferrer" className="underline text-blue-700">{ref}</a>
                        </li>
                      ))}
                      {(!references[threat.id] || references[threat.id].length === 0) && (
                        <li>No references documented.</li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ThreatDetail; 