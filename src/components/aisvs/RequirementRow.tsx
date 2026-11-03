import { memo } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Link2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { SeverityBadge } from "@/components/content/SeverityBadge";
import { aisvsLevelBand } from "@/lib/severity";
import { cn } from "@/lib/utils";
import type { AISVSRequirement } from "@/data/aisvs";
import { Highlight } from "./Highlight";
import { checkboxId, citationOf, controlsCitingRequirement, domId } from "./aisvsIndex";

export interface RequirementRowProps {
  req: AISVSRequirement;
  checked: boolean;
  query: string;
  onToggle: (id: string) => void;
  onCopy: (req: AISVSRequirement) => void;
  onAnchor: (code: string) => void;
}

const LEVEL_HINT: Record<1 | 2 | 3, string> = {
  1: "Level 1 — baseline; applies to every AI system",
  2: "Level 2 — standard assurance; adds to Level 1",
  3: "Level 3 — high assurance; adds to Levels 1 and 2",
};

/** One AISVS requirement: checkbox + official text, level pill, copy-citation, citing controls. */
export const RequirementRow = memo(function RequirementRow({
  req,
  checked,
  query,
  onToggle,
  onCopy,
  onAnchor,
}: RequirementRowProps) {
  const controls = controlsCitingRequirement(req.id);
  const cbId = checkboxId(req.id);
  return (
    <li
      id={domId(req.id)}
      className={cn(
        "scroll-mt-24 rounded-lg border bg-card p-3 transition-colors sm:p-4",
        checked ? "border-[hsl(var(--security-low)/0.4)] bg-muted/30" : "hover:bg-accent/40",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          id={cbId}
          checked={checked}
          onCheckedChange={() => onToggle(req.id)}
          className="mt-0.5"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`#${req.id}`}
              onClick={(e) => {
                e.preventDefault();
                onAnchor(req.id);
              }}
              className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-foreground underline-offset-2 hover:underline"
              aria-label={`Link to requirement ${req.id}`}
            >
              <Link2 className="h-3 w-3 text-muted-foreground" aria-hidden />
              <Highlight text={req.id} query={query} />
            </a>
            <SeverityBadge
              band={aisvsLevelBand(req.level)}
              label={`L${req.level}`}
              size="xs"
              title={LEVEL_HINT[req.level]}
            />
            {req.role && (
              <span className="rounded border px-1.5 text-[10px] text-muted-foreground">
                {req.role}
              </span>
            )}
            <button
              type="button"
              onClick={() => onCopy(req)}
              className="ml-auto inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Copy citation ${citationOf(req)}`}
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Copy ID</span>
            </button>
          </div>
          <label
            htmlFor={cbId}
            className={cn(
              "block cursor-pointer text-sm leading-relaxed",
              checked ? "text-muted-foreground line-through decoration-muted-foreground/60" : "",
            )}
          >
            <Highlight text={req.text} query={query} />
          </label>
          {controls.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground">
                Cited by {controls.length === 1 ? "control" : `${controls.length} controls`}:
              </span>
              {controls.map((c) => (
                <Link
                  key={c.id}
                  to={`/controls/${c.id}`}
                  className="inline-flex max-w-[16rem] items-center gap-1 truncate rounded-full border px-2 py-0.5 hover:bg-muted"
                  title={c.name}
                >
                  <span className="font-mono">{c.id.toUpperCase()}</span>
                  <span className="truncate text-muted-foreground">{c.name}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
        {checked && (
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--security-low))]" aria-hidden />
        )}
      </div>
    </li>
  );
});

export default RequirementRow;
