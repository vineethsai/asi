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

import { runThreatAnalysis } from "./engine/threatEngine";
import { enrichThreatsWithSecurityData } from "./engine/dataIntegration";
import { calculateModelRisk, type ModelRiskSummary } from "./engine/riskScoring";
import { findAttackPaths, type AttackPath } from "./engine/attackPaths";
import { filterMitigatedThreats } from "./engine/mitigationCatalog";
import { runAISVSMapping, type AISVSCoverageResult } from "./engine/aisvsMapping";
import { exportCanvasPNG } from "./export/exportPNG";
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

function ThreatModelCanvasInner() {
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

  // Restore auto-save on mount
  useEffect(() => {
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

  useEffect(() => {
    localStorage.setItem("threat-modeler-custom-components", JSON.stringify(customComponents));
  }, [customComponents]);

  const pushHistory = useCallback(
    (newNodes: CanvasNode[], newEdges: CanvasEdge[]) => {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = setTimeout(() => {
        setHistory((prev) => [
          ...prev.slice(0, historyIndex + 1),
          {
            nodes: JSON.parse(JSON.stringify(newNodes)),
            edges: JSON.parse(JSON.stringify(newEdges)),
          },
        ]);
        setHistoryIndex((prev) => prev + 1);
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
      result = {
        ...result,
        threats: enrichThreatsWithSecurityData(result.threats),
        summary: { ...result.summary, mitigated: 0 },
      };
      setFullAnalysisResult(result);
      setAnalysisResult(result);

      const risk = calculateModelRisk(nodes as CanvasNode[], edges as CanvasEdge[], result);
      setRiskSummary(risk);

      const paths = findAttackPaths(nodes as CanvasNode[], edges as CanvasEdge[], result.threats);
      setAttackPaths(paths);

      const aisvsCoverage = runAISVSMapping(result.threats);
      setAisvsResult(aisvsCoverage);

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
      toast.success(`Analysis complete - ${result.summary.total} threats found`);
    });
  }, [nodes, edges, methodology, customComponents, setNodes, setEdges]);

  useEffect(() => {
    if (analysisMode === "live" && nodes.length > 0) {
      const timeout = setTimeout(doAnalysis, 800);
      return () => clearTimeout(timeout);
    }
  }, [analysisMode, nodes, edges, doAnalysis]);

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
    if (!selectedNodeId) return;
    const node = nodes.find((n) => n.id === selectedNodeId);
    if (!node) return;
    const boundary: CanvasNode = {
      id: genNodeId(),
      type: "trustBoundary",
      position: { x: node.position.x - 20, y: node.position.y - 40 },
      style: { width: 250, height: 180 },
      data: {
        label: "Trust Boundary",
        category: "trust-boundary",
        maestroLayers: [MaestroLayer.SecurityCompliance],
        trustLevel: "trusted",
        threats: [],
      } as CanvasNodeData,
    };
    setNodes((nds) => [...nds, boundary] as CanvasNode[]);
    pushHistory([...nodes, boundary], edges);
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
        toast.info(`What-If: "${(node.data as CanvasNodeData)?.label}" marked compromised`);
        return;
      }
      setSelectedNodeId(node.id);
      setSelectedEdgeId(null);
    },
    [whatIfActive],
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

  const clearCanvas = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setAnalysisResult(null);
    setRiskSummary(null);
    setAttackPaths([]);
    pushHistory([], []);
    toast.info("Canvas cleared");
  }, [setNodes, setEdges, pushHistory]);

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
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.analysisResult) setAnalysisResult(data.analysisResult);
          if (data.methodology) setMethodology(data.methodology);
          if (data.customComponents) setCustomComponents(data.customComponents);
          toast.success("Model imported");
        } catch {
          toast.error("Import failed: invalid format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setNodes, setEdges]);

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

  const handleSaveModel = useCallback((name: string) => {
    toast.success(`Model "${name}" saved`);
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
    (n: { data?: CanvasNodeData }) => {
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
              .filter(([, s]) => s.status === "implemented" || s.status === "in-progress")
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
            if (whatIfActive) setWhatIfNodeId(null);
            toast.info(
              whatIfActive ? "What-If mode off" : "What-If: click a node to mark compromised",
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
                  variant={BackgroundVariant.Dots}
                  gap={16}
                  size={1}
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
          allThreats={fullAnalysisResult?.threats}
          onToggleMitigation={handleToggleMitigation}
          onMitigationStatusChange={handleMitigationStatusChange}
        />
      )}

      <ThreatResultsPanel
        result={filteredAnalysisResult ?? analysisResult}
        riskSummary={riskSummary}
        attackPaths={attackPaths}
        nodes={nodes as CanvasNode[]}
        onThreatClick={onThreatClick}
        showMitigated={showMitigated}
        onToggleShowMitigated={() => setShowMitigated((v) => !v)}
        totalBeforeMitigation={fullAnalysisResult?.threats.length ?? 0}
        aisvsResult={aisvsResult}
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
    </div>
  );
}

export default function ThreatModelCanvas() {
  return (
    <ReactFlowProvider>
      <ThreatModelCanvasInner />
    </ReactFlowProvider>
  );
}
