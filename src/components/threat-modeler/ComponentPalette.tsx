import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Plus,
  Brain,
  GitBranch,
  Lightbulb,
  Database,
  Wrench,
  Server,
  User,
  Globe,
  Shield,
  Box,
  FileText,
  FileSearch,
  Terminal,
  Mail,
  CreditCard,
  Eye,
  Pencil,
  Cpu,
  MousePointerClick,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  type PaletteGroup,
  type PaletteItem,
  type CustomComponentDefinition,
  type ToolAccessMode,
  type ToolRiskTier,
  type PromptType,
  MaestroLayer,
} from "./types";

export interface PaletteItemWithMeta extends PaletteItem {
  toolAccessMode?: ToolAccessMode;
  toolRiskTier?: ToolRiskTier;
  promptType?: PromptType;
}

const ICON_MAP: Record<string, React.ElementType> = {
  brain: Brain,
  "git-branch": GitBranch,
  lightbulb: Lightbulb,
  database: Database,
  wrench: Wrench,
  server: Server,
  user: User,
  globe: Globe,
  shield: Shield,
  box: Box,
  "file-text": FileText,
  "file-search": FileSearch,
  terminal: Terminal,
  mail: Mail,
  "credit-card": CreditCard,
  eye: Eye,
  pencil: Pencil,
  cpu: Cpu,
};

const BUILT_IN_GROUPS: PaletteGroup[] = [
  {
    id: "kc1",
    label: "KC1: AI Models",
    color: "#3b82f6",
    items: [
      {
        id: "kc1-llm",
        label: "LLM / Foundation Model",
        description: "Large Language Model",
        category: "kc1",
        componentId: "kc1",
        maestroLayers: [MaestroLayer.FoundationModels],
        icon: "brain",
        color: "#3b82f6",
        nodeType: "agentComponent",
      },
      {
        id: "kc1-embedding",
        label: "Embedding Model",
        description: "Text embedding model",
        category: "kc1",
        componentId: "kc1.2",
        maestroLayers: [MaestroLayer.FoundationModels],
        icon: "brain",
        color: "#3b82f6",
        nodeType: "agentComponent",
      },
    ],
  },
  {
    id: "kc2",
    label: "KC2: Agent Architecture",
    color: "#22c55e",
    items: [
      {
        id: "kc2-agent",
        label: "AI Agent",
        description: "Autonomous agent",
        category: "kc2",
        componentId: "kc2",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.AgentEcosystem],
        icon: "git-branch",
        color: "#22c55e",
        nodeType: "agentComponent",
      },
      {
        id: "kc2-orchestrator",
        label: "Orchestrator",
        description: "Multi-agent coordinator",
        category: "kc2",
        componentId: "kc2.2",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "git-branch",
        color: "#22c55e",
        nodeType: "agentComponent",
      },
    ],
  },
  {
    id: "kc3",
    label: "KC3: Agentic Patterns",
    color: "#eab308",
    items: [
      {
        id: "kc3-rag",
        label: "RAG Pipeline",
        description: "Retrieval-Augmented Generation",
        category: "kc3",
        componentId: "kc3",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "lightbulb",
        color: "#eab308",
        nodeType: "agentComponent",
      },
      {
        id: "kc3-cot",
        label: "Chain-of-Thought",
        description: "Reasoning chain",
        category: "kc3",
        componentId: "kc3.2",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "lightbulb",
        color: "#eab308",
        nodeType: "agentComponent",
      },
      {
        id: "kc3-prompt",
        label: "Prompt Template",
        description: "Reusable prompt template",
        category: "kc3",
        componentId: "kc3.3",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "file-text",
        color: "#eab308",
        nodeType: "agentComponent",
      },
      {
        id: "kc3-system-prompt",
        label: "System Prompt",
        description: "System-level instructions",
        category: "kc3",
        componentId: "kc3.5",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "file-text",
        color: "#eab308",
        nodeType: "agentComponent",
        promptType: "system",
      } as PaletteItemWithMeta,
      {
        id: "kc3-user-prompt",
        label: "User Prompt Template",
        description: "User input template",
        category: "kc3",
        componentId: "kc3.6",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "file-text",
        color: "#eab308",
        nodeType: "agentComponent",
        promptType: "user",
      } as PaletteItemWithMeta,
      {
        id: "kc3-few-shot",
        label: "Few-Shot Template",
        description: "Few-shot example prompt",
        category: "kc3",
        componentId: "kc3.7",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "lightbulb",
        color: "#eab308",
        nodeType: "agentComponent",
        promptType: "few-shot",
      } as PaletteItemWithMeta,
      {
        id: "kc3-fn-call",
        label: "Function Call Schema",
        description: "Function/tool call definition",
        category: "kc3",
        componentId: "kc3.8",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "terminal",
        color: "#eab308",
        nodeType: "agentComponent",
        promptType: "function-call",
      } as PaletteItemWithMeta,
      {
        id: "kc3-guardrail",
        label: "Guardrail / Safety Filter",
        description: "Input/output safety filter",
        category: "kc3",
        componentId: "kc3.4",
        maestroLayers: [MaestroLayer.SecurityCompliance, MaestroLayer.AgentFrameworks],
        icon: "shield",
        color: "#eab308",
        nodeType: "agentComponent",
      },
    ],
  },
  {
    id: "kc4",
    label: "KC4: Memory & Context",
    color: "#a855f7",
    items: [
      {
        id: "kc4-memory",
        label: "Memory Store",
        description: "Agent memory/context",
        category: "kc4",
        componentId: "kc4",
        maestroLayers: [MaestroLayer.DataOperations],
        icon: "database",
        color: "#a855f7",
        nodeType: "dataStore",
      },
      {
        id: "kc4-vectordb",
        label: "Vector Database",
        description: "Embedding vector store",
        category: "kc4",
        componentId: "kc4.3",
        maestroLayers: [MaestroLayer.DataOperations],
        icon: "database",
        color: "#a855f7",
        nodeType: "dataStore",
      },
      {
        id: "kc4-knowledge",
        label: "Knowledge Base",
        description: "Structured knowledge",
        category: "kc4",
        componentId: "kc4.5",
        maestroLayers: [MaestroLayer.DataOperations],
        icon: "database",
        color: "#a855f7",
        nodeType: "dataStore",
      },
    ],
  },
  {
    id: "kc5",
    label: "KC5: Tools & Capabilities",
    color: "#ec4899",
    items: [
      {
        id: "kc5-tool",
        label: "Tool / API",
        description: "External tool or API",
        category: "kc5",
        componentId: "kc5",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "wrench",
        color: "#ec4899",
        nodeType: "agentComponent",
      },
      {
        id: "kc5-mcp",
        label: "MCP Server",
        description: "Model Context Protocol server",
        category: "kc5",
        componentId: "kc5.3",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.AgentEcosystem],
        icon: "server",
        color: "#ec4899",
        nodeType: "agentComponent",
      },
    ],
  },
  {
    id: "kc5-ro",
    label: "KC5 Read-Only Tools",
    color: "#10b981",
    items: [
      {
        id: "kc5-file-reader",
        label: "File Reader",
        description: "Read-only file access",
        category: "kc5",
        componentId: "kc5.ro.1",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "file-search",
        color: "#10b981",
        nodeType: "agentComponent",
        toolAccessMode: "read-only",
        toolRiskTier: "benign",
      } as PaletteItemWithMeta,
      {
        id: "kc5-web-scraper",
        label: "Web Scraper",
        description: "Read-only web content retrieval",
        category: "kc5",
        componentId: "kc5.ro.2",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "eye",
        color: "#10b981",
        nodeType: "agentComponent",
        toolAccessMode: "read-only",
        toolRiskTier: "benign",
      } as PaletteItemWithMeta,
      {
        id: "kc5-search",
        label: "Search Tool",
        description: "Web/data search (read-only)",
        category: "kc5",
        componentId: "kc5.ro.3",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "file-search",
        color: "#10b981",
        nodeType: "agentComponent",
        toolAccessMode: "read-only",
        toolRiskTier: "benign",
      } as PaletteItemWithMeta,
      {
        id: "kc5-db-query",
        label: "Database Query (Read)",
        description: "Read-only database access",
        category: "kc5",
        componentId: "kc5.ro.4",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.DataOperations],
        icon: "database",
        color: "#10b981",
        nodeType: "agentComponent",
        toolAccessMode: "read-only",
        toolRiskTier: "benign",
      } as PaletteItemWithMeta,
    ],
  },
  {
    id: "kc5-rw",
    label: "KC5 Read-Write Tools",
    color: "#f59e0b",
    items: [
      {
        id: "kc5-db-rw",
        label: "Database (Read-Write)",
        description: "Full database access",
        category: "kc5",
        componentId: "kc5.rw.1",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.DataOperations],
        icon: "database",
        color: "#f59e0b",
        nodeType: "agentComponent",
        toolAccessMode: "read-write",
        toolRiskTier: "sensitive",
      } as PaletteItemWithMeta,
      {
        id: "kc5-file-mgr",
        label: "File Manager",
        description: "Read-write file system access",
        category: "kc5",
        componentId: "kc5.rw.2",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "pencil",
        color: "#f59e0b",
        nodeType: "agentComponent",
        toolAccessMode: "read-write",
        toolRiskTier: "sensitive",
      } as PaletteItemWithMeta,
      {
        id: "kc5-crm-api",
        label: "CRM API",
        description: "Customer data read-write",
        category: "kc5",
        componentId: "kc5.rw.3",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "wrench",
        color: "#f59e0b",
        nodeType: "agentComponent",
        toolAccessMode: "read-write",
        toolRiskTier: "sensitive",
      } as PaletteItemWithMeta,
    ],
  },
  {
    id: "kc5-exec",
    label: "KC5 Execute Tools",
    color: "#ef4444",
    items: [
      {
        id: "kc5-code-interpreter",
        label: "Code Interpreter",
        description: "Executes generated code",
        category: "kc5",
        componentId: "kc5.ex.1",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.DeploymentInfrastructure],
        icon: "terminal",
        color: "#ef4444",
        nodeType: "agentComponent",
        toolAccessMode: "execute",
        toolRiskTier: "destructive",
      } as PaletteItemWithMeta,
      {
        id: "kc5-shell",
        label: "Shell Executor",
        description: "Shell command execution",
        category: "kc5",
        componentId: "kc5.ex.2",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.DeploymentInfrastructure],
        icon: "terminal",
        color: "#ef4444",
        nodeType: "agentComponent",
        toolAccessMode: "execute",
        toolRiskTier: "destructive",
      } as PaletteItemWithMeta,
      {
        id: "kc5-sandbox",
        label: "Sandboxed Runtime",
        description: "Isolated code execution",
        category: "kc5",
        componentId: "kc5.ex.3",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.DeploymentInfrastructure],
        icon: "cpu",
        color: "#ef4444",
        nodeType: "agentComponent",
        toolAccessMode: "execute",
        toolRiskTier: "sensitive",
      } as PaletteItemWithMeta,
    ],
  },
  {
    id: "kc5-ext",
    label: "KC5 External APIs",
    color: "#dc2626",
    items: [
      {
        id: "kc5-email",
        label: "Email Sender",
        description: "Sends emails externally",
        category: "kc5",
        componentId: "kc5.ext.1",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "mail",
        color: "#dc2626",
        nodeType: "agentComponent",
        toolAccessMode: "write-only",
        toolRiskTier: "critical",
      } as PaletteItemWithMeta,
      {
        id: "kc5-payment",
        label: "Payment API",
        description: "Payment processing",
        category: "kc5",
        componentId: "kc5.ext.2",
        maestroLayers: [MaestroLayer.AgentFrameworks],
        icon: "credit-card",
        color: "#dc2626",
        nodeType: "agentComponent",
        toolAccessMode: "write-only",
        toolRiskTier: "critical",
      } as PaletteItemWithMeta,
      {
        id: "kc5-deploy",
        label: "Deployment Trigger",
        description: "Triggers deployments",
        category: "kc5",
        componentId: "kc5.ext.3",
        maestroLayers: [MaestroLayer.AgentFrameworks, MaestroLayer.DeploymentInfrastructure],
        icon: "server",
        color: "#dc2626",
        nodeType: "agentComponent",
        toolAccessMode: "execute",
        toolRiskTier: "critical",
      } as PaletteItemWithMeta,
    ],
  },
  {
    id: "kc6",
    label: "KC6: Infrastructure",
    color: "#6366f1",
    items: [
      {
        id: "kc6-infra",
        label: "Infrastructure",
        description: "Deployment infrastructure",
        category: "kc6",
        componentId: "kc6",
        maestroLayers: [MaestroLayer.DeploymentInfrastructure],
        icon: "server",
        color: "#6366f1",
        nodeType: "agentComponent",
      },
      {
        id: "kc6-runtime",
        label: "Runtime Environment",
        description: "Execution runtime",
        category: "kc6",
        componentId: "kc6.1",
        maestroLayers: [MaestroLayer.DeploymentInfrastructure],
        icon: "server",
        color: "#6366f1",
        nodeType: "agentComponent",
      },
    ],
  },
  {
    id: "dfd",
    label: "DFD Primitives",
    color: "#94a3b8",
    items: [
      {
        id: "dfd-user",
        label: "User / Actor",
        description: "Human user",
        category: "actor",
        maestroLayers: [MaestroLayer.AgentEcosystem],
        icon: "user",
        color: "#3b82f6",
        nodeType: "actor",
      },
      {
        id: "dfd-external",
        label: "External System",
        description: "Third-party service",
        category: "external",
        maestroLayers: [MaestroLayer.AgentEcosystem],
        icon: "globe",
        color: "#f97316",
        nodeType: "actor",
      },
      {
        id: "dfd-datastore",
        label: "Data Store",
        description: "Generic data storage",
        category: "datastore",
        maestroLayers: [MaestroLayer.DataOperations],
        icon: "database",
        color: "#a855f7",
        nodeType: "dataStore",
      },
      {
        id: "dfd-trust",
        label: "Trust Boundary",
        description: "Security boundary",
        category: "trust-boundary",
        maestroLayers: [MaestroLayer.SecurityCompliance],
        icon: "shield",
        color: "#ef4444",
        nodeType: "trustBoundary",
      },
    ],
  },
];

interface ComponentPaletteProps {
  customComponents: CustomComponentDefinition[];
  onCreateCustom: () => void;
  onAddComponent?: (item: PaletteItem) => void;
}

export default function ComponentPalette({
  customComponents,
  onCreateCustom,
  onAddComponent,
}: ComponentPaletteProps) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    kc1: true,
    kc2: true,
    dfd: true,
  });

  const toggle = (id: string) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredGroups = BUILT_IN_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.label.toLowerCase().includes(search.toLowerCase()) ||
        (item.description ?? "").toLowerCase().includes(search.toLowerCase()),
    ),
  })).filter((group) => group.items.length > 0);

  const customItems: PaletteItem[] = customComponents.map((c) => ({
    id: `custom-${c.id}`,
    label: c.name,
    description: c.description,
    category: "custom",
    maestroLayers: c.maestroLayers,
    icon: c.icon || "box",
    color: c.color || "#6b7280",
    nodeType: "customComponent",
  }));

  const filteredCustom = customItems.filter(
    (item) =>
      item.label.toLowerCase().includes(search.toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const onDragStart = (event: React.DragEvent, item: PaletteItem) => {
    event.dataTransfer.setData("application/reactflow-item", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleClickToAdd = (item: PaletteItem) => {
    if (onAddComponent) onAddComponent(item);
  };

  return (
    <div className="w-56 border-r bg-background/95 flex flex-col h-full">
      <div className="p-2 border-b space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
        <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={onCreateCustom}>
          <Plus className="h-3 w-3 mr-1" /> Create Custom
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-1.5 space-y-0.5">
          {filteredGroups.map((group) => (
            <div key={group.id}>
              <button
                onClick={() => toggle(group.id)}
                className="flex items-center gap-1 w-full text-left px-1.5 py-1 hover:bg-accent rounded text-xs font-semibold"
              >
                {expanded[group.id] ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span style={{ color: group.color }} className="truncate">
                  {group.label}
                </span>
                <span className="text-muted-foreground ml-auto text-[10px]">
                  {group.items.length}
                </span>
              </button>
              {expanded[group.id] && (
                <div className="ml-2 space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = ICON_MAP[item.icon] ?? Box;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded cursor-grab hover:bg-accent active:cursor-grabbing text-xs border border-transparent hover:border-border transition-all group/item"
                        title={item.description}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} />
                        <span className="truncate flex-1">{item.label}</span>
                        {onAddComponent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClickToAdd(item);
                            }}
                            className="hidden group-hover/item:flex h-4 w-4 items-center justify-center rounded bg-primary/10 hover:bg-primary/20 text-primary shrink-0"
                            aria-label={`Add ${item.label} to canvas`}
                            title="Click to add to canvas"
                          >
                            <MousePointerClick className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {(filteredCustom.length > 0 || customComponents.length > 0) && (
            <div>
              <button
                onClick={() => toggle("custom")}
                className="flex items-center gap-1 w-full text-left px-1.5 py-1 hover:bg-accent rounded text-xs font-semibold"
              >
                {expanded.custom ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
                <span className="text-slate-500 truncate">Custom Components</span>
                <span className="text-muted-foreground ml-auto text-[10px]">
                  {filteredCustom.length}
                </span>
              </button>
              {expanded.custom && (
                <div className="ml-2 space-y-0.5">
                  {filteredCustom.map((item) => {
                    const Icon = ICON_MAP[item.icon] ?? Box;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, item)}
                        className="flex items-center gap-1.5 px-1.5 py-1 rounded cursor-grab hover:bg-accent active:cursor-grabbing text-xs border border-dashed border-transparent hover:border-border transition-all group/item"
                        title={item.description}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: item.color }} />
                        <span className="truncate flex-1">{item.label}</span>
                        {onAddComponent && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClickToAdd(item);
                            }}
                            className="hidden group-hover/item:flex h-4 w-4 items-center justify-center rounded bg-primary/10 hover:bg-primary/20 text-primary shrink-0"
                            aria-label={`Add ${item.label} to canvas`}
                            title="Click to add to canvas"
                          >
                            <MousePointerClick className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
