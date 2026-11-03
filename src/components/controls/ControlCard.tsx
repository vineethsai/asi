/**
 * ControlCard — one control in the /controls grid: stretched title link, neutral
 * "Addresses risk" score, threat and AISVS chapter chips (their own links), task progress.
 */
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { threatsData, type Mitigation } from "@/components/components/securityData";
import { RiskScore } from "@/components/content/RiskScore";
import { useControlProgress } from "@/hooks/useProgress";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { compareThreatCodes, controlCode, threatLabel } from "@/components/threats/threatIndex";
import { citedRequirements, controlChapters } from "./controlIndex";
import { PHASE_ORDER, phaseTaskIds } from "./phaseTasks";

export interface ControlCardProps {
  control: Mitigation;
  className?: string;
  style?: CSSProperties;
}

const MAX_THREATS = 5;
const chip =
  "relative z-10 inline-flex h-6 items-center rounded border px-1.5 font-mono text-[11px] transition-colors hover:border-primary/50 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function ControlCard({ control, className, style }: ControlCardProps) {
  const { done } = useControlProgress(control.id);
  const taskIds = PHASE_ORDER.flatMap((p) => phaseTaskIds(control, p));
  const completed = taskIds.filter((id) => done.has(id)).length;
  const threats = control.threatIds
    .map((id) => threatsData[id])
    .filter(Boolean)
    .sort(compareThreatCodes);
  const chapters = controlChapters(control);
  const cited = citedRequirements(control).length;
  const tags = (control.tags ?? []).filter((t) => !t.startsWith("aisvs-")).slice(0, 3);

  return (
    <article
      className={cn(
        "card-hover group relative flex h-full flex-col rounded-lg border bg-card p-5 focus-within:ring-2 focus-within:ring-ring",
        className,
      )}
      style={style}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
            <Icon name={control.icon ?? "shield"} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {controlCode(control.id)}
            </span>
            <h3 className="text-base font-semibold leading-snug text-foreground">
              <Link
                to={`/controls/${control.id}`}
                className="outline-none after:absolute after:inset-0 after:content-[''] hover:underline"
              >
                {control.name}
              </Link>
            </h3>
          </div>
        </div>
        {typeof control.riskScore === "number" && (
          <RiskScore score={control.riskScore} showBar={false} className="shrink-0" />
        )}
      </div>

      <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {control.description}
      </p>

      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-muted-foreground">Mitigates</p>
        <ul className="flex flex-wrap gap-1">
          {threats.slice(0, MAX_THREATS).map((t) => (
            <li key={t.id}>
              <Link to={`/threats/${t.id}`} title={threatLabel(t)} className={chip}>
                {t.code}
                <span className="sr-only"> {threatLabel(t)}</span>
              </Link>
            </li>
          ))}
          {threats.length > MAX_THREATS && (
            <li className="inline-flex h-6 items-center px-1 text-[11px] text-muted-foreground">
              +{threats.length - MAX_THREATS}
            </li>
          )}
        </ul>
      </div>

      {chapters.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">
            AISVS 1.01 · {cited} requirement{cited === 1 ? "" : "s"} cited
          </p>
          <ul className="flex flex-wrap gap-1">
            {chapters.map((c) => (
              <li key={c}>
                <Link to={`/aisvs#${c}`} className={chip}>
                  {c}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t pt-3 text-[11px] text-muted-foreground">
        {tags.map((t) => (
          <span key={t} className="rounded-full border px-2 py-0.5">
            {t}
          </span>
        ))}
        <span className="ml-auto tabular-nums">
          {taskIds.length
            ? completed
              ? `${completed}/${taskIds.length} tasks done`
              : `${taskIds.length} tasks`
            : "Guidance only"}
        </span>
      </div>
    </article>
  );
}

export default ControlCard;
