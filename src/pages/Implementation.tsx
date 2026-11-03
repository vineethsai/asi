import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/content/EmptyState";
import { SOURCES } from "@/data/sources";
import { useProgress } from "@/hooks/useProgress";
import { LifecycleView } from "@/components/lifecycle/LifecycleView";
import { CONTROL_LIST } from "@/components/controls/controlIndex";
import { PHASE_ORDER, phaseTaskIds } from "@/components/controls/phaseTasks";
import { controlCode } from "@/components/threats/threatIndex";

const ALL_TASKS = CONTROL_LIST.map((m) => ({
  id: m.id,
  tasks: PHASE_ORDER.flatMap((p) => phaseTaskIds(m, p)),
}));
const TASK_TOTAL = ALL_TASKS.reduce((n, c) => n + c.tasks.length, 0);

export default function Implementation() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const progress = useProgress((s) => s.controls);
  const done = useMemo(
    () => ALL_TASKS.reduce((n, c) => n + c.tasks.filter((t) => progress[c.id]?.has(t)).length, 0),
    [progress],
  );

  const controls = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return CONTROL_LIST;
    return CONTROL_LIST.filter((m) =>
      [controlCode(m.id), m.name, m.description, ...(m.tags ?? [])].some((s) =>
        s.toLowerCase().includes(needle),
      ),
    );
  }, [q]);

  const setQuery = (value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set("q", value);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  return (
    <PageLayout
      title="Lifecycle view"
      description="Every agentic AI security control laid out across the design, build and operations phases, with checklists that track your implementation progress."
      canonicalPath="/implementation"
      keywords="AI security implementation, secure AI development lifecycle, agent security controls, design build operations, AI security checklist"
    >
      <PageHeader
        eyebrow="Implementation"
        title="Lifecycle view"
        description="The controls in the order you apply them: decide in design, implement in build, sustain in operations. Pick a control in a phase to work through its tasks."
        source={SOURCES.controls}
        stats={[
          { label: "controls", value: CONTROL_LIST.length },
          {
            label: "phase tasks",
            value: TASK_TOTAL,
            hint: "Checklist items across all controls and phases.",
          },
          {
            label: "done",
            value: TASK_TOTAL ? `${Math.round((done / TASK_TOTAL) * 100)}%` : "0%",
            hint: `${done} of ${TASK_TOTAL} tasks checked in this browser.`,
          },
        ]}
        filters={
          <div className="relative w-full sm:w-72">
            <label htmlFor="lifecycle-search" className="sr-only">
              Filter controls
            </label>
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="lifecycle-search"
              type="search"
              placeholder="Filter controls…"
              value={q}
              onChange={(e) => setQuery(e.target.value)}
              className="h-9 pl-9"
            />
          </div>
        }
      />
      {controls.length ? (
        <LifecycleView controls={controls} />
      ) : (
        <EmptyState
          icon="filter"
          title="No controls match"
          description="Try a different search term."
          action={{ label: "Clear search", onClick: () => setQuery("") }}
        />
      )}
    </PageLayout>
  );
}
