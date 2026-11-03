/**
 * Pure helpers behind <RichText> (no React): glossary, code-link targets and the block parser.
 * Split out so RichText.tsx only exports components (react-refresh) and so tests/scripts can
 * parse text without rendering.
 */

export interface GlossaryEntry {
  definition: string;
  href?: string;
}

export const DEFAULT_GLOSSARY: Readonly<Record<string, GlossaryEntry>> = {
  containerization: {
    definition:
      "A lightweight form of virtualization that packages applications with their dependencies into containers.",
  },
  virtualization: {
    definition:
      "Technology that creates virtual versions of computing resources like servers, storage, or networks.",
  },
  Docker: {
    definition:
      "A platform for developing, shipping, and running applications using containerization technology.",
  },
  Podman: {
    definition:
      "A daemonless container engine for developing, managing, and running OCI containers.",
  },
  SELinux: {
    definition: "Security-Enhanced Linux — a mandatory access control security mechanism.",
  },
  AppArmor: {
    definition:
      "A Linux kernel security module that restricts programs' capabilities with per-program profiles.",
  },
  WASM: {
    definition: "WebAssembly — a binary instruction format for a stack-based virtual machine.",
  },
  QEMU: { definition: "Quick Emulator — a generic, open-source machine emulator and virtualizer." },
  KVM: { definition: "Kernel-based Virtual Machine — a virtualization infrastructure for Linux." },
  Firecracker: {
    definition:
      "A virtualization technology for creating and managing secure, multi-tenant microVM environments.",
  },
  microVM: {
    definition: "Lightweight virtual machines optimized for serverless computing workloads.",
  },
  cgroups: {
    definition: "Control groups — a Linux kernel feature that limits and isolates resource usage.",
  },
  namespaces: {
    definition:
      "A Linux kernel feature that partitions kernel resources so one set of processes sees one set of resources.",
  },
  seccomp: {
    definition:
      "Secure computing mode — a Linux kernel facility that restricts the system calls a process may make.",
  },
};

export type CodeRef =
  | { kind: "aisvs"; code: string }
  | { kind: "threat"; code: string }
  | { kind: "control"; code: string }
  | { kind: "asi"; code: string };

/** Default link targets for code references. */
export function defaultCodeHref(ref: CodeRef): string {
  switch (ref.kind) {
    case "aisvs":
      return `/aisvs#${ref.code}`;
    case "threat":
      return `/threats/${ref.code.toLowerCase()}`;
    case "control":
      return `/controls/${ref.code.toLowerCase()}`;
    case "asi":
      return `/taxonomy?tab=owasp-agentic&entry=${ref.code}`;
  }
}

// ─── Block parser ───────────────────────────────────────────────────────────

export type Block =
  | { type: "code"; code: string; lang: string }
  | { type: "heading"; text: string; level: 3 | 4 }
  | { type: "labelled"; label: string; text: string }
  | { type: "list"; ordered: boolean; inline?: boolean; items: { text: string; depth: number }[] }
  | { type: "para"; text: string };

const BULLET_RE = /^(\s*)(?:[-*•])\s+(.*)$/;
const NUMBER_RE = /^(\s*)\d+[.)]\s+(.*)$/;

export function parseBlocks(source: string): Block[] {
  const blocks: Block[] = [];
  const fence = /```([\w+-]*)[^\n]*\n([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  const prose: Array<{ text: string } | { code: string; lang: string }> = [];
  while ((m = fence.exec(source)) !== null) {
    if (m.index > last) prose.push({ text: source.slice(last, m.index) });
    prose.push({ code: m[2].replace(/\s+$/, ""), lang: m[1] || "" });
    last = m.index + m[0].length;
  }
  if (last < source.length) prose.push({ text: source.slice(last) });

  for (const part of prose) {
    if ("code" in part) {
      if (part.code.trim()) blocks.push({ type: "code", code: part.code, lang: part.lang });
      continue;
    }
    const lines = part.text.split("\n");
    const nonEmpty = lines.filter((l) => l.trim());
    // ControlDetail parity: a single line with several " - " separators is a list.
    if (nonEmpty.length === 1 && (nonEmpty[0].match(/ - /g) ?? []).length > 1) {
      const items = nonEmpty[0]
        .split(/ - /)
        .map((s) => s.replace(/^\s*-\s+/, "").trim())
        .filter(Boolean)
        .map((text) => ({ text, depth: 0 }));
      blocks.push({ type: "list", ordered: false, inline: true, items });
      continue;
    }
    let list: Extract<Block, { type: "list" }> | null = null;
    const flush = () => {
      if (list) blocks.push(list);
      list = null;
    };
    for (const raw of lines) {
      const line = raw.replace(/\s+$/, "");
      const t = line.trim();
      if (!t) {
        flush();
        continue;
      }
      let mm: RegExpMatchArray | null;
      if ((mm = t.match(/^\*\*([^*]+?)\*\*:?$/)) || (mm = t.match(/^\*\*([^*]+?):\*\*$/))) {
        flush();
        blocks.push({ type: "heading", text: mm[1].replace(/:$/, "").trim(), level: 3 });
      } else if ((mm = t.match(/^(#{1,4})\s+(.+)$/))) {
        flush();
        blocks.push({ type: "heading", text: mm[2].trim(), level: mm[1].length <= 2 ? 3 : 4 });
      } else if (
        (mm = t.match(/^\*\*([^*]+?):\*\*\s*(.+)$/)) ||
        (mm = t.match(/^\*\*([^*]+?)\*\*:\s*(.+)$/))
      ) {
        flush();
        blocks.push({ type: "labelled", label: mm[1].trim(), text: mm[2].trim() });
      } else if ((mm = line.match(BULLET_RE)) || (mm = line.match(NUMBER_RE))) {
        const ordered = NUMBER_RE.test(line) && !BULLET_RE.test(line);
        const depth = mm[1].replace(/\t/g, "  ").length >= 2 ? 1 : 0;
        const current = list as Extract<Block, { type: "list" }> | null;
        if (!current || (current.ordered !== ordered && depth === 0)) {
          flush();
          list = { type: "list", ordered, items: [] };
        }
        (list as Extract<Block, { type: "list" }>).items.push({ text: mm[2].trim(), depth });
      } else {
        flush();
        blocks.push({ type: "para", text: t });
      }
    }
    flush();
  }
  return blocks;
}
