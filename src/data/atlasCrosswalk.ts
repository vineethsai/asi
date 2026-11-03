/**
 * MITRE ATLAS ↔ Cisco AI Security and Safety Taxonomy ↔ OWASP ASI crosswalk.
 *
 * Derived, not hand-maintained: every row comes from a "MITRE ATLAS: …"
 * mapping that Cisco publishes on a technique or sub-technique of its v2
 * taxonomy (`cisco_taxonomy.json`). This site does not map ATLAS itself.
 *
 * Method
 * 1. Each Cisco ATLAS mapping is normalised to the current ATLAS release
 *    (2026.10): the "AML." prefix is added where Cisco omits it ("T0018.003"),
 *    ids that ATLAS has since moved are redirected (ATLAS_MOVED, from the ATLAS
 *    changelog), and "N/A" mappings are skipped. AML.TA0010 is a tactic, not a
 *    technique, and is kept with `kind: "tactic"`.
 * 2. `atlasName` is the official ATLAS 2026.10 name; the label Cisco printed
 *    is kept in `ciscoLabels` when it differs (several are older ATLAS names).
 * 3. `owaspAsi` = the "OWASP: ASIxx" mappings on the same Cisco node, plus
 *    those on its parent technique when the node is a sub-technique.
 * 4. `threatIds` is computed per Cisco node that carries the ATLAS mapping: a
 *    T&M threat is linked when its `ciscoMapping` includes that node's
 *    objective AND its `asiMapping` shares an ASI with that node (step 3).
 *    Nodes with no ASI mapping link no threats rather than guessing.
 */
import { ciscoTaxonomyData } from "../components/components/ciscoTaxonomyData";
import { threatsData } from "../components/components/securityData";

export interface AtlasCrosswalkEntry {
  /** Current ATLAS id, e.g. "AML.T0051.001" (or "AML.TA0010" for the tactic). */
  atlasId: string;
  /** Official ATLAS name; sub-techniques are written "Parent: Sub". */
  atlasName: string;
  kind: "technique" | "sub-technique" | "tactic";
  /** atlas.mitre.org page for the id. */
  url: string;
  /** Cisco AITech / AISubtech codes that carry this ATLAS mapping. */
  ciscoTechniqueIds: string[];
  /** Cisco objectives (OB-xxx) those techniques belong to. */
  ciscoObjectiveIds: string[];
  /** OWASP Top 10 for Agentic Applications ids on the same Cisco nodes. */
  owaspAsi: string[];
  /** Site threat ids (t1…t17) linked by the method in the file header. */
  threatIds: string[];
  /** Ids exactly as Cisco wrote them when they differ from `atlasId`. */
  ciscoAtlasIds: string[];
  /** Labels Cisco printed when they differ from `atlasName`. */
  ciscoLabels: string[];
}

export const ATLAS_RELEASE = "2026.10";

/** ATLAS ids renumbered upstream (ATLAS changelog 2026.07 and 2026.10). */
export const ATLAS_MOVED: Record<string, string> = {
  "AML.T0019": "AML.T0115.000",
  "AML.T0058": "AML.T0115.001",
  "AML.T0104": "AML.T0115.002",
  "AML.T0024.000": "AML.T0137.000",
  "AML.T0024.001": "AML.T0137.002",
  "AML.T0056": "AML.T0085.003",
  "AML.T0057": "AML.T0085.002",
};

/** Official names from ATLAS 2026.10 (mitre-atlas/atlas-data @ f56c146) for the ids Cisco maps. */
export const ATLAS_NAMES: Record<string, string> = {
  "AML.T0002": "Acquire Public AI Artifacts",
  "AML.T0002.002": "Acquire Public AI Artifacts: AI Agent Configuration",
  "AML.T0005": "Replicate AI Model Behavior",
  "AML.T0010": "Supply Chain Compromise",
  "AML.T0011": "User Execution",
  "AML.T0011.003": "User Execution: Malicious Link",
  "AML.T0012": "Valid Accounts",
  "AML.T0014": "Discover AI Model Family",
  "AML.T0015": "Evade AI Model",
  "AML.T0017": "Develop Capabilities",
  "AML.T0018": "Manipulate AI Model",
  "AML.T0018.003": "Manipulate AI Model: Modify Prompt Construction Logic",
  "AML.T0020": "Training Data Poisoning",
  "AML.T0024": "Exfiltration via AI Inference API",
  "AML.T0029": "Denial of AI Service",
  "AML.T0034": "Cost Harvesting",
  "AML.T0035": "AI Artifact Collection",
  "AML.T0036": "Data from Information Repositories",
  "AML.T0037": "Data from Local System",
  "AML.T0040": "AI Model Inference API Access",
  "AML.T0043": "Craft Adversarial Data",
  "AML.T0048.000": "External Harms: Financial Harm",
  "AML.T0048.001": "External Harms: Reputational Harm",
  "AML.T0048.002": "External Harms: Societal Harm",
  "AML.T0048.003": "External Harms: User Harm",
  "AML.T0048.004": "External Harms: AI Intellectual Property Theft",
  "AML.T0049": "Exploit Public-Facing Application",
  "AML.T0050": "Command and Scripting Interpreter",
  "AML.T0051": "LLM Prompt Injection",
  "AML.T0051.000": "LLM Prompt Injection: Direct",
  "AML.T0051.001": "LLM Prompt Injection: Indirect",
  "AML.T0053": "AI Agent Tool Invocation",
  "AML.T0054": "LLM Jailbreak",
  "AML.T0055": "Unsecured Credentials",
  "AML.T0061": "LLM Prompt Self-Replication",
  "AML.T0063": "Discover AI Model Outputs",
  "AML.T0067": "LLM Trusted Output Components Manipulation",
  "AML.T0068": "LLM Prompt Obfuscation",
  "AML.T0069": "Discover LLM System Information",
  "AML.T0070": "RAG Poisoning",
  "AML.T0073": "Impersonation",
  "AML.T0074": "Masquerading",
  "AML.T0075": "Enterprise Resource Discovery",
  "AML.T0081": "Modify AI Agent Configuration",
  "AML.T0083": "Credentials from AI Agent Configuration",
  "AML.T0084.001": "Discover AI Agent Configuration: Tool Definitions",
  "AML.T0084.003": "Discover AI Agent Configuration: Call Chains",
  "AML.T0085.002": "Data from AI Services: Conversation Context and Memory",
  "AML.T0085.003": "Data from AI Services: System Instructions",
  "AML.T0086": "Exfiltration via AI Agent Tool Invocation",
  "AML.T0091": "Use Alternate Authentication Material",
  "AML.T0091.000": "Use Alternate Authentication Material: Application Access Token",
  "AML.T0092": "Manipulate User LLM Chat History",
  "AML.T0093": "Prompt Infiltration via Public-Facing Application",
  "AML.T0094": "Delay Execution of LLM Instructions",
  "AML.T0095": "Search Open Websites/Domains",
  "AML.T0098": "AI Agent Tool Credential Harvesting",
  "AML.T0099": "AI Agent Tool Data Poisoning",
  "AML.T0101": "Data Destruction via AI Agent Tool Invocation",
  "AML.T0103": "Deploy AI Agent",
  "AML.T0106": "Exploitation for Credential Access",
  "AML.T0107": "Exploitation for Defense Evasion",
  "AML.T0109": "AI Supply Chain Rug Pull",
  "AML.T0110": "AI Agent Tool Poisoning",
  "AML.T0110.002": "AI Agent Tool Poisoning: Runtime Response",
  "AML.T0112": "Machine Compromise",
  "AML.T0112.001": "Machine Compromise: AI Artifacts",
  "AML.T0115": "Publish Poisoned AI Artifacts",
  "AML.T0115.000": "Publish Poisoned AI Artifacts: Datasets",
  "AML.T0115.001": "Publish Poisoned AI Artifacts: Models",
  "AML.T0137.000": "Training Data Information from AI Models: Infer Membership",
  "AML.T0137.002": "Training Data Information from AI Models: Invert AI Model",
  "AML.TA0010": "Exfiltration",
};

const ATLAS_MAPPING = /^MITRE ATLAS:\s*(\S+?):?\s+(.*)$/;
const ASI_MAPPING = /^OWASP:\s*(ASI\d{2})\b/;

/** Normalise an ATLAS id as written by Cisco to the current release, or null for "N/A". */
export function normaliseAtlasId(raw: string): string | null {
  if (/^N\/A$/i.test(raw)) return null;
  const id = raw.startsWith("AML.") ? raw : `AML.${raw}`;
  return ATLAS_MOVED[id] ?? id;
}

function atlasUrl(id: string): string {
  return id.startsWith("AML.TA")
    ? `https://atlas.mitre.org/tactics/${id}`
    : `https://atlas.mitre.org/techniques/${id}`;
}

const sortIds = (a: string, b: string) => a.localeCompare(b, "en", { numeric: true });

function buildCrosswalk(): AtlasCrosswalkEntry[] {
  type Acc = {
    tech: Set<string>;
    ob: Set<string>;
    asi: Set<string>;
    threats: Set<string>;
    rawIds: Set<string>;
    labels: Set<string>;
  };
  const rows = new Map<string, Acc>();
  const threats = Object.values(threatsData);

  const asiOf = (mappings: string[]) =>
    mappings.map((m) => m.match(ASI_MAPPING)?.[1]).filter((x): x is string => Boolean(x));

  for (const og of ciscoTaxonomyData) {
    for (const tech of og.ai_tech) {
      const techAsi = asiOf(tech.mappings);
      const nodes = [
        { code: tech.code, mappings: tech.mappings, asi: techAsi },
        ...tech.ai_subtech.map((s) => ({
          code: s.code,
          mappings: s.mappings,
          asi: [...asiOf(s.mappings), ...techAsi],
        })),
      ];
      for (const node of nodes) {
        // Threats linked through this node (step 4 in the file header).
        const nodeThreats = threats.filter(
          (t) =>
            (t.ciscoMapping ?? []).includes(og.code) &&
            (t.asiMapping ?? []).some((asi) => node.asi.includes(asi)),
        );
        for (const mapping of node.mappings) {
          const m = mapping.match(ATLAS_MAPPING);
          if (!m) continue;
          const atlasId = normaliseAtlasId(m[1]);
          if (!atlasId) continue;
          let acc = rows.get(atlasId);
          if (!acc) {
            acc = {
              tech: new Set(),
              ob: new Set(),
              asi: new Set(),
              threats: new Set(),
              rawIds: new Set(),
              labels: new Set(),
            };
            rows.set(atlasId, acc);
          }
          acc.tech.add(node.code);
          acc.ob.add(og.code);
          node.asi.forEach((a) => acc.asi.add(a));
          nodeThreats.forEach((t) => acc.threats.add(t.id));
          if (m[1] !== atlasId) acc.rawIds.add(m[1]);
          // Cisco often prints only the sub-technique part ("Malicious Link"); that is not a mismatch.
          const label = m[2].trim();
          const official = ATLAS_NAMES[atlasId] ?? "";
          if (label && label !== official && label !== official.split(": ").pop()) {
            acc.labels.add(label);
          }
        }
      }
    }
  }

  return [...rows.entries()]
    .sort(([a], [b]) => sortIds(a, b))
    .map(
      ([atlasId, acc]) =>
        ({
          atlasId,
          atlasName: ATLAS_NAMES[atlasId] ?? atlasId,
          kind: atlasId.startsWith("AML.TA")
            ? "tactic"
            : /\.\d{3}$/.test(atlasId)
              ? "sub-technique"
              : "technique",
          url: atlasUrl(atlasId),
          ciscoTechniqueIds: [...acc.tech].sort(sortIds),
          ciscoObjectiveIds: [...acc.ob].sort(),
          owaspAsi: [...acc.asi].sort(),
          threatIds: [...acc.threats].sort(sortIds),
          ciscoAtlasIds: [...acc.rawIds].sort(),
          ciscoLabels: [...acc.labels].sort(),
        }) satisfies AtlasCrosswalkEntry,
    );
}

/** One row per ATLAS id that Cisco maps, sorted by id. */
export const atlasCrosswalk: AtlasCrosswalkEntry[] = buildCrosswalk();

/** Rows for one site threat id ("t6"). */
export function getAtlasForThreat(threatId: string): AtlasCrosswalkEntry[] {
  return atlasCrosswalk.filter((row) => row.threatIds.includes(threatId));
}

/** Rows for one OWASP ASI id ("ASI01"). */
export function getAtlasForAsi(asi: string): AtlasCrosswalkEntry[] {
  return atlasCrosswalk.filter((row) => row.owaspAsi.includes(asi));
}

export const source = {
  name: "MITRE ATLAS crosswalk (derived from Cisco AI Security and Safety Taxonomy v2 mappings)",
  version: `ATLAS ${ATLAS_RELEASE} / Cisco taxonomy 2.0.0`,
  url: "https://atlas.mitre.org/matrices/ATLAS",
  dataUrl:
    "https://github.com/mitre-atlas/atlas-data/blob/f56c1468731d6428e5bf875263b4643b46d67437/dist/v6/ATLAS-2026.10.yaml",
  retrievedAt: "2026-11-03",
};
