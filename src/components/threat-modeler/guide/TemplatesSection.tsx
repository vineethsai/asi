import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { absolutePosition, nodeSize } from "../export/geometry";
import {
  ARCHITECTURE_TEMPLATES,
  ARCHITECTURE_TEMPLATE_MAP,
  instantiateTemplate,
} from "../templates";
import type { ArchitectureTemplate } from "../types";
import { humaniseId } from "./guideData";

function Thumbnail({ template }: { template: ArchitectureTemplate }) {
  const shape = useMemo(() => {
    const { nodes, edges } = instantiateTemplate(template);
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const boxes = new Map(
      nodes.map((n) => {
        const p = absolutePosition(n, byId);
        const s = nodeSize(n);
        return [
          n.id,
          {
            x: p.x,
            y: p.y,
            w: s.width,
            h: s.height,
            boundary: n.type === "trustBoundary",
            actor: n.type === "actor",
          },
        ];
      }),
    );
    const all = [...boxes.values()];
    const minX = Math.min(...all.map((b) => b.x));
    const minY = Math.min(...all.map((b) => b.y));
    const maxX = Math.max(...all.map((b) => b.x + b.w));
    const maxY = Math.max(...all.map((b) => b.y + b.h));
    const lines = edges
      .map((e) => {
        const a = boxes.get(e.source);
        const b = boxes.get(e.target);
        if (!a || !b) return null;
        return {
          id: e.id,
          x1: a.x + a.w / 2,
          y1: a.y + a.h / 2,
          x2: b.x + b.w / 2,
          y2: b.y + b.h / 2,
        };
      })
      .filter(Boolean) as { id: string; x1: number; y1: number; x2: number; y2: number }[];
    return {
      boxes: [...boxes.entries()],
      lines,
      view: `${minX - 20} ${minY - 20} ${maxX - minX + 40} ${maxY - minY + 40}`,
    };
  }, [template]);

  return (
    <svg viewBox={shape.view} className="h-28 w-full" aria-hidden focusable="false">
      {shape.boxes
        .filter(([, b]) => b.boundary)
        .map(([id, b]) => (
          <rect
            key={id}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={18}
            fill="none"
            className="stroke-destructive/50"
            strokeWidth={6}
            strokeDasharray="22 14"
          />
        ))}
      {shape.lines.map((l) => (
        <line key={l.id} {...l} className="stroke-muted-foreground/60" strokeWidth={6} />
      ))}
      {shape.boxes
        .filter(([, b]) => !b.boundary)
        .map(([id, b]) => (
          <rect
            key={id}
            x={b.x}
            y={b.y}
            width={b.w}
            height={b.h}
            rx={b.actor ? 60 : 16}
            className={
              b.actor ? "fill-primary/30 stroke-primary" : "fill-muted stroke-foreground/40"
            }
            strokeWidth={5}
          />
        ))}
    </svg>
  );
}

/** All built-in templates (TM/templates.ts) with thumbnails and an "Open in the modeler" link. */
export default function TemplatesSection() {
  const templateName = (id: string) => ARCHITECTURE_TEMPLATES.find((t) => t.id === id)?.name ?? id;
  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {ARCHITECTURE_TEMPLATES.map((t) => {
          const components = t.nodes.filter((n) => n.type !== "trustBoundary").length;
          const boundaries = t.nodes.length - components;
          return (
            <li key={t.id} className="flex flex-col rounded-lg border bg-card">
              <div className="border-b bg-muted/20 p-2">
                <Thumbnail template={t} />
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="text-sm font-semibold">{t.name}</p>
                <p className="flex-1 text-xs text-muted-foreground">{t.description}</p>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {components} components · {t.edges.length} flows
                  {boundaries
                    ? ` · ${boundaries} trust boundar${boundaries === 1 ? "y" : "ies"}`
                    : ""}
                </p>
                <Link
                  to={`/threat-modeler?template=${encodeURIComponent(t.id)}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Open in the modeler <ArrowRight className="h-3 w-3" aria-hidden />
                  <span className="sr-only">: {t.name}</span>
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="rounded-lg border p-3">
        <p className="text-sm font-semibold">Architecture pages → templates</p>
        <p className="mb-2 text-xs text-muted-foreground">
          "Open in Threat Modeler" on an architecture page loads the matching template. Opening a
          template from a link does not overwrite your autosaved model until you edit it.
        </p>
        <ul className="grid gap-1 text-xs sm:grid-cols-2">
          {Object.entries(ARCHITECTURE_TEMPLATE_MAP).map(([arch, tpl]) => (
            <li key={arch}>
              <Link to={`/architectures/${arch}`} className="text-primary hover:underline">
                {humaniseId(arch)}
              </Link>{" "}
              <span className="text-muted-foreground">→ {templateName(tpl)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
