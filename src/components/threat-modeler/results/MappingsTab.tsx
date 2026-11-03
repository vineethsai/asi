/**
 * Mappings tab (P3-34): threats grouped by OWASP Agentic Security (ASI) entry
 * with mapping confidence, and by Cisco AI taxonomy objective with techniques.
 */
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { AnalysisResult } from "../engine/analyze";
import { useCanvasActions } from "../hooks/useCanvasActions";
import { threatResolution, tm } from "../store";
import type { GeneratedThreat } from "../types";
import { threatDomId } from "./helpers";
import { Chip, Disclosure, SevChip } from "./shared";

interface MapGroup {
  id: string;
  name: string;
  extra: string[];
  rows: { t: GeneratedThreat; note?: string }[];
  open: number;
}

const CONF_RANK = { high: 0, medium: 1, low: 2 } as const;

function GroupBlock({
  g,
  kind,
  onPick,
}: {
  g: MapGroup;
  kind: "asi" | "cisco";
  onPick: (t: GeneratedThreat) => void;
}) {
  const [open, setOpen] = useState(false);
  const bodyId = `tm-map-${kind}-${threatDomId(g.id)}`;
  return (
    <li className="rounded-md border bg-card p-1.5 text-xs">
      <div className="flex items-start gap-2">
        <Disclosure
          open={open}
          onToggle={() => setOpen((o) => !o)}
          controls={bodyId}
          className="min-w-0 flex-1 text-left text-xs text-foreground"
        >
          <span aria-hidden>{open ? "▾" : "▸"}</span>
          <span className="font-mono text-[11px] text-muted-foreground">{g.id}</span>
          <span className="truncate">{g.name}</span>
        </Disclosure>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {g.open} open / {g.rows.length}
        </span>
      </div>
      <div id={bodyId} hidden={!open} className="mt-1.5 space-y-1.5">
        {open && (
          <>
            {g.extra.length > 0 && (
              <div className="flex flex-wrap gap-1" aria-label="Techniques">
                {g.extra.map((x) => (
                  <Chip key={x} title="Technique">
                    {x}
                  </Chip>
                ))}
              </div>
            )}
            <ul className="space-y-0.5">
              {g.rows.map(({ t, note }) => {
                const resolved = threatResolution(t) === "resolved";
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => onPick(t)}
                      className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <SevChip band={t.severity} />
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate",
                          resolved && "text-muted-foreground line-through",
                        )}
                      >
                        {t.name}
                        {resolved && <span className="sr-only"> (resolved)</span>}
                      </span>
                      {note && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">{note}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </li>
  );
}

export function MappingsTab({ analysis }: { analysis: AnalysisResult }) {
  const actions = useCanvasActions();
  const [withInherited, setWithInherited] = useState(false);

  const { asi, cisco, unmapped } = useMemo(() => {
    const asiMap = new Map<string, MapGroup>();
    const ciscoMap = new Map<string, MapGroup & { tech: Set<string> }>();
    let unmapped = 0;
    for (const t of analysis.threats) {
      if (t.inherited && !withInherited) continue;
      const isOpen = threatResolution(t) === "open";
      if (!t.owaspMapping?.length && !t.ciscoMapping?.length) unmapped += 1;
      for (const m of t.owaspMapping ?? []) {
        const g = asiMap.get(m.asiId) ?? {
          id: m.asiId,
          name: m.asiName,
          extra: [],
          rows: [],
          open: 0,
        };
        g.rows.push({ t, note: `${m.confidence} confidence` });
        if (isOpen) g.open += 1;
        asiMap.set(m.asiId, g);
      }
      for (const m of t.ciscoMapping ?? []) {
        const g = ciscoMap.get(m.objectiveId) ?? {
          id: m.objectiveId,
          name: m.objectiveName,
          extra: [],
          rows: [],
          open: 0,
          tech: new Set<string>(),
        };
        g.rows.push({ t, note: m.techniques?.length ? m.techniques.join(", ") : undefined });
        for (const x of m.techniques ?? []) g.tech.add(x);
        if (isOpen) g.open += 1;
        ciscoMap.set(m.objectiveId, g);
      }
    }
    const conf = (n?: string) =>
      CONF_RANK[(n?.split(" ")[0] ?? "low") as keyof typeof CONF_RANK] ?? 2;
    const asi = [...asiMap.values()]
      .map((g) => ({
        ...g,
        rows: g.rows.sort(
          (a, b) => conf(a.note) - conf(b.note) || a.t.name.localeCompare(b.t.name),
        ),
      }))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    const cisco = [...ciscoMap.values()]
      .map(({ tech, ...g }) => ({ ...g, extra: [...tech].sort() }))
      .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    return { asi, cisco, unmapped };
  }, [analysis, withInherited]);

  const pick = (t: GeneratedThreat) => {
    tm().setUi({ selectedThreatId: t.id, resultsTab: "threats" });
    if (t.affectedNodeIds.length) actions.locate(t.affectedNodeIds);
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-1.5 text-[11px]">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 accent-primary"
          checked={withInherited}
          onChange={(e) => setWithInherited(e.target.checked)}
        />
        Include inherited threats
      </label>
      <section aria-labelledby="tm-map-asi-h" className="space-y-1.5">
        <h3 id="tm-map-asi-h" className="text-xs font-semibold">
          OWASP Agentic Security (ASI) · {asi.length} entr{asi.length === 1 ? "y" : "ies"}
        </h3>
        {asi.length ? (
          <ul className="space-y-1">
            {asi.map((g) => (
              <GroupBlock key={g.id} g={g} kind="asi" onPick={pick} />
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-muted-foreground">No threat maps to an ASI entry.</p>
        )}
      </section>
      <section aria-labelledby="tm-map-cisco-h" className="space-y-1.5">
        <h3 id="tm-map-cisco-h" className="text-xs font-semibold">
          Cisco AI security taxonomy · {cisco.length} objective{cisco.length === 1 ? "" : "s"}
        </h3>
        {cisco.length ? (
          <ul className="space-y-1">
            {cisco.map((g) => (
              <GroupBlock key={g.id} g={g} kind="cisco" onPick={pick} />
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-muted-foreground">No threat maps to a Cisco objective.</p>
        )}
      </section>
      {unmapped > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {unmapped} threat{unmapped === 1 ? " has" : "s have"} no taxonomy mapping.
        </p>
      )}
    </div>
  );
}

export default MappingsTab;
