import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type OnConnect,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type ReactFlowInstance,
  type NodeChange,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { toast } from "sonner";

import {
  type CanvasNode,
  type CanvasEdge,
  type CanvasNodeData,
  type CanvasEdgeData,
  type PaletteItem,
  type MethodologyMode,
  type AnalysisMode,
  type ThreatAnalysisResult,
  type CustomComponentDefinition,
  type GeneratedThreat,
  type ThreatBadge,
  type DataFlowMetadata,
  type TrustLevel,
  DEFAULT_EDGE_METADATA,
  MaestroLayer,
} from "./types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import AgentComponentNode from "./nodes/AgentComponentNode";
import ActorNode from "./nodes/ActorNode";
import DataStoreNode from "./nodes/DataStoreNode";
import TrustBoundaryNode from "./nodes/TrustBoundaryNode";
import CustomComponentNode from "./nodes/CustomComponentNode";
import DataFlowEdge from "./edges/DataFlowEdge";

import ComponentPalette from "./ComponentPalette";
import CanvasToolbar from "./CanvasToolbar";
import ThreatResultsPanel from "./ThreatResultsPanel";
import NodePropertiesPanel from "./NodePropertiesPanel";
import EdgeMetadataEditor from "./EdgeMetadataEditor";
import CustomComponentDialog from "./CustomComponentDialog";
import CanvasContextMenu from "./CanvasContextMenu";
import ModelManager from "./ModelManager";
import OnboardingOverlay from "./OnboardingOverlay";
import AibomImportDialog from "./AibomImportDialog";
import NodeEditorDialog from "./NodeEditorDialog";

import { runThreatAnalysis, buildNodeProfiles } from "./engine/threatEngine";
import { enrichThreatsWithSecurityData } from "./engine/dataIntegration";
import { calculateModelRisk, type ModelRiskSummary } from "./engine/riskScoring";
import { findAttackPaths, type AttackPath } from "./engine/attackPaths";
import { filterMitigatedThreats } from "./engine/mitigationCatalog";
import { runAISVSMapping, type AISVSCoverageResult } from "./engine/aisvsMapping";
import { runDataFlowComplianceCheck, type ComplianceViolation } from "./engine/dataFlowCompliance";
import { runComplianceGapAnalysis, type ComplianceGapReport } from "./engine/complianceGap";
import { calculateAttackSurface, type AttackSurfaceScore } from "./engine/attackSurface";
import { exportCanvasPNG, exportCanvasSVG } from "./export/exportPNG";
import { exportThreatsCSV } from "./export/exportCSV";
import { exportSARIF } from "./export/exportSARIF";
import { downloadMarkdownReport } from "./export/exportMarkdown";
import { ARCHITECTURE_TEMPLATES } from "./templates";

const nodeTypes: NodeTypes = {
  agentComponent: AgentComponentNode,
  actor: ActorNode,
  dataStore: DataStoreNode,
  trustBoundary: TrustBoundaryNode,
  customComponent: CustomComponentNode,
};
const edgeTypes: EdgeTypes = { dataFlow: DataFlowEdge };

let nodeIdCounter = 0;
function genNodeId() {
  return `node-${Date.now()}-${nodeIdCounter++}`;
}

interface HistoryEntry {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const AUTO_SAVE_KEY = "threat-modeler-autosave";
const ONBOARDING_KEY = "threat-modeler-onboarding-seen";

function autoLayout(nodes: CanvasNode[], edges: CanvasEdge[]): CanvasNode[] {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: "TB", nodesep: 60, ranksep: 80 });
  nodes.forEach((n) => {
    if (n.type !== "trustBoundary") g.setNode(n.id, { width: 180, height: 100 });
  });
  edges.forEach((e) => {
    if (g.hasNode(e.source) && g.hasNode(e.target)) g.setEdge(e.source, e.target);
  });
  Dagre.layout(g);
  return nodes.map((n) => {
    if (n.type === "trustBoundary") return n;
    const pos = g.node(n.id);
    return pos ? { ...n, position: { x: pos.x - 90, y: pos.y - 50 } } : n;
  });
}

function ThreatModelCanvasInner({ initialTemplate }: { initialTemplate?: string }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CanvasEdge>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<
    CanvasNode,
    CanvasEdge
  > | null>(null);
  const { fitView } = useReactFlow();

  const [methodology, setMethodology] = useState<MethodologyMode>("maestro");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("manual");
  const [analysisResult, setAnalysisResult] = useState<ThreatAnalysisResult | null>(null);
  const [riskSummary, setRiskSummary] = useState<ModelRiskSummary | null>(null);
  const [attackPaths, setAttackPaths] = useState<AttackPath[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [customComponents, setCustomComponents] = useState<CustomComponentDefinition[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("threat-modeler-custom-components") ?? "[]");
    } catch {
      return [];
    }
  });

  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [heatMapActive, setHeatMapActive] = useState(false);
  const [whatIfActive, setWhatIfActive] = useState(false);
  const [_whatIfNodeId, setWhatIfNodeId] = useState<string | null>(null);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem(ONBOARDING_KEY));
  const [modelManagerOpen, setModelManagerOpen] = useState(false);
  const [modelManagerMode, setModelManagerMode] = useState<"save" | "load">("save");
  const [saveIndicator, setSaveIndicator] = useState("");
  const [showMitigated, setShowMitigated] = useState(false);
  const [fullAnalysisResult, setFullAnalysisResult] = useState<ThreatAnalysisResult | null>(null);
  const [showAibomImport, setShowAibomImport] = useState(false);
  const [aisvsResult, setAisvsResult] = useState<AISVSCoverageResult | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [complianceViolations, setComplianceViolations] = useState<ComplianceViolation[]>([]);
  const [complianceGapReport, setComplianceGapReport] = useState<ComplianceGapReport | null>(null);
  const [attackSurfaceScores, setAttackSurfaceScores] = useState<AttackSurfaceScore[]>([]);
  const [whatIfResult, setWhatIfResult] = useState<{
    removedNodeLabel: string;
    beforeCount: number;
    afterCount: number;
    beforeRisk: number;
    afterRisk: number;
    eliminatedPaths: number;
  } | null>(null);

  const [history, setHistory] = useState<HistoryEntry[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (nodes.length > 0) {
        const data = JSON.stringify({
          nodes,
          edges,
          methodology,
          customComponents,
          timestamp: Date.now(),
        });
        localStorage.setItem(AUTO_SAVE_KEY, data);
        setSaveIndicator("Saved");
        setTimeout(() => setSaveIndicator(""), 2000);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [nodes, edges, methodology, customComponents]);

  // Restore auto-save on mount (skip if initial template will be loaded)
  useEffect(() => {
    if (initialTemplate) return;
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    if (saved && nodes.length === 0) {
      try {
        const data = JSON.parse(saved);
        if (data.nodes?.length > 0) {
          setNodes(data.nodes);
          setEdges(data.edges ?? []);
          if (data.methodology) setMethodology(data.methodology);
          toast.info("Restored previous session");
        }
      } catch {
        /* ignore */
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load template from URL parameter on mount
  useEffect(() => {
    if (!initialTemplate) return;
    const template = ARCHITECTURE_TEMPLATES.find((t) => t.id === initialTemplate);
    if (!template) return;
    const newNodes: CanvasNode[] = template.nodes.map((n, i) => ({
      ...n,
      id: `template-${initialTemplate}-${i}`,
    })) as CanvasNode[];
    const newEdges: CanvasEdge[] = template.edges.map((e, i) => {
      const edge = e as { source: string; target: string };
      return {
        ...e,
        id: `template-edge-${initialTemplate}-${i}`,
        source: `template-${initialTemplate}-${edge.source}`,
        target: `template-${initialTemplate}-${edge.target}`,
      } as CanvasEdge;
    });
    setNodes(newNodes);
    setEdges(newEdges);
    pushHistory(newNodes, newEdges);
    setTimeout(() => fitView({ duration: 300 }), 100);
    toast.success(`Loaded "${template.name}" architecture`);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem("threat-modeler-custom-components", JSON.stringify(customComponents));
  }, [customComponents]);

  const MAX_HISTORY = 50;

  const pushHistory = useCallback(
    (newNodes: CanvasNode[], newEdges: CanvasEdge[]) => {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
        setHistory((prev) => {
          const trimmed = prev.slice(0, historyIndex + 1);
          const next = [
            ...trimmed,
            {
              nodes: JSON.parse(JSON.stringify(newNodes)),
              edges: JSON.parse(JSON.stringify(newEdges)),
            },
          ];
          if (next.length > MAX_HISTORY) {
            const overflow = next.length - MAX_HISTORY;
            setHistoryIndex((i) => Math.max(0, i - overflow + 1));
            return next.slice(overflow);
          }
          setHistoryIndex(next.length - 1);
          return next;
        });
      }, 300);
    },
    [historyIndex],
  );

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    setNodes(prev.nodes);
    setEdges(prev.edges);
    setHistoryIndex((i) => i - 1);
  }, [history, historyIndex, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    setNodes(next.nodes);
    setEdges(next.edges);
    setHistoryIndex((i) => i + 1);
  }, [history, historyIndex, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge: CanvasEdge = {
        ...connection,
        id: `edge-${Date.now()}`,
        type: "dataFlow",
        data: { ...DEFAULT_EDGE_METADATA, threats: [] } as CanvasEdgeData,
      } as CanvasEdge;
      setEdges((eds) => addEdge(newEdge, eds) as CanvasEdge[]);
      setEditingEdgeId(newEdge.id);
      pushHistory(nodes, [...edges, newEdge]);
      toast.success("Connection created - edit metadata");
    },
    [setEdges, nodes, edges, pushHistory],
  );

  const doAnalysis = useCallback(() => {
    setIsAnalyzing(true);
    requestAnimationFrame(() => {
      try {
        const customThreats: GeneratedThreat[] = [];
        for (const node of nodes) {
          if (node.data?.isCustom && node.data.customThreatIds) {
            for (const cc of customComponents) {
              for (const ct of cc.customThreats ?? []) {
                if (node.data.customThreatIds.includes(ct.id)) {
                  customThreats.push({
                    id: `custom-${ct.id}-${node.id}`,
                    threatId: ct.id,
                    name: ct.name,
                    description: ct.description,
                    severity:
                      ct.severity === "high" ? "high" : ct.severity === "low" ? "low" : "medium",
                    methodology: "custom",
                    maestroLayer: ct.maestroLayer,
                    affectedNodeIds: [node.id],
                    affectedEdgeIds: [],
                    inherited: false,
                    mitigations: ct.mitigations ?? [],
                  });
                }
              }
            }
          }
        }

        let result = runThreatAnalysis(
          nodes as CanvasNode[],
          edges as CanvasEdge[],
          methodology,
          customThreats.length > 0 ? customThreats : undefined,
        );
        const profiles = buildNodeProfiles(nodes as CanvasNode[]);

        result = {
          ...result,
          threats: enrichThreatsWithSecurityData(result.threats),
          summary: { ...result.summary, mitigated: 0 },
        };
        setFullAnalysisResult(result);
        setAnalysisResult(result);

        const risk = calculateModelRisk(
          nodes as CanvasNode[],
          edges as CanvasEdge[],
          result,
          profiles,
        );
        setRiskSummary(risk);

        const paths = findAttackPaths(
          nodes as CanvasNode[],
          edges as CanvasEdge[],
          result.threats,
          profiles,
        );
        setAttackPaths(paths);

        const aisvsCoverage = runAISVSMapping(result.threats);
        setAisvsResult(aisvsCoverage);

        const dfcViolations = runDataFlowComplianceCheck(
          nodes as CanvasNode[],
          edges as CanvasEdge[],
          profiles,
        );
        setComplianceViolations(dfcViolations);

        const gapReport = runComplianceGapAnalysis(
          nodes as CanvasNode[],
          edges as CanvasEdge[],
          result.threats,
          profiles,
        );
        setComplianceGapReport(gapReport);

        const surfaceScores = calculateAttackSurface(
          nodes as CanvasNode[],
          edges as CanvasEdge[],
          profiles,
        );
        setAttackSurfaceScores(surfaceScores);

        const threatsByNode = new Map<string, ThreatBadge[]>();
        const threatsByEdge = new Map<string, ThreatBadge[]>();
        for (const threat of result.threats) {
          const badge: ThreatBadge = {
            threatId: threat.id,
            name: threat.name,
            severity:
              threat.severity === "critical"
                ? "high"
                : (threat.severity as "high" | "medium" | "low"),
            inherited: threat.inherited,
            source: threat.sourceNodeId,
          };
          for (const nId of threat.affectedNodeIds) {
            if (!threatsByNode.has(nId)) threatsByNode.set(nId, []);
            threatsByNode.get(nId)!.push(badge);
          }
          for (const eId of threat.affectedEdgeIds) {
            if (!threatsByEdge.has(eId)) threatsByEdge.set(eId, []);
            threatsByEdge.get(eId)!.push(badge);
          }
        }
        setNodes(
          (nds) =>
            nds.map((n) => ({
              ...n,
              data: { ...n.data, threats: threatsByNode.get(n.id) ?? [] },
            })) as CanvasNode[],
        );
        setEdges(
          (eds) =>
            eds.map((e) => ({
              ...e,
              data: { ...e.data, threats: threatsByEdge.get(e.id!) ?? [] },
            })) as CanvasEdge[],
        );
        setIsAnalyzing(false);
        if (analysisModeRef.current !== "live") {
          const violationMsg =
            dfcViolations.length > 0 ? `, ${dfcViolations.length} compliance violations` : "";
          toast.success(`Analysis complete - ${result.summary.total} threats found${violationMsg}`);
        }
      } catch (err) {
        setIsAnalyzing(false);
        const message = err instanceof Error ? err.message : "Unknown error";
        toast.error(`Analysis failed: ${message}`);
        console.error("Threat analysis error:", err);
      }
    });
  }, [nodes, edges, methodology, customComponents, setNodes, setEdges]);

  const analysisModeRef = useRef(analysisMode);
  analysisModeRef.current = analysisMode;

  const doAnalysisRef = useRef(doAnalysis);
  doAnalysisRef.current = doAnalysis;

  // Structural fingerprint: only changes when model topology/metadata changes,
  // NOT when threat badges, mitigations, or positions update.
  const modelStructureKey = useMemo(() => {
    const nodeKey = nodes
      .map(
        (n) =>
          `${n.id}:${n.type}:${n.data?.label}:${n.data?.category}:${n.data?.trustLevel}:${(n.data?.maestroLayers ?? []).join("+")}`,
      )
      .sort()
      .join("|");
    const edgeKey = edges
      .map((e) => {
        const d = e.data;
        return `${e.id}:${e.source}:${e.target}:${d?.protocol}:${d?.encrypted}:${d?.authentication}:${d?.dataClassification}`;
      })
      .sort()
      .join("|");
    return `${nodeKey}::${edgeKey}::${methodology}`;
  }, [nodes, edges, methodology]);

  useEffect(() => {
    if (analysisMode !== "live") return;
    // Guard: don't run on empty canvas
    if (modelStructureKey === `::::${methodology}`) return;
    const timeout = setTimeout(() => doAnalysisRef.current(), 800);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisMode, modelStructureKey]);

  const deleteSelected = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const selectedEdges = edges.filter((e) => e.selected);
    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      if (selectedNodeId) {
        setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId) as CanvasNode[]);
        setSelectedNodeId(null);
      }
      if (selectedEdgeId) {
        setEdges((eds) => eds.filter((e) => e.id !== selectedEdgeId) as CanvasEdge[]);
        setSelectedEdgeId(null);
      }
    } else {
      const nodeIds = new Set(selectedNodes.map((n) => n.id));
      setNodes((nds) => nds.filter((n) => !nodeIds.has(n.id)) as CanvasNode[]);
      const edgeIds = new Set(selectedEdges.map((e) => e.id));
      setEdges(
        (eds) =>
          eds.filter(
            (e) => !edgeIds.has(e.id!) && !nodeIds.has(e.source) && !nodeIds.has(e.target),
          ) as CanvasEdge[],
      );
    }
    pushHistory(nodes, edges);
  }, [nodes, edges, selectedNodeId, selectedEdgeId, setNodes, setEdges, pushHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput =
        (e.target as HTMLElement)?.tagName === "INPUT" ||
        (e.target as HTMLElement)?.tagName === "TEXTAREA";
      if (isInput) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          undo();
        }
        if (e.key === "y") {
          e.preventDefault();
          redo();
        }
        if (e.key === "e") {
          e.preventDefault();
          doAnalysis();
        }
        if (e.key === "s") {
          e.preventDefault();
          const data = JSON.stringify({
            nodes,
            edges,
            methodology,
            customComponents,
            timestamp: Date.now(),
          });
          localStorage.setItem(AUTO_SAVE_KEY, data);
          toast.success("Model saved");
          setSaveIndicator("Saved");
          setTimeout(() => setSaveIndicator(""), 2000);
        }
        if (e.key === "a") {
          e.preventDefault();
          setNodes((nds) => nds.map((n) => ({ ...n, selected: true })) as CanvasNode[]);
        }
      }
      if (e.key === "?") setShowOnboarding(true);
      if (e.key === " " && !isInput) {
        e.preventDefault();
        fitView({ duration: 300 });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    undo,
    redo,
    doAnalysis,
    deleteSelected,
    nodes,
    edges,
    methodology,
    customComponents,
    fitView,
    setNodes,
  ]);

  const duplicateSelected = useCallback(() => {
    if (!selectedNodeId) return;
    const original = nodes.find((n) => n.id === selectedNodeId);
    if (!original) return;
    const newNode: CanvasNode = {
      ...JSON.parse(JSON.stringify(original)),
      id: genNodeId(),
      position: { x: original.position.x + 30, y: original.position.y + 30 },
      selected: false,
    };
    setNodes((nds) => [...nds, newNode] as CanvasNode[]);
    pushHistory([...nodes, newNode], edges);
    toast.success("Node duplicated");
  }, [selectedNodeId, nodes, edges, setNodes, pushHistory]);

  const changeTrustLevel = useCallback(
    (level: TrustLevel) => {
      if (!selectedNodeId) return;
      setNodes(
        (nds) =>
          nds.map((n) =>
            n.id === selectedNodeId ? { ...n, data: { ...n.data, trustLevel: level } } : n,
          ) as CanvasNode[],
      );
      pushHistory(nodes, edges);
    },
    [selectedNodeId, nodes, edges, setNodes, pushHistory],
  );

  const addTrustBoundary = useCallback(() => {
    const newNode: CanvasNode = {
      id: genNodeId(),
      type: "trustBoundary",
      position: { x: 100, y: 100 },
      style: { width: 300, height: 200 },
      data: {
        label: "Trust Boundary",
        category: "trust-boundary",
        maestroLayers: [MaestroLayer.SecurityCompliance],
        trustLevel: "trusted",
        threats: [],
      } as CanvasNodeData,
    };
    setNodes((nds) => [...nds, newNode] as CanvasNode[]);
    pushHistory([...nodes, newNode], edges);
  }, [nodes, edges, setNodes, pushHistory]);

  const groupInBoundary = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    const targetNodes =
      selectedNodes.length > 0
        ? selectedNodes
        : selectedNodeId
          ? nodes.filter((n) => n.id === selectedNodeId)
          : [];
    if (targetNodes.length === 0) return;

    const minX = Math.min(...targetNodes.map((n) => n.position.x));
    const minY = Math.min(...targetNodes.map((n) => n.position.y));
    const maxX = Math.max(...targetNodes.map((n) => n.position.x + 180));
    const maxY = Math.max(...targetNodes.map((n) => n.position.y + 100));

    const boundaryId = genNodeId();
    const boundary: CanvasNode = {
      id: boundaryId,
      type: "trustBoundary",
      position: { x: minX - 30, y: minY - 50 },
      style: { width: maxX - minX + 60, height: maxY - minY + 80 },
      data: {
        label: "Trust Boundary",
        category: "trust-boundary",
        maestroLayers: [MaestroLayer.SecurityCompliance],
        trustLevel: "trusted",
        threats: [],
      } as CanvasNodeData,
    };

    const targetIds = new Set(targetNodes.map((n) => n.id));
    setNodes((nds) => {
      const updated = nds.map((n) => {
        if (targetIds.has(n.id)) {
          return {
            ...n,
            parentId: boundaryId,
            position: {
              x: n.position.x - boundary.position.x,
              y: n.position.y - boundary.position.y,
            },
          };
        }
        return n;
      }) as CanvasNode[];
      return [boundary, ...updated];
    });
    pushHistory(nodes, edges);
  }, [selectedNodeId, nodes, edges, setNodes, pushHistory]);

  const handleAutoLayout = useCallback(() => {
    const laid = autoLayout(nodes as CanvasNode[], edges as CanvasEdge[]);
    setNodes(laid as CanvasNode[]);
    pushHistory(laid, edges);
    setTimeout(() => fitView({ duration: 300 }), 50);
    toast.success("Layout applied");
  }, [nodes, edges, setNodes, pushHistory, fitView]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const itemData = event.dataTransfer.getData("application/reactflow-item");
      if (!itemData || !reactFlowInstance) return;
      const item: PaletteItem = JSON.parse(itemData);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const isCustom = item.category === "custom";
      const customComp = isCustom
        ? customComponents.find((c) => `custom-${c.id}` === item.id)
        : undefined;
      const itemAny = item as unknown as Record<string, unknown>;
      const newNode: CanvasNode = {
        id: genNodeId(),
        type: item.nodeType,
        position,
        data: {
          label: item.label,
          description: item.description,
          category: item.category,
          componentId: item.componentId,
          maestroLayers: item.maestroLayers,
          trustLevel: customComp?.trustLevel ?? "semi-trusted",
          icon: item.icon,
          color: item.color,
          threats: [],
          isCustom,
          customThreatIds: customComp?.customThreats?.map((t) => t.id),
          toolAccessMode: itemAny.toolAccessMode as CanvasNodeData["toolAccessMode"],
          toolRiskTier: itemAny.toolRiskTier as CanvasNodeData["toolRiskTier"],
          promptType: itemAny.promptType as CanvasNodeData["promptType"],
        } as CanvasNodeData,
      };
      setNodes((nds) => [...nds, newNode] as CanvasNode[]);
      pushHistory([...nodes, newNode], edges);
    },
    [reactFlowInstance, setNodes, nodes, edges, pushHistory, customComponents],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: CanvasNode) => {
      if (whatIfActive) {
        setWhatIfNodeId(node.id);
        const nodeLabel = (node.data as CanvasNodeData)?.label ?? "Unknown";
        toast.info(`What-If: simulating removal of "${nodeLabel}"...`);

        const filteredNodes = nodes.filter((n) => n.id !== node.id) as CanvasNode[];
        const filteredEdges = edges.filter(
          (e) => e.source !== node.id && e.target !== node.id,
        ) as CanvasEdge[];

        const beforeThreatCount = analysisResult?.summary.total ?? 0;
        const beforeRiskScore = riskSummary?.overallScore ?? 0;
        const beforePathCount = attackPaths.length;

        const simCustomThreats: GeneratedThreat[] = [];
        for (const n of filteredNodes) {
          if (n.data?.isCustom && n.data.customThreatIds) {
            for (const cc of customComponents) {
              for (const ct of cc.customThreats ?? []) {
                if (n.data.customThreatIds.includes(ct.id)) {
                  simCustomThreats.push({
                    id: `custom-${ct.id}-${n.id}`,
                    threatId: ct.id,
                    name: ct.name,
                    description: ct.description,
                    severity:
                      ct.severity === "high" ? "high" : ct.severity === "low" ? "low" : "medium",
                    methodology: "custom",
                    maestroLayer: ct.maestroLayer,
                    affectedNodeIds: [n.id],
                    affectedEdgeIds: [],
                    inherited: false,
                    mitigations: ct.mitigations ?? [],
                  });
                }
              }
            }
          }
        }
        const simProfiles = buildNodeProfiles(filteredNodes);
        const simResult = runThreatAnalysis(
          filteredNodes,
          filteredEdges,
          methodology,
          simCustomThreats.length > 0 ? simCustomThreats : undefined,
        );
        const simRisk = calculateModelRisk(filteredNodes, filteredEdges, simResult, simProfiles);
        const simPaths = findAttackPaths(
          filteredNodes,
          filteredEdges,
          simResult.threats,
          simProfiles,
        );

        setWhatIfResult({
          removedNodeLabel: nodeLabel,
          beforeCount: beforeThreatCount,
          afterCount: simResult.summary.total,
          beforeRisk: beforeRiskScore,
          afterRisk: simRisk.overallScore,
          eliminatedPaths: beforePathCount - simPaths.length,
        });
        return;
      }
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    },
    [
      whatIfActive,
      nodes,
      edges,
      methodology,
      analysisResult,
      riskSummary,
      attackPaths,
      customComponents,
    ],
  );

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: CanvasEdge) => {
    setSelectedEdgeId(edge.id ?? null);
    setSelectedNodeId(null);
  }, []);
  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }, []);

  const onNodeDoubleClick = useCallback((_: React.MouseEvent, node: CanvasNode) => {
    setEditingNodeId(node.id);
  }, []);

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange<CanvasNode>[]) => {
      onNodesChange(changes);
      const hasMoves = changes.some(
        (c) => c.type === "position" && (c as { dragging?: boolean }).dragging === false,
      );
      const hasRemoves = changes.some((c) => c.type === "remove");
      if (hasMoves || hasRemoves) pushHistory(nodes, edges);
    },
    [onNodesChange, pushHistory, nodes, edges],
  );

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );
  const selectedEdge = useMemo(
    () => edges.find((e) => e.id === selectedEdgeId) ?? null,
    [edges, selectedEdgeId],
  );
  const editingEdge = useMemo(
    () => edges.find((e) => e.id === editingEdgeId) ?? null,
    [edges, editingEdgeId],
  );

  const handleSaveEdgeMetadata = useCallback(
    (metadata: DataFlowMetadata) => {
      if (!editingEdgeId) return;
      setEdges(
        (eds) =>
          eds.map((e) =>
            e.id === editingEdgeId
              ? { ...e, data: { ...e.data, ...metadata } as CanvasEdgeData }
              : e,
          ) as CanvasEdge[],
      );
    },
    [editingEdgeId, setEdges],
  );

  const handleSaveCustomComponent = useCallback((comp: CustomComponentDefinition) => {
    setCustomComponents((prev) => {
      const i = prev.findIndex((c) => c.id === comp.id);
      if (i >= 0) {
        const u = [...prev];
        u[i] = comp;
        return u;
      }
      return [...prev, comp];
    });
  }, []);

  const loadTemplate = useCallback(
    (templateId: string) => {
      const template = ARCHITECTURE_TEMPLATES.find((t) => t.id === templateId);
      if (!template) return;
      const newNodes: CanvasNode[] = template.nodes.map((n, i) => ({
        ...n,
        id: `template-${templateId}-${i}`,
      })) as CanvasNode[];
      const newEdges: CanvasEdge[] = template.edges.map((e, i) => {
        const edge = e as { source: string; target: string };
        return {
          ...e,
          id: `template-edge-${templateId}-${i}`,
          source: `template-${templateId}-${edge.source}`,
          target: `template-${templateId}-${edge.target}`,
        } as CanvasEdge;
      });
      setNodes(newNodes);
      setEdges(newEdges);
      pushHistory(newNodes, newEdges);
      setTimeout(() => fitView({ duration: 300 }), 100);
      toast.success(`Loaded "${template.name}" template`);
    },
    [setNodes, setEdges, pushHistory, fitView],
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const doClearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setAnalysisResult(null);
    setRiskSummary(null);
    setAttackPaths([]);
    pushHistory([], []);
    setShowClearConfirm(false);
    toast.info("Canvas cleared");
  }, [setNodes, setEdges, pushHistory]);

  const clearCanvas = useCallback(() => {
    if (nodes.length === 0) return;
    setShowClearConfirm(true);
  }, [nodes.length]);

  const exportJSON = useCallback(() => {
    const data = {
      nodes,
      edges,
      analysisResult,
      methodology,
      customComponents,
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threat-model-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported");
  }, [nodes, edges, analysisResult, methodology, customComponents]);

  const [pendingImport, setPendingImport] = useState<{
    nodes: CanvasNode[];
    edges: CanvasEdge[];
    analysisResult?: ThreatAnalysisResult;
    methodology?: MethodologyMode;
    customComponents?: CustomComponentDefinition[];
  } | null>(null);

  const applyImport = useCallback(() => {
    if (!pendingImport) return;
    if (pendingImport.nodes) setNodes(pendingImport.nodes);
    if (pendingImport.edges) setEdges(pendingImport.edges);
    if (pendingImport.analysisResult) setAnalysisResult(pendingImport.analysisResult);
    if (pendingImport.methodology) setMethodology(pendingImport.methodology);
    if (pendingImport.customComponents) setCustomComponents(pendingImport.customComponents);
    pushHistory(pendingImport.nodes ?? [], pendingImport.edges ?? []);
    setPendingImport(null);
    toast.success("Model imported");
  }, [pendingImport, setNodes, setEdges, pushHistory]);

  const importJSON = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!Array.isArray(data.nodes)) {
            toast.error("Import failed: 'nodes' must be an array");
            return;
          }
          const validNodes = data.nodes.every(
            (n: Record<string, unknown>) => n.id && n.type && n.position && n.data,
          );
          if (!validNodes) {
            toast.error("Import failed: each node must have id, type, position, and data");
            return;
          }
          if (data.edges && !Array.isArray(data.edges)) {
            toast.error("Import failed: 'edges' must be an array");
            return;
          }
          const nodeIds = new Set((data.nodes as { id: string }[]).map((n) => n.id));
          const invalidEdges = (data.edges ?? []).filter(
            (e: { source: string; target: string }) =>
              !nodeIds.has(e.source) || !nodeIds.has(e.target),
          );
          if (invalidEdges.length > 0) {
            toast.error(
              `Import failed: ${invalidEdges.length} edge(s) reference non-existent nodes`,
            );
            return;
          }
          if (nodes.length > 0) {
            setPendingImport(data);
          } else {
            if (data.nodes) setNodes(data.nodes);
            if (data.edges) setEdges(data.edges);
            if (data.analysisResult) setAnalysisResult(data.analysisResult);
            if (data.methodology) setMethodology(data.methodology);
            if (data.customComponents) setCustomComponents(data.customComponents);
            pushHistory(data.nodes ?? [], data.edges ?? []);
            toast.success("Model imported");
          }
        } catch {
          toast.error("Import failed: invalid JSON format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges, nodes.length, pushHistory]);

  const handleExportPNG = useCallback(async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) {
      toast.error("Canvas not found");
      return;
    }
    try {
      await exportCanvasPNG(el);
      toast.success("PNG exported");
    } catch {
      toast.error("PNG export failed");
    }
  }, []);

  const handleExportSVG = useCallback(async () => {
    const el = document.querySelector(".react-flow") as HTMLElement;
    if (!el) {
      toast.error("Canvas not found");
      return;
    }
    try {
      await exportCanvasSVG(el);
      toast.success("SVG exported");
    } catch {
      toast.error("SVG export failed");
    }
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!analysisResult) {
      toast.error("Run analysis first");
      return;
    }
    exportThreatsCSV(analysisResult);
    toast.success("CSV exported");
  }, [analysisResult]);

  const handleExportSARIF = useCallback(() => {
    if (!analysisResult) {
      toast.error("Run analysis first");
      return;
    }
    exportSARIF(analysisResult);
    toast.success("SARIF exported");
  }, [analysisResult]);

  const handleExportMarkdown = useCallback(() => {
    if (!analysisResult) {
      toast.error("Run analysis first");
      return;
    }
    downloadMarkdownReport(nodes as CanvasNode[], edges as CanvasEdge[], analysisResult, {
      riskSummary,
      attackPaths,
      aisvsResult,
    });
    toast.success("Markdown report exported");
  }, [analysisResult, nodes, edges, riskSummary, attackPaths, aisvsResult]);

  const handleSaveModel = useCallback((name: string, description: string) => {
    toast.success(`Model "${name}" saved${description ? ` - ${description}` : ""}`);
  }, []);
  const handleLoadModel = useCallback(
    (data: string) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.nodes) setNodes(parsed.nodes);
        if (parsed.edges) setEdges(parsed.edges);
        if (parsed.methodology) setMethodology(parsed.methodology);
        toast.success("Model loaded");
      } catch {
        toast.error("Failed to load model");
      }
    },
    [setNodes, setEdges],
  );

  const onThreatClick = useCallback(
    (threat: GeneratedThreat) => {
      const nodeIds = new Set(threat.affectedNodeIds);
      const edgeIds = new Set(threat.affectedEdgeIds);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: nodeIds.has(n.id) })) as CanvasNode[]);
      setEdges((eds) => eds.map((e) => ({ ...e, selected: edgeIds.has(e.id!) })) as CanvasEdge[]);
      if (threat.affectedNodeIds.length > 0) {
        const targetNodes = nodes.filter((n) => nodeIds.has(n.id));
        if (targetNodes.length > 0) fitView({ nodes: targetNodes, duration: 500, padding: 0.3 });
      }
    },
    [nodes, setNodes, setEdges, fitView],
  );

  const miniMapNodeColor = useCallback(
    (n: { data: Record<string, unknown> }) => {
      const nd = n.data as unknown as CanvasNodeData;
      if (heatMapActive && nd?.threats?.length) {
        const hasHigh = nd.threats.some((t: ThreatBadge) => t.severity === "high");
        return hasHigh ? "#ef4444" : nd.threats.length > 2 ? "#f97316" : "#eab308";
      }
      if (nd?.threats?.length > 0) return "#ef4444";
      return "#6b7280";
    },
    [heatMapActive],
  );

  const currentModelData = useMemo(
    () => JSON.stringify({ nodes, edges, methodology, customComponents }),
    [nodes, edges, methodology, customComponents],
  );

  const handleDismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    localStorage.setItem(ONBOARDING_KEY, "true");
  }, []);

  const handleSaveNodeEdits = useCallback(
    (nodeId: string, updates: Partial<CanvasNodeData>) => {
      setNodes(
        (nds) =>
          nds.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n,
          ) as CanvasNode[],
      );
      pushHistory(nodes, edges);
    },
    [setNodes, nodes, edges, pushHistory],
  );

  const handleAddComponentFromPalette = useCallback(
    (item: PaletteItem) => {
      const viewport = reactFlowInstance?.getViewport();
      const centerX = viewport ? (-viewport.x + 400) / (viewport.zoom || 1) : 300;
      const centerY = viewport ? (-viewport.y + 300) / (viewport.zoom || 1) : 200;
      const itemAny = item as unknown as Record<string, unknown>;
      const isCustom = item.category === "custom";
      const customComp = isCustom
        ? customComponents.find((c) => `custom-${c.id}` === item.id)
        : undefined;
      const newNode: CanvasNode = {
        id: genNodeId(),
        type: item.nodeType,
        position: { x: centerX, y: centerY },
        data: {
          label: item.label,
          description: item.description,
          category: item.category,
          componentId: item.componentId,
          maestroLayers: item.maestroLayers,
          trustLevel: customComp?.trustLevel ?? "semi-trusted",
          icon: item.icon,
          color: item.color,
          threats: [],
          isCustom,
          customThreatIds: customComp?.customThreats?.map((t) => t.id),
          toolAccessMode: itemAny.toolAccessMode as CanvasNodeData["toolAccessMode"],
          toolRiskTier: itemAny.toolRiskTier as CanvasNodeData["toolRiskTier"],
          promptType: itemAny.promptType as CanvasNodeData["promptType"],
        } as CanvasNodeData,
      };
      setNodes((nds) => [...nds, newNode] as CanvasNode[]);
      pushHistory([...nodes, newNode], edges);
      toast.success(`Added "${item.label}" to canvas`);
    },
    [reactFlowInstance, customComponents, setNodes, nodes, edges, pushHistory],
  );

  const handleAibomImport = useCallback(
    (importedNodes: CanvasNode[], importedEdges: CanvasEdge[]) => {
      const laid = autoLayout(importedNodes, importedEdges);
      setNodes(laid);
      setEdges(importedEdges);
      pushHistory(laid, importedEdges);
      setTimeout(() => {
        fitView({ duration: 300 });
        doAnalysis();
      }, 150);
      toast.success(
        `Imported ${importedNodes.length} components and ${importedEdges.length} connections from AIBOM`,
      );
    },
    [setNodes, setEdges, pushHistory, fitView, doAnalysis],
  );

  const handleToggleMitigation = useCallback(
    (nodeId: string, mitigationId: string, applied: boolean) => {
      setNodes(
        (nds) =>
          nds.map((n) => {
            if (n.id !== nodeId) return n;
            const current = n.data?.appliedMitigations ?? [];
            const updated = applied
              ? [...new Set([...current, mitigationId])]
              : current.filter((m) => m !== mitigationId);
            const statuses = { ...(n.data?.mitigationStatuses ?? {}) };
            if (applied) {
              statuses[mitigationId] = { status: "implemented" };
            } else {
              delete statuses[mitigationId];
            }
            return {
              ...n,
              data: { ...n.data, appliedMitigations: updated, mitigationStatuses: statuses },
            } as CanvasNode;
          }) as CanvasNode[],
      );
    },
    [setNodes],
  );

  const handleMitigationStatusChange = useCallback(
    (
      nodeId: string,
      mitigationId: string,
      status: import("./types").MitigationStatusValue,
      justification?: string,
    ) => {
      setNodes(
        (nds) =>
          nds.map((n) => {
            if (n.id !== nodeId) return n;
            const statuses = { ...(n.data?.mitigationStatuses ?? {}) };
            if (status === "not-started") {
              delete statuses[mitigationId];
            } else {
              statuses[mitigationId] = { status, justification };
            }
            const appliedIds = Object.entries(statuses)
              .filter(
                ([, s]) =>
                  s.status === "implemented" ||
                  s.status === "in-progress" ||
                  s.status === "accepted-risk",
              )
              .map(([id]) => id);
            return {
              ...n,
              data: { ...n.data, mitigationStatuses: statuses, appliedMitigations: appliedIds },
            } as CanvasNode;
          }) as CanvasNode[],
      );
    },
    [setNodes],
  );

  // Recompute risk score reactively based on actual mitigation progress
  const effectiveRiskSummary = useMemo(() => {
    if (!riskSummary || !fullAnalysisResult) return riskSummary;
    const appliedByNode = new Map<string, Set<string>>();
    for (const node of nodes) {
      if (node.data?.appliedMitigations?.length) {
        appliedByNode.set(
          node.id,
          new Set(node.data.appliedMitigations.map((m: string) => m.toLowerCase().trim())),
        );
      }
    }
    if (appliedByNode.size === 0) return riskSummary;
    const { mitigated } = filterMitigatedThreats(fullAnalysisResult.threats, appliedByNode);
    const mitigationRatio = mitigated.length / Math.max(fullAnalysisResult.threats.length, 1);
    // Reduce risk proportional to mitigation coverage (up to 70% reduction at full coverage)
    const adjustedScore = Math.round(riskSummary.overallScore * (1 - mitigationRatio * 0.7));
    const severityLabel =
      adjustedScore >= 80
        ? "Critical"
        : adjustedScore >= 60
          ? "High"
          : adjustedScore >= 40
            ? "Medium"
            : adjustedScore >= 20
              ? "Low"
              : "Minimal";
    return { ...riskSummary, overallScore: adjustedScore, severityLabel };
  }, [riskSummary, fullAnalysisResult, nodes]);

  const filteredAnalysisResult = useMemo(() => {
    if (!fullAnalysisResult) return null;
    const appliedByNode = new Map<string, Set<string>>();
    for (const node of nodes) {
      if (node.data?.appliedMitigations?.length) {
        appliedByNode.set(
          node.id,
          new Set(node.data.appliedMitigations.map((m) => m.toLowerCase().trim())),
        );
      }
    }
    if (appliedByNode.size === 0) {
      return { ...fullAnalysisResult, summary: { ...fullAnalysisResult.summary, mitigated: 0 } };
    }
    const { active, mitigated } = filterMitigatedThreats(fullAnalysisResult.threats, appliedByNode);
    const displayThreats = showMitigated ? fullAnalysisResult.threats : active;

    const byMethodology: Record<string, number> = {};
    const byLayer: Partial<Record<MaestroLayer, number>> = {};
    for (const t of displayThreats) {
      byMethodology[t.methodology] = (byMethodology[t.methodology] ?? 0) + 1;
      if (t.maestroLayer !== undefined)
        byLayer[t.maestroLayer] = (byLayer[t.maestroLayer] ?? 0) + 1;
    }

    return {
      threats: displayThreats,
      summary: {
        total: displayThreats.length,
        critical: displayThreats.filter((t) => t.severity === "critical").length,
        high: displayThreats.filter((t) => t.severity === "high").length,
        medium: displayThreats.filter((t) => t.severity === "medium").length,
        low: displayThreats.filter((t) => t.severity === "low").length,
        inherited: displayThreats.filter((t) => t.inherited).length,
        mitigated: mitigated.length,
        byMethodology,
        byLayer,
      },
    };
  }, [fullAnalysisResult, nodes, showMitigated]);

  return (
    <div className="flex h-full w-full relative">
      <ComponentPalette
        customComponents={customComponents}
        onCreateCustom={() => setShowCustomDialog(true)}
        onAddComponent={handleAddComponentFromPalette}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <CanvasToolbar
          analysisMode={analysisMode}
          onAnalysisModeChange={setAnalysisMode}
          onAnalyze={doAnalysis}
          onLoadTemplate={loadTemplate}
          onCreateCustom={() => setShowCustomDialog(true)}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          onExportJSON={exportJSON}
          onExportPNG={handleExportPNG}
          onExportSVG={handleExportSVG}
          onExportMarkdown={handleExportMarkdown}
          onExportCSV={handleExportCSV}
          onExportSARIF={handleExportSARIF}
          onImportJSON={importJSON}
          onImportAibom={() => setShowAibomImport(true)}
          onClear={clearCanvas}
          onAutoLayout={handleAutoLayout}
          onSaveModel={() => {
            setModelManagerMode("save");
            setModelManagerOpen(true);
          }}
          onLoadModel={() => {
            setModelManagerMode("load");
            setModelManagerOpen(true);
          }}
          onToggleHeatMap={() => setHeatMapActive((v) => !v)}
          onToggleOnboarding={() => setShowOnboarding(true)}
          onToggleSnapToGrid={() => setSnapToGrid((v) => !v)}
          onWhatIf={() => {
            setWhatIfActive((v) => !v);
            if (whatIfActive) {
              setWhatIfNodeId(null);
              setWhatIfResult(null);
            }
            toast.info(
              whatIfActive ? "What-If mode off" : "What-If: click a node to simulate its removal",
            );
          }}
          isAnalyzing={isAnalyzing}
          heatMapActive={heatMapActive}
          snapToGrid={snapToGrid}
          whatIfActive={whatIfActive}
          saveIndicator={saveIndicator}
        />

        <div className="flex-1" ref={reactFlowWrapper}>
          <CanvasContextMenu
            hasSelection={!!selectedNodeId || !!selectedEdgeId}
            isNode={!!selectedNodeId}
            isEdge={!!selectedEdgeId}
            onDeleteSelected={deleteSelected}
            onDuplicateSelected={duplicateSelected}
            onChangeTrustLevel={changeTrustLevel}
            onEditSelected={() => {
              if (selectedEdgeId) setEditingEdgeId(selectedEdgeId);
              if (selectedNodeId) setEditingNodeId(selectedNodeId);
            }}
            onAddTrustBoundary={addTrustBoundary}
            onSelectAll={() =>
              setNodes((nds) => nds.map((n) => ({ ...n, selected: true })) as CanvasNode[])
            }
            onFitView={() => fitView({ duration: 300 })}
            onGroupInBoundary={groupInBoundary}
          >
            <div className="h-full w-full">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChangeWrapped}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                onNodeDoubleClick={onNodeDoubleClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: "dataFlow" }}
                snapToGrid={snapToGrid}
                snapGrid={[16, 16]}
                fitView
                multiSelectionKeyCode="Shift"
                selectionOnDrag
                proOptions={{ hideAttribution: true }}
                className={`bg-background ${whatIfActive ? "ring-2 ring-orange-500/50 ring-inset" : ""}`}
              >
                <Background
                  variant={snapToGrid ? BackgroundVariant.Lines : BackgroundVariant.Dots}
                  gap={16}
                  size={snapToGrid ? 0.5 : 1}
                  className="!bg-muted/30"
                />
                <Controls className="!bg-background !border !shadow-sm" />
                <MiniMap
                  className="!bg-background !border !shadow-sm"
                  nodeColor={miniMapNodeColor}
                  maskColor="rgba(0,0,0,0.1)"
                />
              </ReactFlow>
            </div>
          </CanvasContextMenu>
        </div>
      </div>

      {(selectedNode || selectedEdge) && (
        <NodePropertiesPanel
          selectedNode={selectedNode as CanvasNode | undefined}
          selectedEdge={selectedEdge as CanvasEdge | undefined}
          onClose={() => {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
          }}
          onEditEdge={(id) => setEditingEdgeId(id)}
          onEditNode={(id) => setEditingNodeId(id)}
          allThreats={fullAnalysisResult?.threats}
          onToggleMitigation={handleToggleMitigation}
          onMitigationStatusChange={handleMitigationStatusChange}
        />
      )}

      <ThreatResultsPanel
        result={filteredAnalysisResult ?? analysisResult}
        riskSummary={effectiveRiskSummary}
        attackPaths={attackPaths}
        nodes={nodes as CanvasNode[]}
        onThreatClick={onThreatClick}
        showMitigated={showMitigated}
        onToggleShowMitigated={() => setShowMitigated((v) => !v)}
        totalBeforeMitigation={fullAnalysisResult?.threats.length ?? 0}
        aisvsResult={aisvsResult}
        complianceViolations={complianceViolations}
        complianceGapReport={complianceGapReport}
        attackSurfaceScores={attackSurfaceScores}
        onPathClick={(path) => {
          const nodeIds = new Set(path.nodes);
          setNodes(
            (nds) => nds.map((n) => ({ ...n, selected: nodeIds.has(n.id) })) as CanvasNode[],
          );
          const pathEdges = new Set<string>();
          for (let i = 0; i < path.nodes.length - 1; i++) {
            for (const e of edges) {
              if (
                (e.source === path.nodes[i] && e.target === path.nodes[i + 1]) ||
                (e.target === path.nodes[i] && e.source === path.nodes[i + 1])
              ) {
                pathEdges.add(e.id!);
              }
            }
          }
          setEdges(
            (eds) => eds.map((e) => ({ ...e, selected: pathEdges.has(e.id!) })) as CanvasEdge[],
          );
          const targetNodes = nodes.filter((n) => nodeIds.has(n.id));
          if (targetNodes.length > 0) fitView({ nodes: targetNodes, duration: 500, padding: 0.3 });
        }}
        whatIfResult={whatIfResult}
      />

      {editingEdge?.data && (
        <EdgeMetadataEditor
          open={!!editingEdgeId}
          onOpenChange={(open) => {
            if (!open) setEditingEdgeId(null);
          }}
          metadata={editingEdge.data as DataFlowMetadata}
          onSave={handleSaveEdgeMetadata}
        />
      )}

      <CustomComponentDialog
        open={showCustomDialog}
        onOpenChange={setShowCustomDialog}
        onSave={handleSaveCustomComponent}
      />

      <ModelManager
        open={modelManagerOpen}
        onOpenChange={setModelManagerOpen}
        mode={modelManagerMode}
        onSave={handleSaveModel}
        onLoad={handleLoadModel}
        currentModelData={currentModelData}
        nodeCount={nodes.length}
        edgeCount={edges.length}
      />

      <AibomImportDialog
        open={showAibomImport}
        onOpenChange={setShowAibomImport}
        onImport={handleAibomImport}
      />

      <NodeEditorDialog
        open={!!editingNodeId}
        onOpenChange={(open) => {
          if (!open) setEditingNodeId(null);
        }}
        node={(nodes.find((n) => n.id === editingNodeId) as CanvasNode | null) ?? null}
        onSave={handleSaveNodeEdits}
      />

      {showOnboarding && <OnboardingOverlay onDismiss={handleDismissOnboarding} />}

      {/* Loading overlay during analysis */}
      {isAnalyzing && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 p-6 rounded-lg bg-background border shadow-lg">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm font-medium">Analyzing threats...</p>
            <p className="text-xs text-muted-foreground">Running MAESTRO 7-layer analysis</p>
          </div>
        </div>
      )}

      {/* Heat map legend */}
      {heatMapActive && (
        <div className="absolute bottom-4 left-64 z-40 bg-background/95 border rounded-lg p-2 shadow-sm">
          <p className="text-[10px] font-semibold mb-1">Threat Heat Map</p>
          <div className="flex items-center gap-2 text-[9px]">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-red-500" /> High
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-orange-500" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-yellow-500" /> Low
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-gray-400" /> None
            </span>
          </div>
        </div>
      )}

      {/* Empty canvas CTA */}
      {nodes.length === 0 && !analysisResult && !showOnboarding && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
          style={{ left: "224px" }}
        >
          <div className="pointer-events-auto bg-background/95 border rounded-xl p-6 shadow-lg max-w-md text-center space-y-4">
            <h3 className="text-lg font-bold">Get Started with Threat Modeling</h3>
            <p className="text-sm text-muted-foreground">
              Drag components from the palette, load a template, or import an existing model.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {ARCHITECTURE_TEMPLATES.slice(0, 3).map((t) => (
                <button
                  key={t.id}
                  onClick={() => loadTemplate(t.id)}
                  className="p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <p className="text-xs font-semibold truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                    {t.description}
                  </p>
                </button>
              ))}
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={importJSON}>
                Import JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowAibomImport(true)}>
                Import AIBOM
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clear canvas confirmation dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Clear Canvas?</DialogTitle>
            <DialogDescription>
              This will remove all {nodes.length} components and {edges.length} connections. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowClearConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={doClearCanvas}>
              Clear All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import overwrite confirmation dialog */}
      <Dialog
        open={!!pendingImport}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Replace Current Model?</DialogTitle>
            <DialogDescription>
              Importing will replace your current model ({nodes.length} components, {edges.length}{" "}
              connections). Save your current work first if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setPendingImport(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={applyImport}>
              Replace
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ThreatModelCanvas({ initialTemplate }: { initialTemplate?: string } = {}) {
  return (
    <ReactFlowProvider>
      <ThreatModelCanvasInner initialTemplate={initialTemplate} />
    </ReactFlowProvider>
  );
}
