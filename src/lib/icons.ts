/**
 * Single icon registry (IMPROVEMENT_PLAN.md P1-04). Every `icon` string used by the data modules
 * (securityData threats / mitigations / AISVS, architecturesData, owaspAgenticTop10Data,
 * aiuc1Data, frameworkData, NIST functions, threat-modeler palette) resolves here — zero fallbacks.
 *
 * Keys are kebab-case. Lookup is forgiving: "BrainCircuit", "brain_circuit" and "Brain Circuit"
 * all normalise to "brain-circuit"; AISVS chapter codes ("C5", "c5") and KC ids ("kc3", "KC3")
 * resolve too.
 *
 * Usage:
 *   import { Icon, getIcon } from "@/lib/icons";
 *   <Icon name={threat.icon} className="h-5 w-5" />
 *   const Cmp = getIcon(category.icon);  <Cmp className="h-4 w-4" aria-hidden />
 *
 * For scripts: ICON_REGISTRY below is written one `"key": Component,` per line so
 * scripts/check-data-integrity.js can extract the key list with a regex if it cannot import TS.
 */

import { createElement, type ReactElement } from "react";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  BookOpen,
  Bot,
  Box,
  Boxes,
  Brain,
  BrainCircuit,
  Bug,
  Cable,
  CheckCircle,
  CheckCircle2,
  CircleHelp,
  Cloud,
  Code,
  Container,
  Cpu,
  CreditCard,
  Database,
  DatabaseZap,
  Eye,
  EyeOff,
  FileSearch,
  FileText,
  Filter,
  Fingerprint,
  FlaskConical,
  GitBranch,
  GitBranchPlus,
  GitPullRequest,
  Glasses,
  Globe,
  HardDrive,
  Key,
  KeyRound,
  Layers,
  Library,
  Lightbulb,
  ListChecks,
  Lock,
  Mail,
  MessageCircle,
  MessagesSquare,
  Monitor,
  Network,
  PackageCheck,
  Pencil,
  Plug,
  Puzzle,
  Radar,
  Repeat,
  Scale,
  ScanEye,
  ScrollText,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  Siren,
  Target,
  Terminal,
  Truck,
  User,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  UserX,
  Users,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** key → lucide component. Keep one entry per line (see header). */
export const ICON_REGISTRY = {
  // ── Threats (securityData.threatsData[].icon) ─────────────────────────
  memory: Brain,
  tool: Zap,
  privilege: Key,
  resource: Database,
  hallucination: Bug,
  intent: Target,
  misalign: EyeOff,
  repudiation: UserX,
  identity: User,
  hitl: Users,
  rce: Activity,
  communication: MessageCircle,
  rogue: UserMinus,
  human: UserCog,
  manipulation: UserPlus,
  // ── Mitigations / controls (securityData.mitigationsData[].icon) ──────
  sandbox: Box,
  comm: MessageCircle,
  prompt: FileText,
  validate: CheckCircle2,
  monitor: Monitor,
  trust: Shield,
  defense: ShieldCheck,
  filter: Filter,
  model: BrainCircuit,
  workflow: Workflow,
  runtime: Container,
  ethics: Scale,
  supply: PackageCheck,
  incident: Siren,
  lifecycle: Repeat,
  // ── AISVS draft categories (securityData.aisvsData[].icon) ────────────
  database: Database,
  "shield-half": ShieldHalf,
  "git-pull-request": GitPullRequest,
  server: Server,
  key: Key,
  truck: Truck,
  "safety-goggles": Glasses,
  "git-branch-plus": GitBranchPlus,
  "shield-alert": ShieldAlert,
  lock: Lock,
  activity: Activity,
  users: Users,
  // ── AISVS 1.01 chapters by code (C1–C12; C13 kept for the archived draft) ─
  c1: Database,
  c2: ShieldHalf,
  c3: GitPullRequest,
  c4: Server,
  c5: KeyRound,
  c6: Truck,
  c7: ShieldCheck,
  c8: DatabaseZap,
  c9: Bot,
  c10: Plug,
  c11: ShieldAlert,
  c12: Activity,
  c13: Users,
  // ── AISVS 1.01 semantic aliases (for the re-based data's icon keys) ───
  "training-data": Database,
  "input-validation": ShieldHalf,
  "model-lifecycle": GitPullRequest,
  infrastructure: Server,
  "access-control": KeyRound,
  "supply-chain": Truck,
  "output-control": ShieldCheck,
  vector: DatabaseZap,
  "vector-database": DatabaseZap,
  embeddings: DatabaseZap,
  orchestration: Bot,
  agentic: Bot,
  mcp: Plug,
  adversarial: ShieldAlert,
  "adversarial-robustness": ShieldAlert,
  monitoring: Activity,
  logging: ScrollText,
  privacy: Lock,
  "human-oversight": Users,
  // ── Legacy Controls.tsx aisvsIconMap keys ────────────────────────────
  cycle: Repeat,
  safety: ShieldCheck,
  robot: Bot,
  "user-check": UserCheck,
  // ── Architectures (architecturesData[].icon) ─────────────────────────
  "flow-linear": Database,
  "flow-hierarchical": Users,
  "flow-swarm": UserCheck,
  "flow-reactive": Monitor,
  "flow-knowledge": FileText,
  // ── OWASP Agentic Top 10 (owaspAgenticTop10Data[].icon) ──────────────
  target: Target,
  wrench: Wrench,
  "git-branch": GitBranch,
  code: Code,
  network: Network,
  zap: Zap,
  user: User,
  "shield-check": ShieldCheck,
  // ── AIUC-1 principles (aiuc1Data principles[].icon) ──────────────────
  "alert-triangle": AlertTriangle,
  "check-circle": CheckCircle,
  globe: Globe,
  shield: Shield,
  // ── Components / KC (frameworkData[].icon, modeler palette, kc.ts) ───
  brain: Brain,
  "brain-circuit": BrainCircuit,
  cloud: Cloud,
  lightbulb: Lightbulb,
  kc1: Brain,
  kc2: GitBranch,
  kc3: Lightbulb,
  kc4: Database,
  kc5: Wrench,
  kc6: Server,
  // ── Threat-modeler palette / nodes ───────────────────────────────────
  cpu: Cpu,
  box: Box,
  boxes: Boxes,
  settings: Settings,
  "hard-drive": HardDrive,
  "file-text": FileText,
  "file-search": FileSearch,
  terminal: Terminal,
  mail: Mail,
  "credit-card": CreditCard,
  eye: Eye,
  "eye-off": EyeOff,
  pencil: Pencil,
  // ── NIST AI RMF functions (NISTMapping.tsx) ──────────────────────────
  layers: Layers,
  // ── References source types (References.tsx getSourceIcon) ───────────
  "source-threat": Target,
  "source-mitigation": Shield,
  "source-aisvs": Database,
  "book-open": BookOpen,
  // ── General-purpose ──────────────────────────────────────────────────
  "alert-circle": AlertCircle,
  "check-circle-2": CheckCircle2,
  bot: Bot,
  plug: Plug,
  "key-round": KeyRound,
  "database-zap": DatabaseZap,
  scale: Scale,
  siren: Siren,
  "package-check": PackageCheck,
  container: Container,
  fingerprint: Fingerprint,
  "scan-eye": ScanEye,
  "scroll-text": ScrollText,
  glasses: Glasses,
  repeat: Repeat,
  bug: Bug,
  "message-circle": MessageCircle,
  "messages-square": MessagesSquare,
  "monitor-dot": Monitor,
  "user-x": UserX,
  "user-cog": UserCog,
  "user-plus": UserPlus,
  "user-minus": UserMinus,
  library: Library,
  "list-checks": ListChecks,
  "flask-conical": FlaskConical,
  radar: Radar,
  puzzle: Puzzle,
  cable: Cable,
  "arrow-right-left": ArrowRightLeft,
} as const satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICON_REGISTRY;

/** Every registry key (normalised kebab-case) — used by the data-integrity script. */
export const ICON_KEYS = Object.keys(ICON_REGISTRY) as IconKey[];

/**
 * Data icon keys found in the codebase at commit 87406d3 that did NOT resolve in the old maps
 * (ui/icon.tsx, Controls.tsx, OwaspAgenticTop10.tsx, AIUC1Content.tsx). All of them now resolve;
 * this list is kept for the integrity check / regression test. Empty means "no unresolved keys".
 */
export const PREVIOUSLY_UNRESOLVED_ICON_KEYS = [
  "database",
  "shield-half",
  "git-pull-request",
  "server",
  "key",
  "truck",
  "safety-goggles",
  "git-branch-plus",
  "shield-alert",
  "lock",
  "activity",
  "users",
  "model",
  "workflow",
  "runtime",
  "ethics",
  "supply",
  "incident",
  "alert-triangle",
  "check-circle",
  "globe",
  "shield",
] as const;

/** Keys that currently fall back. Kept empty by tests (src/lib/__tests__/icons.test.ts). */
export const UNRESOLVED_ICON_KEYS: readonly string[] = [];

/** Fallback for unknown keys: a neutral "help" glyph (never a warning/shield that looks like data). */
export const FALLBACK_ICON: LucideIcon = CircleHelp;

/** "BrainCircuit" | "brain_circuit" | " Brain Circuit " → "brain-circuit". */
export function normalizeIconKey(key: string): string {
  return key
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

/** The registry key a data key resolves to, or `undefined` when unknown. */
export function resolveIconKey(key: string | null | undefined): IconKey | undefined {
  if (!key) return undefined;
  if (key in ICON_REGISTRY) return key as IconKey;
  const norm = normalizeIconKey(key);
  return norm in ICON_REGISTRY ? (norm as IconKey) : undefined;
}

export function hasIcon(key: string | null | undefined): boolean {
  return resolveIconKey(key) !== undefined;
}

const warned = new Set<string>();

/** Resolve a data icon key to a lucide component (`fallback` or `FALLBACK_ICON` when unknown). */
export function getIcon(
  key: string | null | undefined,
  fallback: LucideIcon = FALLBACK_ICON,
): LucideIcon {
  const k = resolveIconKey(key);
  if (k) return ICON_REGISTRY[k];
  if (key && import.meta.env?.DEV && !warned.has(key)) {
    warned.add(key);
    console.warn(`[icons] Unknown icon key "${key}" — add it to src/lib/icons.ts`);
  }
  return fallback;
}

export interface IconProps extends Omit<LucideProps, "ref"> {
  /** Data icon key (any case / separator). */
  name: string | null | undefined;
  /** Component to use when `name` is unknown (default: `FALLBACK_ICON`). */
  fallback?: LucideIcon;
  /** Accessible label. Without it the icon is decorative (`aria-hidden`). */
  label?: string;
}

/** `<Icon name="shield-check" className="h-4 w-4" />` — decorative unless `label` is given. */
export function Icon({ name, fallback, label, ...rest }: IconProps): ReactElement {
  const Cmp = getIcon(name, fallback);
  const a11y: Omit<LucideProps, "ref"> = label
    ? { role: "img", "aria-label": label }
    : { "aria-hidden": true, focusable: "false" };
  return createElement(Cmp, { ...a11y, ...rest });
}
