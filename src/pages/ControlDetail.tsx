import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mitigationsData, threatsData, Mitigation, Threat } from "../components/components/securityData";
import Header from "@/components/layout/Header";
import SidebarNav from "../components/layout/SidebarNav";
import { frameworkData } from "../components/components/frameworkData";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneLight, duotoneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useEffect, useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Icon } from "@/components/ui/icon";
import { Helmet } from "react-helmet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Circle, Copy, Check, Play, Eye, EyeOff, Info, ExternalLink, Lightbulb, AlertTriangle, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

export const ControlDetail = () => {
  const { controlId } = useParams<{ controlId: string }>();
  const mitigation: Mitigation | undefined = controlId ? mitigationsData[controlId] : undefined;
  
  // Theme detection
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Interactive state management
  const [checkedItems, setCheckedItems] = useState<{[key: string]: boolean}>({});
  const [copiedCode, setCopiedCode] = useState<{[key: string]: boolean}>({});
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  
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
      attributeFilter: ['class']
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
    ? mitigation.threatIds.map(id => threatsData[id]).filter(Boolean)
    : [];

  // Helper to map component IDs to names
  const componentIdToName: Record<string, string> = Object.fromEntries(
    frameworkData.map((c) => [c.id, c.title])
  );

  // Helper to extract code blocks and prose from a section
  function splitProseAndCode(content: string) {
    // Only split on triple-backtick code blocks
    const codeBlockRegex = /```([\w]*)\n([\s\S]*?)```/g;
    let parts: { type: 'code' | 'prose', value: string, lang?: string }[] = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'prose', value: content.slice(lastIndex, match.index) });
      }
      const lang = match[1] || '';
      const code = match[2];
      parts.push({ type: 'code', value: code.trim(), lang });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < content.length) {
      parts.push({ type: 'prose', value: content.slice(lastIndex) });
    }
    return parts.filter(p => p.value.trim() !== '');
  }

  // Enhanced text processing with interactive elements
  function enhanceTextWithInteractivity(text: string): JSX.Element {
    if (!text || text.trim() === '') {
      return <span>{text}</span>;
    }

    // Define technical terms and their explanations
    const technicalTerms: Record<string, { definition: string; icon: JSX.Element }> = {
      'containerization': {
        definition: 'A lightweight form of virtualization that packages applications with their dependencies into containers',
        icon: <Target className="h-3 w-3" />
      },
      'virtualization': {
        definition: 'Technology that creates virtual versions of computing resources like servers, storage, or networks',
        icon: <Target className="h-3 w-3" />
      },
      'Docker': {
        definition: 'A platform for developing, shipping, and running applications using containerization technology',
        icon: <ExternalLink className="h-3 w-3" />
      },
      'Podman': {
        definition: 'A daemonless container engine for developing, managing, and running OCI containers',
        icon: <ExternalLink className="h-3 w-3" />
      },
      'SELinux': {
        definition: 'Security-Enhanced Linux - a mandatory access control security mechanism',
        icon: <AlertTriangle className="h-3 w-3" />
      },
      'AppArmor': {
        definition: 'A Linux kernel security module that restricts programs capabilities with per-program profiles',
        icon: <AlertTriangle className="h-3 w-3" />
      },
      'WASM': {
        definition: 'WebAssembly - a binary instruction format for a stack-based virtual machine',
        icon: <Lightbulb className="h-3 w-3" />
      },
      'QEMU': {
        definition: 'Quick Emulator - a generic and open source machine emulator and virtualizer',
        icon: <ExternalLink className="h-3 w-3" />
      },
      'KVM': {
        definition: 'Kernel-based Virtual Machine - a virtualization infrastructure for Linux',
        icon: <ExternalLink className="h-3 w-3" />
      },
      'Firecracker': {
        definition: 'A virtualization technology for creating and managing secure, multi-tenant container environments',
        icon: <ExternalLink className="h-3 w-3" />
      },
      'microVM': {
        definition: 'Lightweight virtual machines optimized for serverless computing workloads',
        icon: <Lightbulb className="h-3 w-3" />
      },
      'cgroups': {
        definition: 'Control groups - a Linux kernel feature that limits and isolates resource usage',
        icon: <Target className="h-3 w-3" />
      },
      'namespaces': {
        definition: 'Linux kernel feature that partitions kernel resources so that one set of processes sees one set of resources',
        icon: <Target className="h-3 w-3" />
      },
      'seccomp': {
        definition: 'Secure computing mode - a computer security facility in Linux that restricts system calls',
        icon: <AlertTriangle className="h-3 w-3" />
      }
    };

    // Risk level indicators
    const riskLevels: Record<string, { color: string; icon: JSX.Element }> = {
      'LOW RISK': { color: 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900', icon: <CheckCircle2 className="h-3 w-3" /> },
      'MEDIUM RISK': { color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900', icon: <AlertTriangle className="h-3 w-3" /> },
      'HIGH RISK': { color: 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900', icon: <AlertTriangle className="h-3 w-3" /> },
      'CRITICAL RISK': { color: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900', icon: <AlertTriangle className="h-3 w-3" /> }
    };

    // Simple approach: split by words and process each
    const words = text.split(/(\s+)/);
    const elements: JSX.Element[] = [];

    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '').toLowerCase();
      const techTerm = Object.keys(technicalTerms).find(term => 
        term.toLowerCase() === cleanWord
      );
      
      const riskLevel = Object.keys(riskLevels).find(level => 
        text.toUpperCase().includes(level)
      );

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
          </TooltipProvider>
        );
      } else if (riskLevel && word.toUpperCase().includes(riskLevel)) {
        const levelInfo = riskLevels[riskLevel];
        elements.push(
          <span key={`risk-${index}`} className={`inline-flex items-center gap-1 px-2 py-1 mx-1 rounded-full text-xs font-medium ${levelInfo.color}`}>
            {levelInfo.icon}
            {word.trim()}
          </span>
        );
      } else {
        elements.push(<span key={`text-${index}`}>{word}</span>);
      }
    });

    return <span>{elements}</span>;
  }

  // Enhanced function to render interactive checklists
  function renderInteractiveChecklist(content: string, sectionId: string) {
    const lines = content.split("\n").filter(l => l.trim() !== "");
    
    if (lines.length > 1 && lines.every(l => l.trim().startsWith("- "))) {
      const items = lines.map(l => l.replace(/^\s*-\s*/, "").trim());
      const completedCount = items.filter((_, i) => checkedItems[`${sectionId}-${i}`]).length;
      const progressPercentage = items.length > 0 ? (completedCount / items.length) * 100 : 0;
      
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress: {completedCount}/{items.length}</span>
            <span className="text-sm text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
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
                    className={`text-sm cursor-pointer transition-all ${
                      isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                    }`}
                  >
                    {enhanceTextWithInteractivity(item)}
                  </label>
                  {isChecked && <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />}
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
            paddingTop: 40 // Make room for buttons
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  }

  function renderSectionContent(content: string, sectionId: string) {
    const lines = content.split("\n").filter(l => l.trim() !== "");
    
    // If all lines start with '-', render as interactive checklist
    if (lines.length > 1 && lines.every(l => l.trim().startsWith("- "))) {
      return renderInteractiveChecklist(content, sectionId);
    }
    
    // If a single line contains multiple ' - ', render as enhanced list
    if (lines.length === 1 && (content.match(/ - /g) || []).length > 1) {
      const items = content.split(/ - /).map(s => s.trim()).filter(Boolean);
      return (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 group-hover:scale-125 transition-transform"></div>
              <div className="flex-1 text-sm text-muted-foreground">
                {enhanceTextWithInteractivity(item)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Otherwise, split prose and code
    const parts = splitProseAndCode(content);
    if (parts.length === 1 && parts[0].type === 'prose') {
      return formatProseContent(parts[0].value, sectionId);
    }
    
    // If multiple code blocks, use tabs with enhanced code rendering
    const codeBlocks = parts.filter(p => p.type === 'code');
    if (codeBlocks.length > 1) {
      return (
        <Tabs defaultValue={codeBlocks[0].lang || 'code'} className="w-full mt-2">
          <TabsList>
            {codeBlocks.map((block, i) => (
              <TabsTrigger key={i} value={block.lang || `code${i}`}>
                {block.lang ? block.lang.toUpperCase() : `Code ${i+1}`}
              </TabsTrigger>
            ))}
          </TabsList>
          {codeBlocks.map((block, i) => (
            <TabsContent key={i} value={block.lang || `code${i}`}> 
              {renderEnhancedCode(block.value, block.lang || '', `${sectionId}-code-${i}`)}
            </TabsContent>
          ))}
        </Tabs>
      );
    }
    
    // Otherwise, render prose and code blocks sequentially with enhanced formatting
    return (
      <div className="space-y-6">
        {parts.map((part, i) =>
          part.type === 'prose' ? (
            <div key={i}>
              {formatProseContent(part.value, `${sectionId}-${i}`)}
            </div>
          ) : (
            <div key={i}>
              {renderEnhancedCode(part.value, part.lang || '', `${sectionId}-code-${i}`)}
            </div>
          )
        )}
      </div>
    );
  }

  // Enhanced prose formatting function
  function formatProseContent(content: string, sectionId: string): JSX.Element {
    const lines = content.trim().split('\n');
    const elements: JSX.Element[] = [];
    let currentList: JSX.Element[] = [];
    let currentListType: 'bullet' | 'numbered' | null = null;
    let inSubSection = false;
    let currentSubSectionItems: JSX.Element[] = [];

    const flushList = () => {
      if (currentList.length > 0) {
        if (currentListType === 'bullet') {
          elements.push(
            <ul key={`list-${elements.length}`} className="space-y-3 ml-0 my-4">
              {currentList}
            </ul>
          );
        } else if (currentListType === 'numbered') {
          elements.push(
            <ol key={`list-${elements.length}`} className="space-y-3 ml-0 my-4 list-decimal list-inside">
              {currentList}
            </ol>
          );
        }
        currentList = [];
        currentListType = null;
      }
    };

    const flushSubSection = () => {
      if (currentSubSectionItems.length > 0) {
        elements.push(
          <div key={`subsection-${elements.length}`} className="ml-4 space-y-3 border-l-2 border-blue-200 dark:border-blue-700 pl-4 my-4 bg-blue-50/30 dark:bg-blue-950/30 rounded-r-lg py-3">
            {currentSubSectionItems}
          </div>
        );
        currentSubSectionItems = [];
        inSubSection = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Empty line - flush any current list or subsection
        flushList();
        flushSubSection();
        return;
      }

      // Main headings (starting with **)
      if (trimmedLine.match(/^\*\*([^*]+)\*\*:?\s*$/)) {
        flushList();
        flushSubSection();
        const headingText = trimmedLine.replace(/^\*\*([^*]+)\*\*:?\s*$/, '$1');
        elements.push(
          <h3 key={`heading-${index}`} className="text-lg font-semibold text-foreground mb-4 mt-6 flex items-center gap-3 pb-2 border-b border-border/50">
            <div className="w-1.5 h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">{headingText}</span>
          </h3>
        );
        return;
      }

      // Sub-headings (starting with ** but with content after)
      if (trimmedLine.startsWith('**') && trimmedLine.includes(':**')) {
        flushList();
        const headingMatch = trimmedLine.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
        if (headingMatch) {
          const [, heading, content] = headingMatch;
          elements.push(
            <div key={`subheading-${index}`} className="mt-5 mb-3">
              <h4 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary/70"></div>
                {heading}
              </h4>
              {content.trim() && (
                <p className="text-muted-foreground leading-relaxed ml-4 text-sm">
                  {enhanceTextWithInteractivity(content)}
                </p>
              )}
            </div>
          );
          inSubSection = true;
          return;
        }
      }

      // Bullet points (starting with -)
      if (trimmedLine.startsWith('- ')) {
        flushSubSection();
        const content = trimmedLine.substring(2).trim();
        
        // Check if this is a sub-bullet (indented)
        const isSubBullet = line.startsWith('  - ') || line.startsWith('    - ');
        const indentLevel = line.match(/^(\s*)/)?.[1]?.length || 0;
        
        if (currentListType !== 'bullet') {
          flushList();
          currentListType = 'bullet';
        }

        const bulletContent = formatBulletContent(content);
        currentList.push(
          <li key={`bullet-${index}`} className={`flex items-start gap-3 ${isSubBullet ? 'ml-6' : ''} p-2 rounded-lg hover:bg-muted/30 transition-colors group`}>
            <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 transition-all group-hover:scale-110 ${
              isSubBullet 
                ? 'bg-blue-400 dark:bg-blue-500' 
                : 'bg-primary shadow-sm'
            }`}></div>
            <div className="flex-1 leading-relaxed text-muted-foreground">
              {bulletContent}
            </div>
          </li>
        );
        return;
      }

      // Numbered points (starting with number.)
      if (trimmedLine.match(/^\d+\.\s/)) {
        flushSubSection();
        const content = trimmedLine.replace(/^\d+\.\s/, '');
        
        if (currentListType !== 'numbered') {
          flushList();
          currentListType = 'numbered';
        }

        const bulletContent = formatBulletContent(content);
        currentList.push(
          <li key={`numbered-${index}`} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
            <div className="flex-1 leading-relaxed text-muted-foreground">
              {bulletContent}
            </div>
          </li>
        );
        return;
      }

      // Regular paragraph
      flushList();
      
      if (inSubSection) {
        currentSubSectionItems.push(
          <p key={`subsection-p-${index}`} className="leading-relaxed text-muted-foreground text-sm">
            {enhanceTextWithInteractivity(trimmedLine)}
          </p>
        );
      } else {
        flushSubSection();
        elements.push(
          <p key={`paragraph-${index}`} className="leading-relaxed text-muted-foreground mb-3 text-sm">
            {enhanceTextWithInteractivity(trimmedLine)}
          </p>
        );
      }
    });

    // Flush any remaining items
    flushList();
    flushSubSection();

    return <div className="space-y-2">{elements}</div>;
  }

  // Enhanced bullet content formatting
  function formatBulletContent(content: string): JSX.Element {
    // Check for bold text patterns
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const parts = content.split(boldPattern);
    
    return (
      <span className="text-sm">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // This is bold text
            return (
              <span key={index} className="font-semibold text-foreground">
                {enhanceTextWithInteractivity(part)}
              </span>
            );
          } else {
            // Regular text
            return (
              <span key={index}>
                {enhanceTextWithInteractivity(part)}
              </span>
            );
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

  // Analytics for threats/tags/phases
  const threatCount = mitigation.threatIds?.length || 0;
  const tagCount = (mitigation.tags || []).length;
  const phaseCount = [mitigation.designPhase, mitigation.buildPhase, mitigation.operationPhase].filter(Boolean).length;

  // Calculate overall progress
  const getAllChecklistItems = () => {
    const sections = [
      mitigation.implementationDetail.design,
      mitigation.implementationDetail.build,
      mitigation.implementationDetail.operations,
      mitigation.implementationDetail.toolsAndFrameworks
    ].filter(Boolean);
    
    return sections.reduce((total, section) => {
      const lines = section.split('\n').filter(l => l.trim().startsWith('- '));
      return total + lines.length;
    }, 0);
  };

  const getCompletedItems = () => {
    return Object.values(checkedItems).filter(Boolean).length;
  };

  const totalItems = getAllChecklistItems();
  const completedItems = getCompletedItems();
  const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

  return (
    <>
      <Helmet>
        <title>{mitigation.name} | OWASP Securing Agentic Applications Guide</title>
        <meta name="description" content={`${mitigation.description} Learn how to implement this AI security control to mitigate threats in agentic systems.`} />
        <meta name="keywords" content={`${mitigation.name}, AI security control, OWASP, agentic systems, ${mitigation.tags?.join(', ') || ''}, AI mitigations, security controls`} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`https://agenticsecurity.info/controls/${mitigation.id}`} />
        <meta property="og:title" content={`${mitigation.name} | OWASP Guide`} />
        <meta property="og:description" content={mitigation.description} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://agenticsecurity.info/controls/${mitigation.id}`} />
        <meta property="og:site_name" content="OWASP Securing Agentic Applications Guide" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${mitigation.name} | OWASP Guide`} />
        <meta name="twitter:description" content={mitigation.description} />
        <meta name="twitter:url" content={`https://agenticsecurity.info/controls/${mitigation.id}`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            "headline": mitigation.name,
            "description": mitigation.description,
            "url": `https://agenticsecurity.info/controls/${mitigation.id}`,
            "datePublished": new Date().toISOString(),
            "dateModified": new Date().toISOString(),
            "author": {
              "@type": "Organization",
              "name": "OWASP"
            },
            "publisher": {
              "@type": "Organization",
              "name": "OWASP",
              "url": "https://owasp.org"
            },
            "about": "AI Security Control",
            "keywords": mitigation.tags?.join(', ') || '',
            "isPartOf": {
              "@type": "WebSite",
              "name": "OWASP Securing Agentic Applications Guide",
              "url": "https://agenticsecurity.info"
            }
          })}
        </script>
      </Helmet>
      <Header 
        onMobileMenuToggle={handleMobileMenuToggle} 
        isMobileMenuOpen={isMobileMenuOpen} 
      />
      
      {/* Mobile Navigation Sidebar */}
      <SidebarNav 
        type="controls" 
        activeId={mitigation.id} 
        isOpen={isMobileMenuOpen} 
        onClose={handleMobileMenuClose} 
      />
      
      <section className="py-12 bg-secondary/50 min-h-screen">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <Link to="/controls" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4">
                &larr; Back to Controls
              </Link>
              {/* Overview/Metadata Card */}
              <Card className="mb-4 border border-control/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {mitigation.icon && <Icon name={mitigation.icon} color={mitigation.color} size={32} />}
                    <h1 className="text-2xl font-bold text-foreground">{mitigation.name}</h1>
                    {mitigation.status && <Badge variant="outline" className="capitalize ml-2">{mitigation.status}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(mitigation.tags || []).map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                  <div className="text-xs text-muted-foreground mb-1">Version: {mitigation.version || "-"} | Last Updated: {mitigation.lastUpdated || "-"} | Updated By: {mitigation.updatedBy || "-"}</div>
                  {mitigation.references && mitigation.references.length > 0 && <div className="text-xs mt-1">{mitigation.references.map(ref => <a key={ref.url} href={ref.url} target="_blank" rel="noopener noreferrer" className="underline text-primary hover:text-primary/80 mr-2">{ref.title}</a>)}</div>}
                  <div className="text-muted-foreground mt-4 leading-relaxed">
                    {enhanceTextWithInteractivity(mitigation.description)}
                  </div>
                  {/* Analytics widgets */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="bg-muted rounded-lg border p-2 flex flex-col items-center min-w-[100px]">
                      <div className="text-xs text-muted-foreground mb-1">Threats</div>
                      <span className="font-bold text-lg text-threat">{threatCount}</span>
                    </div>
                    <div className="bg-muted rounded-lg border p-2 flex flex-col items-center min-w-[100px]">
                      <div className="text-xs text-muted-foreground mb-1">Tags</div>
                      <span className="font-bold text-lg text-yellow-600 dark:text-yellow-400">{tagCount}</span>
                    </div>
                    <div className="bg-muted rounded-lg border p-2 flex flex-col items-center min-w-[100px]">
                      <div className="text-xs text-muted-foreground mb-1">Phases</div>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{phaseCount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Implementation Progress Card */}
              {totalItems > 0 && (
                <Card className="mb-4 border border-green-200 dark:border-green-800">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-semibold text-green-700 dark:text-green-300">Implementation Progress</h2>
                      <Badge variant={overallProgress === 100 ? "default" : "secondary"} className="text-sm">
                        {Math.round(overallProgress)}% Complete
                      </Badge>
                    </div>
                    <Progress value={overallProgress} className="h-3 mb-3" />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{completedItems} of {totalItems} tasks completed</span>
                      {overallProgress === 100 && (
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="font-medium">All Done!</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Implementation Details with Accordion */}
              <div className="space-y-4">
                <Accordion type="multiple" defaultValue={["design-phase", "threats"]} className="w-full">
                  {/* Design Phase */}
                  {mitigation.implementationDetail.design && mitigation.implementationDetail.design.trim() && (
                    <AccordionItem value="design-phase" className="border border-blue-200 dark:border-blue-800 rounded-lg bg-card shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-blue-50/50 dark:hover:bg-blue-950/50 transition-colors rounded-t-lg">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
                          <span className="text-base font-semibold text-blue-700 dark:text-blue-300">Design Phase</span>
                          <Badge variant="outline" className="ml-auto mr-4 bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700">
                            {mitigation.implementationDetail.design.split('\n').filter(l => l.trim().startsWith('- ')).length} items
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2 bg-gradient-to-b from-blue-50/20 to-transparent dark:from-blue-950/20">
                        {renderSectionContent(mitigation.implementationDetail.design, "design-phase")}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Build Phase */}
                  {mitigation.implementationDetail.build && mitigation.implementationDetail.build.trim() && (
                    <AccordionItem value="build-phase" className="border border-yellow-200 dark:border-yellow-800 rounded-lg bg-card shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-yellow-50/50 dark:hover:bg-yellow-950/50 transition-colors rounded-t-lg">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
                          <span className="text-base font-semibold text-yellow-700 dark:text-yellow-300">Build Phase</span>
                          <Badge variant="outline" className="ml-auto mr-4 bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700">
                            {mitigation.implementationDetail.build.split('\n').filter(l => l.trim().startsWith('- ')).length} items
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2 bg-gradient-to-b from-yellow-50/20 to-transparent dark:from-yellow-950/20">
                        {renderSectionContent(mitigation.implementationDetail.build, "build-phase")}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Operation Phase */}
                  {mitigation.implementationDetail.operations && mitigation.implementationDetail.operations.trim() && (
                    <AccordionItem value="operation-phase" className="border border-green-200 dark:border-green-800 rounded-lg bg-card shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-green-50/50 dark:hover:bg-green-950/50 transition-colors rounded-t-lg">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
                          <span className="text-base font-semibold text-green-700 dark:text-green-300">Operation Phase</span>
                          <Badge variant="outline" className="ml-auto mr-4 bg-green-50 dark:bg-green-950 border-green-300 dark:border-green-700">
                            {mitigation.implementationDetail.operations.split('\n').filter(l => l.trim().startsWith('- ')).length} items
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2 bg-gradient-to-b from-green-50/20 to-transparent dark:from-green-950/20">
                        {renderSectionContent(mitigation.implementationDetail.operations, "operation-phase")}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Tools & Frameworks */}
                  {mitigation.implementationDetail.toolsAndFrameworks && mitigation.implementationDetail.toolsAndFrameworks.trim() && (
                    <AccordionItem value="tools-frameworks" className="border border-purple-200 dark:border-purple-800 rounded-lg bg-card shadow-sm">
                      <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-purple-50/50 dark:hover:bg-purple-950/50 transition-colors rounded-t-lg">
                        <div className="flex items-center gap-3 w-full">
                          <div className="w-3 h-3 rounded-full bg-purple-500 shadow-sm"></div>
                          <span className="text-base font-semibold text-purple-700 dark:text-purple-300">Tools & Frameworks</span>
                          <Badge variant="outline" className="ml-auto mr-4 bg-purple-50 dark:bg-purple-950 border-purple-300 dark:border-purple-700">
                            {mitigation.implementationDetail.toolsAndFrameworks.split('\n').filter(l => l.trim().startsWith('- ')).length} items
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 pt-2 bg-gradient-to-b from-purple-50/20 to-transparent dark:from-purple-950/20">
                        {renderSectionContent(mitigation.implementationDetail.toolsAndFrameworks, "tools-frameworks")}
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  {/* Mitigates Threats */}
                  <AccordionItem value="threats" className="border border-red-200 dark:border-red-800 rounded-lg bg-card shadow-sm">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-red-50/50 dark:hover:bg-red-950/50 transition-colors rounded-t-lg">
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
                        <span className="text-base font-semibold text-red-700 dark:text-red-300">Mitigates Threats</span>
                        <Badge variant="outline" className="ml-auto mr-4 bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-700">
                          {threats.length} threats
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-6 pt-2 bg-gradient-to-b from-red-50/20 to-transparent dark:from-red-950/20">
                      {threats.length > 0 ? (
                        <div className="grid gap-3">
                          {threats.map(threat => (
                            <HoverCard key={threat.id}>
                              <HoverCardTrigger asChild>
                                <Link 
                                  to={`/threats/${threat.id}`} 
                                  className="flex items-center gap-3 p-3 rounded-lg border border-red-100 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 transition-colors group"
                                >
                                  <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform"></div>
                                  <div className="flex-1">
                                    <div className="font-medium text-red-700 dark:text-red-300 group-hover:text-red-600 dark:group-hover:text-red-200">
                                      {threat.code} - {threat.name}
                                    </div>
                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                      {enhanceTextWithInteractivity(threat.description)}
                                    </div>
                                  </div>
                                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                                </Link>
                              </HoverCardTrigger>
                              <HoverCardContent className="w-80">
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300">
                                    {threat.code} - {threat.name}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {enhanceTextWithInteractivity(threat.description)}
                                  </p>
                                  {threat.impactLevel && (
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs font-medium">Impact Level:</span>
                                      <Badge variant={threat.impactLevel === 'high' ? 'destructive' : threat.impactLevel === 'medium' ? 'secondary' : 'outline'}>
                                        {threat.impactLevel}
                                      </Badge>
                                    </div>
                                  )}
                                  {threat.tags && threat.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {threat.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </HoverCardContent>
                            </HoverCard>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <Circle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No threats documented for this control.</p>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ControlDetail; 