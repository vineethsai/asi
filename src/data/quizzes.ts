/**
 * Generated quizzes (IMPROVEMENT_PLAN P4-02). Every question is derived from the data modules at
 * call time — nothing here is a hand-written fact:
 *
 *   threat-kc            threat.componentIds → KC (src/data/kc.ts)
 *   threat-asi           threat.asiMapping + Top 10 Appendix A (relatedThreats)
 *   vector-severity      threat.attackVectors[].severity
 *   threat-control       threat.mitigationIds ∪ mitigation.threatIds
 *   control-threat       the same mapping, asked from the control's side
 *   maestro-layer        KC.maestroLayers + Threat Modeler SEMANTIC_TYPES (MAESTRO_LAYER_LABELS)
 *   control-aisvs        mitigation.aisvsCategories → AISVS chapters
 *   aisvs-section        AISVS section → chapter
 *   subcomponent-kc      componentDataMap sub-component → KC
 *   architecture-threat  architecture.threatIds
 *   nist-aisvs           NIST AI RMF → AISVS crosswalk (editorial, src/data/nistAisvsRemap.ts)
 *   nist-organizational  NIST subcategories with no AISVS chapter
 *
 * Questions are seeded (FNV-1a → mulberry32), so a quiz is stable for a given seed. The default
 * seed is `${quizId}:${YYYY-MM-DD}` — the same questions all day, new ones tomorrow; pass
 * `attempt` to draw a fresh set.
 *
 * Usage:
 *   const quiz = buildStepQuiz("threats");           // 5 questions for learning-path step 2
 *   const challenge = buildChallengeQuiz();          // 10-question "Agentic Security Challenge"
 *   <Quiz quizId={quiz.id} questions={quiz.questions} onComplete={…} />
 */
import {
  mitigationsData,
  threatsData,
  type Mitigation,
  type Threat,
} from "@/components/components/securityData";
import { agenticTop10Data } from "@/components/components/owaspAgenticTop10Data";
import { architecturesData } from "@/components/components/architecturesData";
import { componentDataMap } from "@/components/components/componentDataMap";
import { aisvsData, aisvsStats } from "@/data/aisvs";
import { KC, KC_ORDER, kcId, kcLabel, type KcId } from "@/data/kc";
import { NIST_AISVS_REMAP } from "@/data/nistAisvsRemap";
import { MAESTRO_LAYER_LABELS, type MaestroLayer } from "@/components/threat-modeler/types";
import { SEMANTIC_TYPES } from "@/components/threat-modeler/semanticTypes";
import { impactBand, severityLabel } from "@/lib/severity";
import type { LearningStepId } from "@/data/learningPath";

// ─── Types ──────────────────────────────────────────────────────────────────

export type QuestionKind =
  | "threat-kc"
  | "threat-asi"
  | "vector-severity"
  | "threat-control"
  | "control-threat"
  | "maestro-layer"
  | "control-aisvs"
  | "aisvs-section"
  | "subcomponent-kc"
  | "architecture-threat"
  | "nist-aisvs"
  | "nist-organizational";

export interface QuizQuestion {
  /** Stable id: `${kind}:${subject}` (+ answer key for random-answer kinds). */
  id: string;
  kind: QuestionKind;
  prompt: string;
  /** Optional supporting line shown under the prompt (e.g. an attack-vector example). */
  context?: string;
  /** Exactly four unique choices. */
  choices: string[];
  answerIndex: number;
  /** Shown after answering; built from the same data. */
  explanation: string;
  /** Deep link to the page that explains the answer. */
  link: { href: string; label: string };
}

export interface GeneratedQuiz {
  id: string;
  title: string;
  /** Seed string the questions were drawn with. */
  seed: string;
  questions: QuizQuestion[];
}

export interface QuizBuildOptions {
  /** Date the default seed is based on (default: today, local time). */
  date?: Date;
  /** Bump to draw a different set on the same day. */
  attempt?: number;
  /** Explicit seed (overrides date/attempt). */
  seed?: string;
}

export type Rng = () => number;

// ─── Seeded randomness ──────────────────────────────────────────────────────

/** 32-bit FNV-1a hash of a string. */
export function hashSeed(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 PRNG: deterministic floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: string): Rng {
  return mulberry32(hashSeed(seed));
}

/** Local calendar day, "YYYY-MM-DD". */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length) % items.length];
}

function shuffle<T>(rng: Rng, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function sample<T>(rng: Rng, items: readonly T[], n: number): T[] {
  return shuffle(rng, items).slice(0, n);
}

// ─── Data views ─────────────────────────────────────────────────────────────

const THREATS: readonly Threat[] = Object.values(threatsData);
const CONTROLS: readonly Mitigation[] = Object.values(mitigationsData);
const ARCHITECTURES = Object.values(architecturesData);
const CHAPTERS = Object.values(aisvsData);
const NIST = Object.values(NIST_AISVS_REMAP);
const MAESTRO_LAYERS = Object.keys(MAESTRO_LAYER_LABELS)
  .map(Number)
  .sort((a, b) => a - b) as MaestroLayer[];

const controlCode = (m: Mitigation) => m.id.toUpperCase();
const threatTitle = (t: Threat) => `${t.code} ${t.name}`;
const controlTitle = (m: Mitigation) => `${controlCode(m)} ${m.name}`;
const listText = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? "")
    : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
const firstSentence = (text: string) => {
  const m = text.match(/^.*?[.!?](?=\s|$)/);
  return (m ? m[0] : text).trim();
};

/** Controls mapped to a threat, from either side of the mapping. */
export function controlsForThreat(threat: Threat): Set<string> {
  const ids = new Set(threat.mitigationIds ?? []);
  for (const m of CONTROLS) if (m.threatIds?.includes(threat.id)) ids.add(m.id);
  return ids;
}

/** Threats mapped to a control, from either side of the mapping. */
export function threatsForControl(control: Mitigation): Set<string> {
  const ids = new Set(control.threatIds ?? []);
  for (const t of THREATS) if (t.mitigationIds?.includes(control.id)) ids.add(t.id);
  return ids;
}

/** ASI entries mapped to a threat: the site's asiMapping plus Top 10 Appendix A. */
function asiForThreat(threat: Threat): { all: Set<string>; official: Set<string> } {
  const unofficial = new Set(threat.asiMappingUnofficial ?? []);
  const official = new Set((threat.asiMapping ?? []).filter((a) => !unofficial.has(a)));
  for (const e of agenticTop10Data) if (e.relatedThreats.includes(threat.id)) official.add(e.id);
  return { all: new Set([...(threat.asiMapping ?? []), ...official]), official };
}

const KC_OPTIONS = KC_ORDER.map((id) => ({ key: id, label: kcLabel(id) }));
const ASI_OPTIONS = agenticTop10Data.map((e) => ({ key: e.id, label: `${e.code} · ${e.name}` }));
const CONTROL_OPTIONS = CONTROLS.map((m) => ({
  key: m.id,
  label: `${controlCode(m)} · ${m.name}`,
}));
const THREAT_OPTIONS = THREATS.map((t) => ({ key: t.id, label: `${t.code} · ${t.name}` }));
const CHAPTER_OPTIONS = CHAPTERS.map((c) => ({ key: c.code, label: `${c.code} · ${c.name}` }));
const LAYER_OPTIONS = MAESTRO_LAYERS.map((l) => ({
  key: String(l),
  label: MAESTRO_LAYER_LABELS[l],
}));
const ARCH_OPTIONS = ARCHITECTURES.map((a) => ({ key: a.id, label: a.name }));
const NIST_OPTIONS = NIST.map((n) => ({ key: n.code, label: n.code }));

const SEVERITY_CHOICES = ["Critical", "High", "Medium", "Low"] as const;

interface Option {
  key: string;
  label: string;
}

interface Membership {
  /** "in": the answer is a member; "out": the answer is the one non-member. */
  mode: "in" | "out";
  answer: Option;
  choices: Option[];
}

/**
 * Four-choice question over a set membership. Asks "which is X?" when there are ≥ 3 non-members,
 * otherwise "which is NOT X?" when there are ≥ 3 members. Choices keep the universe's order.
 */
function membership(
  rng: Rng,
  universe: readonly Option[],
  members: ReadonlySet<string>,
  preferred?: ReadonlySet<string>,
): Membership | null {
  const inSet = universe.filter((o) => members.has(o.key));
  const outSet = universe.filter((o) => !members.has(o.key));
  let mode: Membership["mode"];
  let answer: Option;
  let distractors: Option[];
  if (inSet.length >= 1 && outSet.length >= 3) {
    mode = "in";
    const pool = preferred ? inSet.filter((o) => preferred.has(o.key)) : inSet;
    answer = pick(rng, pool.length ? pool : inSet);
    distractors = sample(rng, outSet, 3);
  } else if (outSet.length >= 1 && inSet.length >= 3) {
    mode = "out";
    answer = pick(rng, outSet);
    distractors = sample(rng, inSet, 3);
  } else {
    return null;
  }
  const order = new Map(universe.map((o, i) => [o.key, i]));
  const choices = [answer, ...distractors].sort(
    (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0),
  );
  return { mode, answer, choices };
}

function fromMembership(
  kind: QuestionKind,
  subject: string,
  m: Membership,
  q: Omit<QuizQuestion, "id" | "kind" | "choices" | "answerIndex">,
): QuizQuestion {
  return {
    id: `${kind}:${subject}:${m.mode}:${m.answer.key}`,
    kind,
    choices: m.choices.map((c) => c.label),
    answerIndex: m.choices.indexOf(m.answer),
    ...q,
  };
}

// ─── Generators (one per kind) ──────────────────────────────────────────────

interface Generator {
  /** Every subject this kind can ask about (threat ids, control ids, …). */
  subjects: () => string[];
  build: (subject: string, rng: Rng) => QuizQuestion | null;
}

const kcNames = (ids: Iterable<string>) => [...ids].map((id) => kcLabel(id));

const GENERATORS: Record<QuestionKind, Generator> = {
  "threat-kc": {
    subjects: () => THREATS.map((t) => t.id),
    build: (id, rng) => {
      const t = threatsData[id];
      if (!t) return null;
      const members = new Set(t.componentIds.map((c) => kcId(c)).filter(Boolean) as KcId[]);
      const m = membership(rng, KC_OPTIONS, members);
      if (!m) return null;
      const affected = KC_ORDER.filter((k) => members.has(k));
      return fromMembership("threat-kc", id, m, {
        prompt:
          m.mode === "in"
            ? `Which key component does ${threatTitle(t)} affect?`
            : `Which key component is NOT listed as affected by ${threatTitle(t)}?`,
        explanation: `The threat catalog lists ${t.code} against ${affected.length} key component${affected.length === 1 ? "" : "s"}: ${listText(kcNames(affected))}.`,
        link: { href: `/threats/${t.id}`, label: `Open ${t.code} ${t.shortName ?? t.name}` },
      });
    },
  },

  "threat-asi": {
    subjects: () => THREATS.filter((t) => asiForThreat(t).all.size > 0).map((t) => t.id),
    build: (id, rng) => {
      const t = threatsData[id];
      if (!t) return null;
      const { all, official } = asiForThreat(t);
      const m = membership(rng, ASI_OPTIONS, all, official);
      if (!m) return null;
      const label = (key: string) => ASI_OPTIONS.find((o) => o.key === key)?.label ?? key;
      const officialList = ASI_OPTIONS.filter((o) => official.has(o.key)).map((o) => o.label);
      const editorial = (t.asiMappingUnofficial ?? []).filter((a) => !official.has(a));
      const answerKey = m.mode === "in" ? m.answer.key : [...all][0];
      return fromMembership("threat-asi", id, m, {
        prompt:
          m.mode === "in"
            ? `Which OWASP Top 10 for Agentic Applications entry maps to ${threatTitle(t)}?`
            : `Which OWASP Top 10 for Agentic Applications entry does NOT map to ${threatTitle(t)}?`,
        explanation:
          (officialList.length
            ? `Appendix A of the Top 10 maps ${t.code} to ${listText(officialList)}.`
            : `${t.code} maps to ${listText([...all].map(label))}.`) +
          (editorial.length
            ? ` This site also maps it to ${listText(editorial.map(label))} (editorial).`
            : ""),
        link: {
          href: `/taxonomy?tab=owasp-agentic&entry=${encodeURIComponent(answerKey)}`,
          label: `Open ${answerKey}`,
        },
      });
    },
  },

  "vector-severity": {
    subjects: () =>
      THREATS.flatMap((t) =>
        (t.attackVectors ?? []).flatMap((v, i) => (v.severity ? [`${t.id}#${i}`] : [])),
      ),
    build: (subject) => {
      const [id, idx] = subject.split("#");
      const t = threatsData[id];
      const v = t?.attackVectors?.[Number(idx)];
      if (!t || !v?.severity) return null;
      const answer = severityLabel(impactBand(v.severity));
      const answerIndex = SEVERITY_CHOICES.indexOf(answer as (typeof SEVERITY_CHOICES)[number]);
      if (answerIndex < 0) return null;
      const vectors = t.attackVectors ?? [];
      const same = vectors.filter((x) => x.severity === v.severity).length;
      return {
        id: `vector-severity:${subject}`,
        kind: "vector-severity",
        prompt: `How does the threat catalog rate the attack vector “${v.vector}” (${threatTitle(t)})?`,
        context: v.example ? `Example: ${v.example}` : undefined,
        choices: [...SEVERITY_CHOICES],
        answerIndex,
        explanation: `“${v.vector}” is rated ${answer.toLowerCase()}. ${same} of ${t.code}'s ${vectors.length} attack vectors share that rating.`,
        link: { href: `/threats/${t.id}`, label: `Open ${t.code} attack vectors` },
      };
    },
  },

  "threat-control": {
    subjects: () => THREATS.map((t) => t.id),
    build: (id, rng) => {
      const t = threatsData[id];
      if (!t) return null;
      const members = controlsForThreat(t);
      const m = membership(rng, CONTROL_OPTIONS, members);
      if (!m) return null;
      const codes = CONTROLS.filter((c) => members.has(c.id)).map(controlCode);
      return fromMembership("threat-control", id, m, {
        prompt:
          m.mode === "in"
            ? `Which control is mapped to mitigate ${threatTitle(t)}?`
            : `Which control is NOT mapped to ${threatTitle(t)}?`,
        explanation: `${codes.length} controls mitigate ${t.code}: ${listText(codes)}.`,
        link:
          m.mode === "in"
            ? { href: `/controls/${m.answer.key}`, label: `Open ${m.answer.key.toUpperCase()}` }
            : { href: `/threats/${t.id}`, label: `Open ${t.code} controls` },
      });
    },
  },

  "control-threat": {
    subjects: () => CONTROLS.map((c) => c.id),
    build: (id, rng) => {
      const c = mitigationsData[id];
      if (!c) return null;
      const members = threatsForControl(c);
      const m = membership(rng, THREAT_OPTIONS, members);
      if (!m) return null;
      const codes = THREATS.filter((t) => members.has(t.id)).map((t) => t.code);
      return fromMembership("control-threat", id, m, {
        prompt:
          m.mode === "in"
            ? `Which threat does ${controlTitle(c)} mitigate?`
            : `Which threat is NOT on the list mitigated by ${controlTitle(c)}?`,
        explanation: `${controlCode(c)} mitigates ${codes.length} of ${THREATS.length} threats: ${listText(codes)}.`,
        link: { href: `/controls/${c.id}`, label: `Open ${controlCode(c)}` },
      });
    },
  },

  "maestro-layer": {
    subjects: () => [...KC_ORDER, ...SEMANTIC_TYPES.map((s) => s.id)],
    build: (id, rng) => {
      const kc = KC[id as KcId];
      const sem = kc ? undefined : SEMANTIC_TYPES.find((s) => s.id === id);
      const layers = kc?.maestroLayers ?? sem?.maestroLayers;
      if (!layers?.length) return null;
      const m = membership(rng, LAYER_OPTIONS, new Set(layers.map(String)));
      if (!m) return null;
      const names = layers.map((l) => MAESTRO_LAYER_LABELS[l as MaestroLayer]);
      const label = kc ? kcLabel(kc.id) : (sem?.label ?? id);
      return fromMembership("maestro-layer", id, m, {
        prompt: kc
          ? `Which MAESTRO layer does ${label} primarily live in?`
          : `In the Threat Modeler, which MAESTRO layer does the “${label}” node sit on?`,
        explanation:
          `${label} sits on ${listText(names)}.` + (sem?.why ? ` Why it matters: ${sem.why}` : ""),
        link: kc
          ? { href: `/components/${kc.id}`, label: `Open ${kc.code}` }
          : { href: "/threat-modeler-guide", label: "Open the Threat Modeler guide" },
      });
    },
  },

  "control-aisvs": {
    subjects: () => CONTROLS.filter((c) => c.aisvsCategories?.length).map((c) => c.id),
    build: (id, rng) => {
      const c = mitigationsData[id];
      const cats = (c?.aisvsCategories ?? []).filter((code) => code in aisvsData);
      if (!c || !cats.length) return null;
      const m = membership(rng, CHAPTER_OPTIONS, new Set(cats));
      if (!m) return null;
      const names = CHAPTER_OPTIONS.filter((o) => cats.includes(o.key)).map((o) => o.label);
      return fromMembership("control-aisvs", id, m, {
        prompt:
          m.mode === "in"
            ? `Which AISVS ${aisvsStats.version} chapter does ${controlTitle(c)} help satisfy?`
            : `Which AISVS ${aisvsStats.version} chapter is NOT mapped to ${controlTitle(c)}?`,
        explanation: `${controlCode(c)} maps to ${listText(names)}.`,
        link:
          m.mode === "in"
            ? { href: `/aisvs#${m.answer.key}`, label: `Open AISVS ${m.answer.key}` }
            : { href: `/controls/${c.id}`, label: `Open ${controlCode(c)}` },
      });
    },
  },

  "aisvs-section": {
    subjects: () => {
      const counts = new Map<string, number>();
      for (const ch of CHAPTERS)
        for (const s of ch.subCategories) counts.set(s.name, (counts.get(s.name) ?? 0) + 1);
      return CHAPTERS.flatMap((ch) =>
        ch.subCategories
          .filter((s) => s.requirements.length > 0 && counts.get(s.name) === 1)
          .map((s) => s.code),
      );
    },
    build: (code, rng) => {
      const chapter = CHAPTERS.find((ch) => ch.subCategories.some((s) => s.code === code));
      const section = chapter?.subCategories.find((s) => s.code === code);
      if (!chapter || !section) return null;
      const m = membership(rng, CHAPTER_OPTIONS, new Set([chapter.code]));
      if (!m) return null;
      return fromMembership("aisvs-section", code, m, {
        prompt: `Which AISVS ${aisvsStats.version} chapter contains the section “${section.name}”?`,
        explanation: `“${section.name}” is section ${section.code} of ${chapter.code} · ${chapter.name}, with ${section.requirements.length} requirement${section.requirements.length === 1 ? "" : "s"}.`,
        link: { href: `/aisvs#${chapter.code}`, label: `Open AISVS ${chapter.code}` },
      });
    },
  },

  "subcomponent-kc": {
    subjects: () => Object.keys(componentDataMap).filter((k) => k.includes(".") && kcId(k)),
    build: (id, rng) => {
      const entry = componentDataMap[id];
      const kc = kcId(id);
      if (!entry || !kc) return null;
      const m = membership(rng, KC_OPTIONS, new Set([kc]));
      if (!m) return null;
      return fromMembership("subcomponent-kc", id, m, {
        prompt: `“${entry.title}” is a sub-component of which key component?`,
        explanation: `${id.toUpperCase()} ${entry.title} belongs to ${kcLabel(kc)}. ${firstSentence(entry.description)}`,
        link: { href: `/components/${id}`, label: `Open ${id.toUpperCase()}` },
      });
    },
  },

  "architecture-threat": {
    subjects: () => THREATS.map((t) => t.id),
    build: (id, rng) => {
      const t = threatsData[id];
      if (!t) return null;
      const members = new Set(
        ARCHITECTURES.filter((a) => a.threatIds.includes(id)).map((a) => a.id),
      );
      const m = membership(rng, ARCH_OPTIONS, members);
      if (!m) return null;
      const names = ARCHITECTURES.filter((a) => members.has(a.id)).map((a) => a.name);
      return fromMembership("architecture-threat", id, m, {
        prompt:
          m.mode === "in"
            ? `Which reference architecture lists ${threatTitle(t)} among its key threats?`
            : `Which reference architecture does NOT list ${threatTitle(t)} among its key threats?`,
        explanation: `${t.code} is a key threat for ${names.length} of ${ARCHITECTURES.length} patterns: ${listText(names)}.`,
        link:
          m.mode === "in"
            ? { href: `/architectures/${m.answer.key}`, label: `Open ${m.answer.label}` }
            : { href: `/threats/${t.id}`, label: `Open ${t.code}` },
      });
    },
  },

  "nist-aisvs": {
    subjects: () => NIST.filter((n) => n.aisvs.length > 0).map((n) => n.code),
    build: (code, rng) => {
      const n = NIST_AISVS_REMAP[code];
      const cats = (n?.aisvs ?? []).filter((c) => c in aisvsData);
      if (!n || !cats.length) return null;
      const m = membership(rng, CHAPTER_OPTIONS, new Set(cats));
      if (!m) return null;
      return fromMembership("nist-aisvs", code, m, {
        prompt:
          m.mode === "in"
            ? `This site maps NIST AI RMF ${n.code} to which AISVS chapter?`
            : `Which AISVS chapter is NOT mapped to NIST AI RMF ${n.code} on this site?`,
        explanation: `${n.code} → ${listText(cats)}. ${n.rationale} (Editorial mapping.)`,
        link: {
          href: `/nist-mapping?sub=${encodeURIComponent(n.code)}`,
          label: `Open ${n.code}`,
        },
      });
    },
  },

  "nist-organizational": {
    subjects: () => NIST.filter((n) => n.organizational).map((n) => n.code),
    build: (code, rng) => {
      const n = NIST_AISVS_REMAP[code];
      if (!n?.organizational) return null;
      const technical = NIST_OPTIONS.filter((o) => !NIST_AISVS_REMAP[o.key].organizational);
      if (technical.length < 3) return null;
      const order = new Map(NIST_OPTIONS.map((o, i) => [o.key, i]));
      const answer = { key: n.code, label: n.code };
      const choices = [answer, ...sample(rng, technical, 3)].sort(
        (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0),
      );
      const orgCount = NIST.filter((x) => x.organizational).length;
      return {
        id: `nist-organizational:${code}`,
        kind: "nist-organizational",
        prompt:
          "Which NIST AI RMF subcategory does this site treat as a purely organizational practice, with no AISVS chapter mapped?",
        choices: choices.map((c) => c.label),
        answerIndex: choices.indexOf(answer),
        explanation: `${n.code}: ${n.rationale} ${orgCount} of ${NIST.length} subcategories are organizational on this site.`,
        link: {
          href: `/nist-mapping?sub=${encodeURIComponent(n.code)}`,
          label: `Open ${n.code}`,
        },
      };
    },
  },
};

export const QUESTION_KINDS = Object.keys(GENERATORS) as QuestionKind[];

/** Every subject a kind can ask about (for tests and previews). */
export function questionSubjects(kind: QuestionKind): string[] {
  return GENERATORS[kind].subjects();
}

/** Build one question for a specific subject (null when the data cannot support a 4-choice question). */
export function buildQuestion(kind: QuestionKind, subject: string, rng: Rng): QuizQuestion | null {
  return GENERATORS[kind].build(subject, rng);
}

/**
 * One question of `kind` whose subject is not in `usedSubjects` (mutated). Prefers a question whose
 * correct answer has not been used yet in the same quiz (`usedAnswers`, mutated) for variety.
 */
export function generateQuestion(
  kind: QuestionKind,
  rng: Rng,
  usedSubjects: Set<string> = new Set(),
  usedAnswers: Set<string> = new Set(),
): QuizQuestion | null {
  const pool = shuffle(rng, GENERATORS[kind].subjects()).filter(
    (s) => !usedSubjects.has(`${kind}:${s}`),
  );
  let fallback: { subject: string; q: QuizQuestion } | null = null;
  for (const subject of pool) {
    const q = GENERATORS[kind].build(subject, rng);
    if (!q) continue;
    const answerKey = `${kind}:${q.choices[q.answerIndex]}`;
    if (usedAnswers.has(answerKey)) {
      fallback ??= { subject, q };
      continue;
    }
    usedSubjects.add(`${kind}:${subject}`);
    usedAnswers.add(answerKey);
    return q;
  }
  if (fallback) usedSubjects.add(`${kind}:${fallback.subject}`);
  return fallback?.q ?? null;
}

/** Build a quiz from a plan of kinds (one question per entry, unique subjects). */
export function buildQuiz(
  id: string,
  title: string,
  plan: readonly QuestionKind[],
  seed: string,
  opts: { shuffleOrder?: boolean } = {},
): GeneratedQuiz {
  const rng = createRng(seed);
  const used = new Set<string>();
  const answers = new Set<string>();
  const questions: QuizQuestion[] = [];
  for (const kind of plan) {
    const q = generateQuestion(kind, rng, used, answers);
    if (q) questions.push(q);
  }
  return { id, title, seed, questions: opts.shuffleOrder ? shuffle(rng, questions) : questions };
}

function seedFor(quizId: string, opts: QuizBuildOptions): string {
  if (opts.seed) return opts.seed;
  const base = `${quizId}:${dayKey(opts.date)}`;
  return opts.attempt ? `${base}:${opts.attempt}` : base;
}

// ─── Learning-path step quizzes and the challenge ───────────────────────────

/** Questions per learning-path step (five each). */
export const STEP_QUIZ_PLAN: Readonly<Record<LearningStepId, readonly QuestionKind[]>> = {
  components: ["subcomponent-kc", "subcomponent-kc", "threat-kc", "threat-kc", "maestro-layer"],
  threats: [
    "threat-asi",
    "threat-asi",
    "vector-severity",
    "vector-severity",
    "architecture-threat",
  ],
  controls: [
    "threat-control",
    "threat-control",
    "threat-control",
    "control-threat",
    "control-threat",
  ],
  aisvs: ["control-aisvs", "control-aisvs", "control-aisvs", "aisvs-section", "aisvs-section"],
  nist: ["nist-aisvs", "nist-aisvs", "nist-aisvs", "nist-aisvs", "nist-organizational"],
  model: ["maestro-layer", "maestro-layer", "maestro-layer", "threat-kc", "threat-control"],
};

const STEP_TITLES: Record<LearningStepId, string> = {
  components: "Components quiz",
  threats: "Threats quiz",
  controls: "Controls quiz",
  aisvs: "AISVS quiz",
  nist: "NIST quiz",
  model: "Threat modeling quiz",
};

/** Store key for a step quiz (matches `LearningStep.quizId`). */
export const stepQuizId = (stepId: LearningStepId) => `path-${stepId}`;

export function buildStepQuiz(stepId: LearningStepId, opts: QuizBuildOptions = {}): GeneratedQuiz {
  const id = stepQuizId(stepId);
  return buildQuiz(id, STEP_TITLES[stepId], STEP_QUIZ_PLAN[stepId], seedFor(id, opts));
}

export const CHALLENGE_QUIZ_ID = "challenge";
export const CHALLENGE_TITLE = "Agentic Security Challenge";

/** Ten questions across every dataset, order shuffled. */
export const CHALLENGE_PLAN: readonly QuestionKind[] = [
  "threat-kc",
  "threat-asi",
  "vector-severity",
  "threat-control",
  "control-threat",
  "maestro-layer",
  "control-aisvs",
  "subcomponent-kc",
  "architecture-threat",
  "nist-aisvs",
];

/** The 10-question "Agentic Security Challenge" (same questions all day by default). */
export function buildChallengeQuiz(opts: QuizBuildOptions = {}): GeneratedQuiz {
  return buildQuiz(
    CHALLENGE_QUIZ_ID,
    CHALLENGE_TITLE,
    CHALLENGE_PLAN,
    seedFor(CHALLENGE_QUIZ_ID, opts),
    { shuffleOrder: true },
  );
}

/** Display names for the quiz ids this module writes to the progress store. */
export function quizTitle(quizId: string): string {
  if (quizId === CHALLENGE_QUIZ_ID) return CHALLENGE_TITLE;
  const step = quizId.replace(/^path-/, "") as LearningStepId;
  return STEP_TITLES[step] ?? quizId;
}

/** Every quiz id this module can produce, in display order. */
export const QUIZ_IDS: readonly string[] = [
  ...(Object.keys(STEP_QUIZ_PLAN) as LearningStepId[]).map(stepQuizId),
  CHALLENGE_QUIZ_ID,
];
