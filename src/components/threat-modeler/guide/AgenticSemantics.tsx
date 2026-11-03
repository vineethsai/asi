import { Icon } from "@/lib/icons";
import { SEMANTIC_TYPES } from "../semanticTypes";
import { Chip } from "./GuideSection";
import { KIND_EFFECTS } from "./guideData";

/**
 * Agentic primitives (SEMANTIC_TYPES) and what the engine does with each
 * semantic kind. Kinds are read from `data.semantics.kind`; when it is absent
 * the engine infers one from the KC category / component id, never the label.
 */
export default function AgenticSemantics() {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">Agentic component kinds and their engine effects</caption>
        <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 font-semibold">
              Component
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              Why it matters
            </th>
            <th scope="col" className="px-3 py-2 font-semibold">
              What the engine does
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {SEMANTIC_TYPES.map((def) => {
            const fx = KIND_EFFECTS[def.kind];
            return (
              <tr key={def.id} className="align-top">
                <th scope="row" className="px-3 py-2.5 font-normal">
                  <span className="flex items-center gap-2 font-semibold">
                    <Icon name={def.icon} className="h-4 w-4 shrink-0" />
                    {def.label}
                  </span>
                  <span className="mt-1 block font-mono text-[11px] text-muted-foreground">
                    kind: {def.kind}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {def.chips.map((c) => (
                      <Chip key={c}>{c}</Chip>
                    ))}
                  </span>
                </th>
                <td className="px-3 py-2.5 text-muted-foreground">{def.why}</td>
                <td className="px-3 py-2.5 text-muted-foreground">
                  {fx ? (
                    <>
                      <p>{fx.effect}</p>
                      {fx.rules.length > 0 && (
                        <p className="mt-1 flex flex-wrap gap-1">
                          {fx.rules.map((r) => (
                            <a
                              key={r}
                              href={`#rule-${r}`}
                              className="rounded border px-1.5 py-0.5 font-mono text-[11px] text-foreground hover:bg-muted"
                            >
                              {r}
                            </a>
                          ))}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>Recorded on the node; no kind-specific rule.</p>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
