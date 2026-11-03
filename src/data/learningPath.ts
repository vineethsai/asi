/**
 * Learning path (IMPROVEMENT_PLAN P4-01 / §6.12): the About page's methodology as a six-step
 * stepper — Components → Threats → Controls → AISVS → NIST → Model it.
 *
 * Each step lists 3–5 readings (real routes; labels and counts come from the data modules), the
 * id of its generated quiz (src/data/quizzes.ts) and the completion rule: the step is done once its
 * quiz is passed with ≥ PASS_RATIO. Progress lives in the progress store's `path` namespace
 * (`path[stepId] = true`, see src/lib/progress.ts); `useLearningProgress()` in
 * src/components/learn/useLearningProgress.ts is the React binding.
 *
 * Dependency-light on purpose (data modules only, no React) so Home/About can import the step list.
 */
import { threatsData, mitigationsData } from "@/components/components/securityData";
import { architecturesData } from "@/components/components/architecturesData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { aisvsData, aisvsStats } from "@/data/aisvs";
import { KC, KC_ORDER } from "@/data/kc";
import { NIST_AISVS_REMAP } from "@/data/nistAisvsRemap";
import { threatModelerPathFor } from "@/config/navigation";
import type { QuizResult } from "@/lib/progress";

export type LearningStepId = "components" | "threats" | "controls" | "aisvs" | "nist" | "model";

export interface LearningReading {
  label: string;
  /** Router path (may carry a query string or hash). */
  path: string;
  description: string;
}

export interface LearningStep {
  id: LearningStepId;
  /** 1-based position in the path. */
  number: number;
  title: string;
  /** Short label for the stepper. */
  short: string;
  summary: string;
  /** Icon registry key (src/lib/icons.ts) — lucide names. */
  icon: string;
  readings: LearningReading[];
  /** Key in the progress store's `quizzes` namespace. */
  quizId: string;
}

/** A step completes when its quiz score / total reaches this ratio. */
export const PASS_RATIO = 0.8;

const threats = Object.values(threatsData);
const controls = Object.values(mitigationsData);
const attackVectorCount = threats.reduce((n, t) => n + (t.attackVectors?.length ?? 0), 0);
const nistCount = Object.keys(NIST_AISVS_REMAP).length;
const nistMapped = Object.values(NIST_AISVS_REMAP).filter((e) => e.aisvs.length > 0).length;
const firstArchitecture = Object.values(architecturesData)[0];
const firstAsi = agenticTop10Data[0];

const kcReading = (id: (typeof KC_ORDER)[number]): LearningReading => ({
  label: `${KC[id].code} · ${KC[id].name}`,
  path: `/components/${id}`,
  description: KC[id].description.split(". ")[0].replace(/\.$/, "") + ".",
});

const chapterReading = (code: string): LearningReading => {
  const c = aisvsData[code];
  return {
    label: `${c.code} · ${c.name}`,
    path: `/aisvs#${c.code}`,
    description: `${c.requirementCount} requirements in ${c.subCategories.length} sections.`,
  };
};

const threat = (id: string) => threatsData[id];
const control = (id: string) => mitigationsData[id];

/** The six steps, in order. */
export const LEARNING_STEPS: readonly LearningStep[] = [
  {
    id: "components",
    number: 1,
    title: "Component analysis",
    short: "Components",
    summary: `Learn the ${KC_ORDER.length} key components of an agentic system (KC1–KC${KC_ORDER.length}) and where their security boundaries sit.`,
    icon: "boxes",
    quizId: "path-components",
    readings: [
      {
        label: "Key components",
        path: "/components",
        description: `All ${KC_ORDER.length} key components and their sub-components.`,
      },
      kcReading("kc2"),
      kcReading("kc4"),
      {
        label: "Architecture patterns",
        path: "/architectures",
        description: `${Object.keys(architecturesData).length} reference architectures built from those components.`,
      },
    ],
  },
  {
    id: "threats",
    number: 2,
    title: "Threat mapping",
    short: "Threats",
    summary: `Map threats to components using the catalog of ${threats.length} threats and ${attackVectorCount} attack vectors, then see how they line up with the OWASP Agentic Top ${agenticTop10Data.length}.`,
    icon: "shield-alert",
    quizId: "path-threats",
    readings: [
      {
        label: "Threat catalog",
        path: "/threats",
        description: `${threats.length} threats, ${attackVectorCount} attack vectors, rated by severity.`,
      },
      {
        label: `${threat("t1").code} · ${threat("t1").name}`,
        path: `/threats/${threat("t1").id}`,
        description: `${threat("t1").attackVectors?.length ?? 0} attack vectors and ${threat("t1").mitigationIds?.length ?? 0} mapped controls.`,
      },
      {
        label: "OWASP Top 10 for Agentic Applications",
        path: "/taxonomy?tab=owasp-agentic",
        description: `The ${agenticTop10Data.length} ASI entries and their real-world attack scenarios.`,
      },
      {
        label: `${firstAsi.code} · ${firstAsi.name}`,
        path: `/taxonomy?tab=owasp-agentic&entry=${firstAsi.id}`,
        description: `${firstAsi.attackScenarios.length} attack scenarios and ${firstAsi.preventionGuidelines.length} prevention guidelines.`,
      },
    ],
  },
  {
    id: "controls",
    number: 3,
    title: "Control selection",
    short: "Controls",
    summary: `Pick controls from ${controls.length} mitigations organised by lifecycle phase (design, build, operations).`,
    icon: "shield-check",
    quizId: "path-controls",
    readings: [
      {
        label: "Controls",
        path: "/controls",
        description: `${controls.length} mitigations mapped to the threats they reduce.`,
      },
      {
        label: `${control("m7").id.toUpperCase()} · ${control("m7").name}`,
        path: `/controls/${control("m7").id}`,
        description: `Mitigates ${control("m7").threatIds.length} threats.`,
      },
      {
        label: "Implementation by phase",
        path: "/implementation",
        description: "The same controls grouped into design, build and operations work.",
      },
      {
        label: "Security checklist",
        path: "/interactive",
        description: "A step-by-step checklist with progress tracking.",
      },
    ],
  },
  {
    id: "aisvs",
    number: 4,
    title: "AISVS verification",
    short: "AISVS",
    summary: `Verify the implementation against OWASP AISVS ${aisvsStats.version}: ${aisvsStats.requirements} requirements in ${aisvsStats.chapters} chapters, at three assurance levels.`,
    icon: "list-checks",
    quizId: "path-aisvs",
    readings: [
      {
        label: `OWASP AISVS ${aisvsStats.version}`,
        path: "/aisvs",
        description: `${aisvsStats.requirements} requirements: ${aisvsStats.byLevel[0]} at L1, ${aisvsStats.byLevel[1]} at L2, ${aisvsStats.byLevel[2]} at L3.`,
      },
      chapterReading("C9"),
      chapterReading("C10"),
    ],
  },
  {
    id: "nist",
    number: 5,
    title: "NIST alignment",
    short: "NIST",
    summary: `Connect the technical controls to governance: ${nistMapped} of ${nistCount} NIST AI RMF subcategories map to an AISVS chapter on this site.`,
    icon: "git-branch",
    quizId: "path-nist",
    readings: [
      {
        label: "NIST AI RMF mapping",
        path: "/nist-mapping",
        description: `${nistCount} AI RMF subcategories mapped to AISVS chapters.`,
      },
      {
        label: "Cross-framework taxonomy",
        path: "/taxonomy",
        description: "OWASP Agentic Top 10, Cisco, AIVSS and AIUC-1 side by side.",
      },
      {
        label: "References",
        path: "/references",
        description: "The standards and papers behind every mapping.",
      },
    ],
  },
  {
    id: "model",
    number: 6,
    title: "Model it",
    short: "Model it",
    summary:
      "Put it together: draw an agentic system in the Threat Modeler, place it on the MAESTRO layers and generate its threats and controls.",
    icon: "workflow",
    quizId: "path-model",
    readings: [
      {
        label: "Threat Modeler guide",
        path: "/threat-modeler-guide",
        description: "Components, MAESTRO layers, analysis and exports.",
      },
      {
        label: firstArchitecture.name,
        path: `/architectures/${firstArchitecture.id}`,
        description: `${firstArchitecture.threatIds.length} key threats and ${firstArchitecture.mitigationIds.length} controls for this pattern.`,
      },
      {
        label: `Open the ${firstArchitecture.name.replace(/ Architecture$/, "")} template`,
        path: threatModelerPathFor(firstArchitecture.id),
        description: "Start the Threat Modeler from a ready-made template.",
      },
    ],
  },
];

export const LEARNING_STEP_IDS: readonly LearningStepId[] = LEARNING_STEPS.map((s) => s.id);

const BY_ID = new Map(LEARNING_STEPS.map((s) => [s.id, s]));

export function getLearningStep(id: string | null | undefined): LearningStep | undefined {
  return id ? BY_ID.get(id as LearningStepId) : undefined;
}

export function isLearningStepId(id: string | null | undefined): id is LearningStepId {
  return !!id && BY_ID.has(id as LearningStepId);
}

/** The step after `id` (undefined for the last step). */
export function nextLearningStep(id: LearningStepId): LearningStep | undefined {
  const i = LEARNING_STEP_IDS.indexOf(id);
  return i >= 0 ? LEARNING_STEPS[i + 1] : undefined;
}

/** The step before `id` (undefined for the first step). */
export function previousLearningStep(id: LearningStepId): LearningStep | undefined {
  const i = LEARNING_STEP_IDS.indexOf(id);
  return i > 0 ? LEARNING_STEPS[i - 1] : undefined;
}

/** True when a quiz result meets the completion rule. */
export function isQuizPassed(result: Pick<QuizResult, "score" | "total"> | null | undefined) {
  return !!result && result.total > 0 && result.score / result.total >= PASS_RATIO;
}

/** Route of a step page. */
export function learningStepPath(id: LearningStepId): string {
  return `/learn/${id}`;
}

export interface LearningPathSummary {
  /** 1-based number of the first incomplete step (the total when every step is done). */
  currentStep: number;
  currentStepId: LearningStepId;
  /** Number of completed steps. */
  completed: number;
  total: number;
  completedIds: LearningStepId[];
  /** True when every step is done. */
  done: boolean;
  /** 0–100, rounded. */
  percent: number;
}

/** Pure roll-up of the store's `path` namespace (used by the hook and by tests). */
export function summarizeLearningPath(path: Record<string, boolean>): LearningPathSummary {
  const completedIds = LEARNING_STEPS.filter((s) => path[s.id] === true).map((s) => s.id);
  const next = LEARNING_STEPS.find((s) => path[s.id] !== true);
  const total = LEARNING_STEPS.length;
  const current = next ?? LEARNING_STEPS[total - 1];
  return {
    currentStep: current.number,
    currentStepId: current.id,
    completed: completedIds.length,
    total,
    completedIds,
    done: !next,
    percent: Math.round((completedIds.length / total) * 100),
  };
}
