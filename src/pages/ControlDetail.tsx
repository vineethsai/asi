import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  mitigationsData,
  threatsData,
  Mitigation,
  Threat,
} from "../components/components/securityData";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import SidebarNav from "../components/layout/SidebarNav";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneLight, duotoneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

import { Helmet } from "react-helmet";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Target,
  Shield,
  Hammer,
  Settings,
  Wrench,
  ArrowRight,
  Info,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ControlDetail = () => {
  const { controlId } = useParams<{ controlId: string }>();
  const mitigation: Mitigation | undefined = controlId ? mitigationsData[controlId] : undefined;

  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Interactive state management
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});
  const [copiedCode, setCopiedCode] = useState<{ [key: string]: boolean }>({});

  // Mobile navigation state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Load saved progress from localStorage
  useEffect(() => {
    if (mitigation?.id) {
      const saved = localStorage.getItem(`control-${mitigation.id}-progress`);
      if (saved) {
        setCheckedItems(JSON.parse(saved));
      }
    }
  }, [mitigation?.id]);

  // Save progress to localStorage
  const updateProgress = (itemId: string, checked: boolean) => {
    const newCheckedItems = { ...checkedItems, [itemId]: checked };
    setCheckedItems(newCheckedItems);
    if (mitigation?.id) {
      localStorage.setItem(`control-${mitigation.id}-progress`, JSON.stringify(newCheckedItems));
    }
  };

  // Handle code copy with feedback
  const handleCodeCopy = (codeId: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode({ ...copiedCode, [codeId]: true });
    setTimeout(() => {
      setCopiedCode({ ...copiedCode, [codeId]: false });
    }, 2000);
  };

  const threats: Threat[] = mitigation
    ? mitigation.threatIds.map((id) => threatsData[id]).filter(Boolean)
    : [];

  // Helper to extract code blocks and prose from a section
  function splitProseAndCode(content: string) {
    const codeBlockRegex = /```([\w]*)\n([\s\S]*?)```/g;
    const parts: { type: "code" | "prose"; value: string; lang?: string }[] = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "prose", value: content.slice(lastIndex, match.index) });
      }
      const lang = match[1] || "";
      const code = match[2];
      parts.push({ type: "code", value: code.trim(), lang });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: "prose", value: content.slice(lastIndex) });
    }
    return parts.filter((p) => p.value.trim() !== "");
  }

  // Enhanced text processing with interactive elements
  function enhanceTextWithInteractivity(text: string): JSX.Element {
    if (!text || text.trim() === "") {
      return <span>{text}</span>;
    }

    const technicalTerms: Record<string, { definition: string; icon: JSX.Element }> = {
      containerization: {
        definition:
          "A lightweight form of virtualization that packages applications with their dependencies into containers",
        icon: <Target className="h-3 w-3" />,
      },
      virtualization: {
        definition:
          "Technology that creates virtual versions of computing resources like servers, storage, or networks",
        icon: <Target className="h-3 w-3" />,
      },
      Docker: {
        definition:
          "A platform for developing, shipping, and running applications using containerization technology",
        icon: <ExternalLink className="h-3 w-3" />,
      },
      Podman: {
        definition:
          "A daemonless container engine for developing, managing, and running OCI containers",
        icon: <ExternalLink className="h-3 w-3" />,
      },
      SELinux: {
        definition: "Security-Enhanced Linux - a mandatory access control security mechanism",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      AppArmor: {
        definition:
          "A Linux kernel security module that restricts programs capabilities with per-program profiles",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
      WASM: {
        definition: "WebAssembly - a binary instruction format for a stack-based virtual machine",
        icon: <Info className="h-3 w-3" />,
      },
      QEMU: {
        definition: "Quick Emulator - a generic and open source machine emulator and virtualizer",
        icon: <ExternalLink className="h-3 w-3" />,
      },
      KVM: {
        definition: "Kernel-based Virtual Machine - a virtualization infrastructure for Linux",
        icon: <ExternalLink className="h-3 w-3" />,
      },
      Firecracker: {
        definition:
          "A virtualization technology for creating and managing secure, multi-tenant container environments",
        icon: <ExternalLink className="h-3 w-3" />,
      },
      microVM: {
        definition: "Lightweight virtual machines optimized for serverless computing workloads",
        icon: <Info className="h-3 w-3" />,
      },
      cgroups: {
        definition:
          "Control groups - a Linux kernel feature that limits and isolates resource usage",
        icon: <Target className="h-3 w-3" />,
      },
      namespaces: {
        definition:
          "Linux kernel feature that partitions kernel resources so that one set of processes sees one set of resources",
        icon: <Target className="h-3 w-3" />,
      },
      seccomp: {
        definition:
          "Secure computing mode - a computer security facility in Linux that restricts system calls",
        icon: <AlertTriangle className="h-3 w-3" />,
      },
    };

    const words = text.split(/(\s+)/);
    const elements: JSX.Element[] = [];

    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, "").toLowerCase();
      const techTerm = Object.keys(technicalTerms).find((term) => term.toLowerCase() === cleanWord);

      if (techTerm && word.toLowerCase().includes(techTerm.toLowerCase())) {
        const termInfo = technicalTerms[techTerm];
        elements.push(
          <TooltipProvider key={`term-${index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 cursor-help hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors text-sm">
                  {termInfo.icon}
                  <span className="font-medium">{word.trim()}</span>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{termInfo.definition}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>,
        );
      } else {
        elements.push(<span key={`text-${index}`}>{word}</span>);
      }
    });

    return <span>{elements}</span>;
  }

  // Enhanced function to render interactive checklists
  function renderInteractiveChecklist(content: string, sectionId: string) {
    const lines = content.split("\n").filter((l) => l.trim() !== "");

    if (lines.length > 1 && lines.every((l) => l.trim().startsWith("- "))) {
      const items = lines.map((l) => l.replace(/^\s*-\s*/, "").trim());
      const completedCount = items.filter((_, i) => checkedItems[`${sectionId}-${i}`]).length;
      const progressPercentage = items.length > 0 ? (completedCount / items.length) * 100 : 0;

      return (
        <div className="space-y-4">
          {items.length > 5 && (
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">
                Progress: {completedCount}/{items.length}
              </span>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
          {items.length > 5 && <Progress value={progressPercentage} className="h-2 mb-4" />}
          <div className="space-y-3">
            {items.map((item, i) => {
              const itemId = `${sectionId}-${i}`;
              const isChecked = checkedItems[itemId] || false;
              return (
                <div key={i} className="flex items-start space-x-3 group">
                  <Checkbox
                    id={itemId}
                    checked={isChecked}
                    onCheckedChange={(checked) => updateProgress(itemId, checked as boolean)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={itemId}
                    className={`text-sm cursor-pointer transition-all flex-1 ${
                      isChecked ? "line-through text-muted-foreground" : "text-foreground"
                    }`}
                  >
                    {enhanceTextWithInteractivity(item)}
                  </label>
                  {isChecked && (
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return renderSectionContent(content, sectionId);
  }

  // Enhanced function to render code with better interactions
  function renderEnhancedCode(code: string, language: string, codeId: string) {
    const isCopied = copiedCode[codeId];

    return (
      <div className="relative group">
        <div className="absolute top-2 right-2 flex gap-2 z-10">
          <button
            onClick={() => handleCodeCopy(codeId, code)}
            className="bg-muted px-3 py-1.5 rounded text-xs border hover:bg-accent transition-colors flex items-center gap-1"
          >
            {isCopied ? (
              <>
                <Check className="h-3 w-3" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
          {language && (
            <span className="bg-muted px-2 py-1.5 rounded text-xs border text-muted-foreground">
              {language.toUpperCase()}
            </span>
          )}
        </div>
        <SyntaxHighlighter
          language={language}
          style={isDarkMode ? duotoneDark : duotoneLight}
          customStyle={{
            borderRadius: 8,
            fontSize: 13,
            padding: 16,
            paddingTop: 40,
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  function renderSectionContent(content: string, sectionId: string) {
    const lines = content.split("\n").filter((l) => l.trim() !== "");

    if (lines.length > 1 && lines.every((l) => l.trim().startsWith("- "))) {
      return renderInteractiveChecklist(content, sectionId);
    }

    if (lines.length === 1 && (content.match(/ - /g) || []).length > 1) {
      const items = content
        .split(/ - /)
        .map((s) => s.trim())
        .filter(Boolean);
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2 group-hover:scale-125 transition-transform"></div>
              <div className="flex-1 text-sm text-muted-foreground">
                {enhanceTextWithInteractivity(item)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const parts = splitProseAndCode(content);
    if (parts.length === 1 && parts[0].type === "prose") {
      return formatProseContent(parts[0].value, sectionId);
    }

    const codeBlocks = parts.filter((p) => p.type === "code");
    if (codeBlocks.length > 1) {
      return (
        <Tabs defaultValue={codeBlocks[0].lang || "code"} className="w-full mt-2">
          <TabsList>
            {codeBlocks.map((block, i) => (
              <TabsTrigger key={i} value={block.lang || `code${i}`}>
                {block.lang ? block.lang.toUpperCase() : `Code ${i + 1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          {codeBlocks.map((block, i) => (
            <TabsContent key={i} value={block.lang || `code${i}`}>
              {renderEnhancedCode(block.value, block.lang || "", `${sectionId}-code-${i}`)}
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    return (
      <div className="space-y-6">
        {parts.map((part, i) =>
          part.type === "prose" ? (
            <div key={i}>{formatProseContent(part.value, `${sectionId}-${i}`)}</div>
          ) : (
            <div key={i}>
              {renderEnhancedCode(part.value, part.lang || "", `${sectionId}-code-${i}`)}
            </div>
          ),
        )}
      </div>
    );
  }

  // Enhanced prose formatting function
  function formatProseContent(content: string, _sectionId: string): JSX.Element {
    const lines = content.trim().split("\n");
    const elements: JSX.Element[] = [];
    let currentList: JSX.Element[] = [];
    let currentListType: "bullet" | "numbered" | null = null;

    const flushList = () => {
      if (currentList.length > 0) {
        if (currentListType === "bullet") {
          elements.push(
            <ul key={`list-${elements.length}`} className="space-y-2 ml-0 my-4">
              {currentList}
            </ul>,
          );
        } else if (currentListType === "numbered") {
          elements.push(
            <ol
              key={`list-${elements.length}`}
              className="space-y-2 ml-0 my-4 list-decimal list-inside"
            >
              {currentList}
            </ol>,
          );
        }
        currentList = [];
        currentListType = null;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        flushList();
        return;
      }

      if (trimmedLine.match(/^\*\*([^*]+)\*\*:?\s*$/)) {
        flushList();
        const headingText = trimmedLine.replace(/^\*\*([^*]+)\*\*:?\s*$/, "$1");
        elements.push(
          <h3
            key={`heading-${index}`}
            className="text-lg font-semibold text-foreground mb-3 mt-6 flex items-center gap-3 pb-2 border-b border-border/50"
          >
            <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <span>{headingText}</span>
          </h3>,
        );
        return;
      }

      if (trimmedLine.startsWith("**") && trimmedLine.includes(":**")) {
        flushList();
        const headingMatch = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (headingMatch) {
          const [, heading, content] = headingMatch;
          elements.push(
            <div key={`subheading-${index}`} className="mt-4 mb-3">
              <h4 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/70"></div>
                {heading}
              </h4>
              {content.trim() && (
                <p className="text-muted-foreground leading-relaxed ml-4 text-sm">
                  {enhanceTextWithInteractivity(content)}
                </p>
              )}
            </div>,
          );
          return;
        }
      }

      if (trimmedLine.startsWith("- ")) {
        const content = trimmedLine.substring(2).trim();
        const isSubBullet = line.startsWith("  - ") || line.startsWith("    - ");

        if (currentListType !== "bullet") {
          flushList();
          currentListType = "bullet";
        }

        const bulletContent = formatBulletContent(content);
        currentList.push(
          <li
            key={`bullet-${index}`}
            className={`flex items-start gap-3 ${isSubBullet ? "ml-6" : ""} p-2 rounded-lg hover:bg-muted/30 transition-colors group`}
          >
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 transition-all group-hover:scale-110 ${
                isSubBullet ? "bg-blue-400 dark:bg-blue-500" : "bg-primary shadow-sm"
              }`}
            ></div>
            <div className="flex-1 leading-relaxed text-muted-foreground text-sm">
              {bulletContent}
            </div>
          </li>,
        );
        return;
      }

      if (trimmedLine.match(/^\d+\.\s/)) {
        const content = trimmedLine.replace(/^\d+\.\s/, "");

        if (currentListType !== "numbered") {
          flushList();
          currentListType = "numbered";
        }

        const bulletContent = formatBulletContent(content);
        currentList.push(
          <li
            key={`numbered-${index}`}
            className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 leading-relaxed text-muted-foreground text-sm">
              {bulletContent}
            </div>
          </li>,
        );
        return;
      }

      flushList();
      elements.push(
        <p
          key={`paragraph-${index}`}
          className="leading-relaxed text-muted-foreground mb-3 text-sm"
        >
          {enhanceTextWithInteractivity(trimmedLine)}
        </p>,
      );
    });

    flushList();
    return <div className="space-y-2">{elements}</div>;
  }

  function formatBulletContent(content: string): JSX.Element {
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const parts = content.split(boldPattern);

    return (
      <span className="text-sm">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            return (
              <span key={index} className="font-semibold text-foreground">
                {enhanceTextWithInteractivity(part)}
              </span>
            );
          } else {
            return <span key={index}>{enhanceTextWithInteractivity(part)}</span>;
          }
        })}
      </span>
    );
  }

  if (!mitigation) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Control Not Found</h1>
        <Link to="/controls">
          <Button>Back to Controls</Button>
        </Link>
      </div>
    );
  }

  // Calculate overall progress
  const getAllChecklistItems = () => {
    const sections = [
      mitigation.implementationDetail.design,
      mitigation.implementationDetail.build,
      mitigation.implementationDetail.operations,
      mitigation.implementationDetail.toolsAndFrameworks,
    ].filter(Boolean);

    return sections.reduce((total, section) => {
      const lines = section.split("\n").filter((l) => l.trim().startsWith("- "));
      return total + lines.length;
    }, 0);
  };

  const getCompletedItems = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  const totalItems = getAllChecklistItems();
  const completedItems = getCompletedItems();
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  // Determine which phases are available
  const hasDesign =
    mitigation.implementationDetail.design && mitigation.implementationDetail.design.trim();
  const hasBuild =
    mitigation.implementationDetail.build && mitigation.implementationDetail.build.trim();
  const hasOperations =
    mitigation.implementationDetail.operations && mitigation.implementationDetail.operations.trim();
  const hasTools =
    mitigation.implementationDetail.toolsAndFrameworks &&
    mitigation.implementationDetail.toolsAndFrameworks.trim();

  return (
    <>
      <Helmet>
        <title>{mitigation.name} | OWASP Securing Agentic Applications Guide</title>
        <meta
          name="description"
          content={`${mitigation.description} Learn how to implement this AI security control to mitigate threats in agentic systems.`}
        />
      </Helmet>
      <Header onMobileMenuToggle={handleMobileMenuToggle} isMobileMenuOpen={isMobileMenuOpen} />

      <SidebarNav
        type="controls"
        activeId={mitigation.id}
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuClose}
      />

      <section className="py-8 bg-background min-h-screen">
        <div className="container px-4 md:px-6 max-w-7xl">
          {/* Breadcrumb */}
          <Link
            to="/controls"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Controls
          </Link>

          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{mitigation.name}</h1>
            <p className="mt-1 text-muted-foreground">
              {enhanceTextWithInteractivity(mitigation.description)}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Mitigates</span>
                  </div>
                  <div className="text-2xl font-bold">{threats.length}</div>
                  <div className="text-xs text-muted-foreground">Threats</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Phases</span>
                  </div>
                  <div className="text-2xl font-bold">
                    {[hasDesign, hasBuild, hasOperations].filter(Boolean).length}
                  </div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </CardContent>
              </Card>
              {totalItems > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Progress</span>
                    </div>
                    <div className="text-2xl font-bold">{Math.round(overallProgress)}%</div>
                    <div className="text-xs text-muted-foreground">
                      {completedItems}/{totalItems} tasks
                    </div>
                  </CardContent>
                </Card>
              )}
              {mitigation.references && mitigation.references.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">References</span>
                    </div>
                    <div className="text-2xl font-bold">{mitigation.references.length}</div>
                    <div className="text-xs text-muted-foreground">Resources</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Info className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              {hasDesign && (
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Design</span>
                </TabsTrigger>
              )}
              {hasBuild && (
                <TabsTrigger value="build" className="flex items-center gap-2">
                  <Hammer className="h-4 w-4" />
                  <span className="hidden sm:inline">Build</span>
                </TabsTrigger>
              )}
              {hasOperations && (
                <TabsTrigger value="operations" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Operations</span>
                </TabsTrigger>
              )}
              {hasTools && (
                <TabsTrigger value="tools" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  <span className="hidden sm:inline">Tools</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Threats Section */}
              {threats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-muted-foreground" />
                      Mitigates Threats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {threats.map((threat) => (
                        <Link
                          key={threat.id}
                          to={`/threats/${threat.id}`}
                          className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group"
                        >
                          <div className="w-2 h-2 rounded-full bg-red-500 mt-2 group-hover:scale-125 transition-transform flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                              {threat.code} - {threat.name}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {threat.description}
                            </p>
                            {threat.impactLevel && (
                              <Badge
                                variant={
                                  threat.impactLevel === "high"
                                    ? "destructive"
                                    : threat.impactLevel === "medium"
                                      ? "secondary"
                                      : "outline"
                                }
                                className="mt-2 text-xs"
                              >
                                {threat.impactLevel} impact
                              </Badge>
                            )}
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* References */}
              {mitigation.references && mitigation.references.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                      References & Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {mitigation.references.map((ref, index) => (
                        <a
                          key={index}
                          href={ref.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-medium group-hover:text-primary transition-colors">
                            {ref.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Implementation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Implementation Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {hasDesign && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <div className="font-medium text-blue-900 dark:text-blue-100">
                            Design Phase
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {
                              mitigation.implementationDetail.design
                                .split("\n")
                                .filter((l) => l.trim().startsWith("- ")).length
                            }{" "}
                            tasks
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("design")}>
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                    {hasBuild && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                        <Hammer className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">Build Phase</div>
                          <div className="text-sm text-muted-foreground">
                            {
                              mitigation.implementationDetail.build
                                .split("\n")
                                .filter((l) => l.trim().startsWith("- ")).length
                            }{" "}
                            tasks
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("build")}>
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                    {hasOperations && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                        <Settings className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">Operations Phase</div>
                          <div className="text-sm text-muted-foreground">
                            {
                              mitigation.implementationDetail.operations
                                .split("\n")
                                .filter((l) => l.trim().startsWith("- ")).length
                            }{" "}
                            tasks
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("operations")}
                        >
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                    {hasTools && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                        <Wrench className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="font-medium">Tools & Frameworks</div>
                          <div className="text-sm text-muted-foreground">
                            {
                              mitigation.implementationDetail.toolsAndFrameworks
                                .split("\n")
                                .filter((l) => l.trim().startsWith("- ")).length
                            }{" "}
                            items
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("tools")}>
                          View <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Design Phase Tab */}
            {hasDesign && (
              <TabsContent value="design" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-muted-foreground" />
                      Design Phase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderSectionContent(mitigation.implementationDetail.design, "design-phase")}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Build Phase Tab */}
            {hasBuild && (
              <TabsContent value="build" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Hammer className="h-5 w-5 text-muted-foreground" />
                      Build Phase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderSectionContent(mitigation.implementationDetail.build, "build-phase")}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Operations Phase Tab */}
            {hasOperations && (
              <TabsContent value="operations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      Operations Phase
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderSectionContent(
                      mitigation.implementationDetail.operations,
                      "operation-phase",
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Tools & Frameworks Tab */}
            {hasTools && (
              <TabsContent value="tools" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5 text-muted-foreground" />
                      Tools & Frameworks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderSectionContent(
                      mitigation.implementationDetail.toolsAndFrameworks,
                      "tools-frameworks",
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ControlDetail;
