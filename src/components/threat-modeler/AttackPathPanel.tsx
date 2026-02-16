import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight, ArrowRight, Target, Crosshair } from "lucide-react";
import type { AttackPath } from "./engine/attackPaths";
import type { CanvasNode } from "./types";

interface AttackPathPanelProps {
  paths: AttackPath[];
  nodes: CanvasNode[];
  onPathClick?: (path: AttackPath) => void;
}

const SEVERITY_COLORS = {
  critical: "border-red-500/40 bg-red-500/10",
  high: "border-orange-500/40 bg-orange-500/10",
  medium: "border-yellow-500/40 bg-yellow-500/10",
  low: "border-blue-500/40 bg-blue-500/10",
};
const BADGE_COLORS = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-500",
};

export default function AttackPathPanel({ paths, nodes, onPathClick }: AttackPathPanelProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (paths.length === 0) {
    return (
      <div className="p-3 text-xs text-muted-foreground text-center">
        No attack paths found. Add external actors and high-value targets to detect paths.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        <div className="flex items-center gap-1 mb-2">
          <Crosshair className="h-3.5 w-3.5 text-red-500" />
          <span className="text-xs font-bold">Attack Paths ({paths.length})</span>
        </div>
        {paths.map((path) => {
          const isExpanded = expanded.has(path.id);
          return (
            <div
              key={path.id}
              className={`border rounded-md overflow-hidden ${SEVERITY_COLORS[path.severity]}`}
            >
              <button
                onClick={() => {
                  toggle(path.id);
                  onPathClick?.(path);
                }}
                className="flex items-start gap-1.5 w-full text-left p-2"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 mt-0.5 shrink-0" />
                ) : (
                  <ChevronRight className="h-3 w-3 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[8px] px-1 py-0 rounded text-white font-bold ${BADGE_COLORS[path.severity]}`}
                    >
                      {path.severity.toUpperCase()}
                    </span>
                    <span className="text-[9px] text-muted-foreground">Score: {path.score}</span>
                  </div>
                  <p className="text-[11px] font-semibold mt-0.5 leading-tight truncate">
                    {path.name}
                  </p>
                </div>
              </button>
              {isExpanded && (
                <div className="px-2 pb-2 space-y-1.5 border-t border-current/5">
                  <p className="text-[10px] text-muted-foreground mt-1.5">{path.description}</p>
                  <div className="flex items-center gap-0.5 flex-wrap">
                    {path.nodes.map((nodeId, i) => {
                      const node = nodeMap.get(nodeId);
                      const isEntry = i === 0;
                      const isTarget = i === path.nodes.length - 1;
                      return (
                        <span key={i} className="flex items-center gap-0.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded ${isEntry ? "bg-orange-500/20 border border-orange-500/40" : isTarget ? "bg-red-500/20 border border-red-500/40" : "bg-background border"}`}
                          >
                            {isEntry && <Target className="h-2.5 w-2.5 inline mr-0.5" />}
                            {node?.data?.label ?? nodeId.slice(0, 8)}
                          </span>
                          {i < path.nodes.length - 1 && (
                            <ArrowRight className="h-2.5 w-2.5 text-muted-foreground" />
                          )}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-muted-foreground">
                    {path.threats.length} threats along this path
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
