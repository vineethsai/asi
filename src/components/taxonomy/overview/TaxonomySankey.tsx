import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Sankey } from "@/components/charts/Sankey";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CROSSWALK, CROSSWALK_GROUPS, type CrosswalkFramework } from "./crosswalkGraph";

export interface TaxonomySankeyProps {
  hiddenGroups: CrosswalkFramework[];
  onHiddenGroupsChange: (ids: CrosswalkFramework[]) => void;
  pinned: string | null;
  onPinChange: (id: string | null) => void;
  id?: string;
}

const GROUPS = CROSSWALK_GROUPS.map((g) => ({ id: g.id, label: g.label, color: g.color }));
const NODES = CROSSWALK.nodes.map((n) => ({
  id: n.id,
  label: n.label,
  group: n.group,
  href: n.href,
}));
const THREATS = CROSSWALK.nodes.filter((n) => n.group === "tm");

/**
 * Cross-framework Sankey (§6.8, §9): OWASP Agentic → OWASP T&M → Cisco → AIVSS → AIUC-1, ribbon
 * width = number of mapping statements, legend toggles hide frameworks, "threat focus" pins one
 * threat, click/Enter pins any node; the chart scrolls horizontally on narrow screens.
 */
export function TaxonomySankey({
  hiddenGroups,
  onHiddenGroupsChange,
  pinned,
  onPinChange,
  id,
}: TaxonomySankeyProps) {
  const pinnedNode = useMemo(() => CROSSWALK.nodes.find((n) => n.id === pinned), [pinned]);
  const connections = useMemo(() => {
    if (!pinned) return [];
    return CROSSWALK.links
      .filter((l) => l.source === pinned || l.target === pinned)
      .map((l) => {
        const other = CROSSWALK.nodes.find(
          (n) => n.id === (l.source === pinned ? l.target : l.source),
        );
        return other ? { node: other, value: l.value } : null;
      })
      .filter((x): x is NonNullable<typeof x> => !!x && !hiddenGroups.includes(x.node.group));
  }, [pinned, hiddenGroups]);

  const focusValue = pinned?.startsWith("tm:") ? pinned : "none";

  return (
    <div id={id} className="scroll-mt-24 space-y-3 rounded-lg">
      <Sankey
        title="Cross-framework flow"
        description="Ribbon width is the number of mapping statements in the data. Hover, focus or tap a node to trace it; click or press Enter to pin. Use the legend to hide a framework."
        ariaLabel="Sankey diagram of mappings between the OWASP Agentic Top 10, OWASP Agentic Threats and Mitigations, the Cisco AI taxonomy, OWASP AIVSS core risks and AIUC-1 principles"
        groups={GROUPS}
        nodes={NODES}
        links={CROSSWALK.links}
        hiddenGroups={hiddenGroups}
        onHiddenGroupsChange={(ids) => onHiddenGroupsChange(ids as CrosswalkFramework[])}
        pinnedId={pinned}
        onPinChange={onPinChange}
        valueLabel="mappings"
        minWidth={760}
        toolbar={
          <Select
            value={focusValue}
            onValueChange={(v) => {
              if (v === "none") return onPinChange(null);
              if (hiddenGroups.includes("tm"))
                onHiddenGroupsChange(hiddenGroups.filter((g) => g !== "tm"));
              onPinChange(v);
            }}
          >
            <SelectTrigger className="h-8 w-[15rem] text-xs" aria-label="Threat focus">
              <SelectValue placeholder="Threat focus" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Threat focus: all threats</SelectItem>
              {THREATS.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <div aria-live="polite" className="min-h-[1.5rem] text-sm">
        {pinnedNode ? (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border bg-muted/30 px-3 py-2">
            <span className="font-medium">{pinnedNode.label}</span>
            <span className="text-muted-foreground">
              {connections.length} connected {connections.length === 1 ? "entry" : "entries"} ·{" "}
              {connections.reduce((n, c) => n + c.value, 0)} mappings
            </span>
            <Link
              to={pinnedNode.href}
              className="ml-auto inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
            >
              Open {pinnedNode.code}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tip: pin a node to list its connections and open it.
          </p>
        )}
      </div>
    </div>
  );
}

export default TaxonomySankey;
