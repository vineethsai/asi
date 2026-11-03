/**
 * NIST AI RMF → AISVS 1.01 bipartite graph (§9 "NIST bipartite"): Function → Category →
 * Subcategory → AISVS chapter, rendered by the shared <Bipartite> (zoom/pan preserved across
 * updates, Ctrl/⌘-wheel zoom, keyboard navigation, theme-reactive colours via CSS variables).
 */
import { useMemo } from "react";
import { Bipartite, type BipartiteLink, type BipartiteNode } from "@/components/charts/Bipartite";
import { ChartLegend } from "@/components/charts/ChartFrame";
import { useResizeObserver } from "@/components/charts/useResizeObserver";
import { NIST_FUNCTION_PALETTE } from "@/lib/palette";
import { AISVS_CHAPTER_CODES, AISVS_VERSION } from "@/data/aisvs";
import { nistAIRMF, type NistRmfSubcategory } from "@/data/nist";
import {
  categoriesOf,
  chapterName,
  citedIn,
  selectionFromNodeId,
  type NistSelection,
} from "./selection";

const CHAPTER_COLOR = "hsl(var(--primary))";
const ROW = 20;

export interface NistGraphProps {
  subcategories: readonly NistRmfSubcategory[];
  /** When set, only this AISVS chapter is drawn in the last column. */
  chapterFilter?: string;
  selectedNodeId: string | null;
  onSelect: (sel: NistSelection | null) => void;
  /** Shift+Enter / double-click on a node. */
  onActivate?: (sel: NistSelection) => void;
}

export function NistGraph({
  subcategories,
  chapterFilter,
  selectedNodeId,
  onSelect,
  onActivate,
}: NistGraphProps) {
  const { ref, width } = useResizeObserver<HTMLDivElement>({ initialWidth: 1000 });
  const narrow = width > 0 && width < 760;

  const model = useMemo(() => {
    const cats = categoriesOf(subcategories);
    const fns = nistAIRMF.filter((f) => cats.some((c) => c.functionCode === f.code));
    const chapterSet = new Set(subcategories.flatMap((s) => s.aisvs));
    const chapters = AISVS_CHAPTER_CODES.filter(
      (c) => chapterSet.has(c) && (!chapterFilter || chapterFilter === c),
    );
    const nodes: BipartiteNode[] = [];
    const links: BipartiteLink[] = [];
    for (const f of fns) {
      nodes.push({
        id: `fn:${f.code}`,
        label: f.code,
        column: "fn",
        group: f.code,
        color: NIST_FUNCTION_PALETTE[f.code].css,
      });
    }
    for (const c of cats) {
      const inCat = subcategories.filter((s) => s.categoryCode === c.code);
      nodes.push({
        id: `cat:${c.code}`,
        label: `${c.code} ${c.name}`,
        column: "cat",
        group: c.functionCode,
        color: NIST_FUNCTION_PALETTE[c.functionCode].css,
      });
      links.push({ source: `fn:${c.functionCode}`, target: `cat:${c.code}`, weight: inCat.length });
    }
    for (const s of subcategories) {
      nodes.push({
        id: `sub:${s.code}`,
        label: `${s.code} ${s.name}`,
        column: "sub",
        group: s.functionCode,
        color: NIST_FUNCTION_PALETTE[s.functionCode].css,
      });
      links.push({ source: `cat:${s.categoryCode}`, target: `sub:${s.code}`, weight: 1 });
      for (const ch of s.aisvs) {
        if (!chapters.includes(ch)) continue;
        links.push({
          source: `sub:${s.code}`,
          target: `ch:${ch}`,
          weight: Math.max(1, citedIn(s, ch).length),
        });
      }
    }
    for (const ch of chapters) {
      nodes.push({
        id: `ch:${ch}`,
        label: `${ch} ${chapterName(ch)}`,
        column: "ch",
        color: CHAPTER_COLOR,
      });
    }
    const rows = Math.max(fns.length, cats.length, subcategories.length, chapters.length, 1);
    return { nodes, links, cats, fns, chapters, height: 30 + rows * ROW + 12 };
  }, [subcategories, chapterFilter]);

  const columns = useMemo(
    () => [
      { id: "fn", label: "Function", color: "hsl(var(--muted-foreground))" },
      { id: "cat", label: "Category", color: "hsl(var(--muted-foreground))" },
      { id: "sub", label: "Subcategory", color: "hsl(var(--muted-foreground))" },
      { id: "ch", label: `AISVS ${AISVS_VERSION}`, color: CHAPTER_COLOR },
    ],
    [],
  );

  const legend = (
    <ChartLegend
      items={[
        ...nistAIRMF.map((f) => ({
          id: f.code,
          label: f.name,
          color: NIST_FUNCTION_PALETTE[f.code].css,
          shape: "circle" as const,
        })),
        {
          id: "aisvs",
          label: `AISVS ${AISVS_VERSION} chapter`,
          color: CHAPTER_COLOR,
          shape: "circle" as const,
        },
        {
          id: "weight",
          label: "Link width = AISVS requirements cited",
          color: "hsl(var(--muted-foreground))",
          shape: "line" as const,
        },
      ]}
    />
  );

  return (
    <div ref={ref}>
      <Bipartite
        title="NIST AI RMF → AISVS graph"
        description="Select a node to highlight its path and open its details; Shift+Enter or double-click opens it in the detailed mapping."
        ariaLabel={`Graph of ${subcategories.length} NIST AI RMF subcategories in ${model.cats.length} categories of ${model.fns.length} functions, linked to ${model.chapters.length} AISVS ${AISVS_VERSION} chapters`}
        columns={columns}
        nodes={model.nodes}
        links={model.links}
        legend={legend}
        selectedId={
          selectedNodeId && model.nodes.some((n) => n.id === selectedNodeId) ? selectedNodeId : null
        }
        onSelect={(id) => onSelect(selectionFromNodeId(id))}
        onNodeActivate={(n) => {
          const sel = selectionFromNodeId(n.id);
          if (sel) onActivate?.(sel);
        }}
        rowHeight={ROW}
        height={model.height}
        labelWidth={narrow ? 104 : 196}
        valueLabel="links"
      />
    </div>
  );
}

export default NistGraph;
